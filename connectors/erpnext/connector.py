"""
ERPNext (Frappe Framework) REST API connector - TASK-035a.

config sozlugu su alanlari icerir:
    tenant_id       : str  - hangi tenant'a ait oldugu (UUID string)
    base_url        : str  - orn. http://localhost:8080 (Docker'da erpnext servisi)
    api_key         : str  - Frappe API key
    api_secret      : str  - Frappe API secret
    source          : str  - opsiyonel, varsayilan "erpnext"
    database_url    : str  - opsiyonel, verilmezse DATABASE_URL env degiskeni kullanilir

Auth: Frappe REST API, "Authorization: token {api_key}:{api_secret}" header'i bekler.
Sayfalama: ERPNext varsayilan olarak sayfa basina 20 kayit doner, limit_start ile
tum kayitlar donene kadar dongu yapilir (plan geregi).
"""
from __future__ import annotations

import os
import uuid
from datetime import datetime
from typing import Any

import httpx
import psycopg2
from psycopg2.extras import execute_values

from connectors.base import ERPConnector, SyncResult, TableSchema

DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/erpilot"
PAGE_SIZE = 20


class ERPNextConnector(ERPConnector):
    """ERPNext (Frappe) REST API tabanli ERP veri kaynagi connector'i."""

    SOURCE = "erpnext"

    def __init__(self, config: dict[str, Any]):
        super().__init__(config)
        self.base_url = str(config.get("base_url", "")).rstrip("/")
        self.api_key = config.get("api_key", "")
        self.api_secret = config.get("api_secret", "")
        self.tenant_id = config.get("tenant_id")
        self.source = config.get("source", self.SOURCE)
        self.database_url = config.get(
            "database_url", os.environ.get("DATABASE_URL", DEFAULT_DATABASE_URL)
        )

    # ------------------------------------------------------------------
    # Yardimci HTTP metodlari
    # ------------------------------------------------------------------

    @property
    def _headers(self) -> dict:
        return {
            "Authorization": f"token {self.api_key}:{self.api_secret}",
            "Accept": "application/json",
        }

    def _get_paginated(self, doctype: str, fields: list[str], filters: list | None = None) -> list[dict]:
        """Bir DocType'tan tum kayitlari sayfalayarak ceker."""
        import json as json_module

        results: list[dict] = []
        limit_start = 0

        with httpx.Client(timeout=30) as client:
            while True:
                params = {
                    "fields": json_module.dumps(fields),
                    "limit_start": limit_start,
                    "limit_page_length": PAGE_SIZE,
                }
                if filters:
                    params["filters"] = json_module.dumps(filters)

                resp = client.get(
                    f"{self.base_url}/api/resource/{doctype}",
                    headers=self._headers,
                    params=params,
                )
                resp.raise_for_status()
                data = resp.json().get("data", [])
                if not data:
                    break
                results.extend(data)
                if len(data) < PAGE_SIZE:
                    break
                limit_start += PAGE_SIZE

        return results

    # ------------------------------------------------------------------
    # ERPConnector arayuzu
    # ------------------------------------------------------------------

    def test_connection(self) -> bool:
        """frappe.auth.get_logged_user cagirarak baglantiyi ve credential'lari dogrular."""
        if not self.base_url or not self.api_key or not self.api_secret:
            return False
        try:
            with httpx.Client(timeout=15) as client:
                resp = client.get(
                    f"{self.base_url}/api/method/frappe.auth.get_logged_user",
                    headers=self._headers,
                )
                return resp.status_code == 200
        except httpx.HTTPError:
            return False
        except httpx.ConnectError:
            return False

    def extract_tables(self) -> list[TableSchema]:
        """Desteklenen 3 DocType icin tablo semasini dondurur."""
        try:
            with httpx.Client(timeout=15) as client:
                client.get(
                    f"{self.base_url}/api/resource/Sales Order",
                    headers=self._headers,
                    params={"fields": '["name"]', "limit_page_length": 1},
                )
        except httpx.HTTPError:
            pass

        return [
            TableSchema(
                name="Sales Order",
                columns=[
                    {"name": "name"}, {"name": "customer"}, {"name": "transaction_date"},
                    {"name": "grand_total"}, {"name": "status"},
                ],
            ),
            TableSchema(
                name="Customer",
                columns=[
                    {"name": "name"}, {"name": "customer_name"},
                    {"name": "territory"}, {"name": "customer_group"},
                ],
            ),
            TableSchema(
                name="Item",
                columns=[{"name": "name"}, {"name": "item_name"}, {"name": "item_group"}],
            ),
        ]

    def sync_incremental(self, since: datetime | None = None) -> SyncResult:
        if not self.tenant_id:
            return SyncResult(success=False, error="config icinde tenant_id eksik")

        try:
            rows_synced = 0
            rows_synced += self._sync_customers()
            rows_synced += self._sync_orders()
            rows_synced += self._sync_inventory()
            return SyncResult(success=True, rows_synced=rows_synced)
        except httpx.HTTPStatusError as exc:
            return SyncResult(
                success=False,
                error=f"ERPNext API hatasi: HTTP {exc.response.status_code}",
            )
        except httpx.HTTPError as exc:
            return SyncResult(success=False, error=f"ERPNext baglanti hatasi: {exc}")
        except Exception as exc:
            return SyncResult(success=False, error=f"Beklenmeyen hata: {exc}")

    # ------------------------------------------------------------------
    # Senkronizasyon - entity bazli
    # ------------------------------------------------------------------

    def _sync_customers(self) -> int:
        # ERPNext'te Customer dokümanında "city" direkt yok, "territory" var
        raw = self._get_paginated(
            "Customer", ["name", "customer_name", "territory", "customer_group"]
        )
        rows = [
            (
                str(uuid.uuid4()), self.tenant_id, str(c.get("name")), self.source,
                c.get("customer_name") or c.get("name") or "", 
                c.get("territory") or None,  # city yerine standart territory alanını eşliyoruz
                c.get("customer_group"),
            )
            for c in raw
        ]
        if not rows:
            return 0
        conn = psycopg2.connect(self.database_url)
        try:
            with conn:
                with conn.cursor() as cur:
                    execute_values(
                        cur,
                        """
                        INSERT INTO canonical_customers
                            (id, tenant_id, external_id, source, name, city, segment)
                        VALUES %s
                        ON CONFLICT (tenant_id, external_id, source) DO UPDATE
                            SET name = EXCLUDED.name,
                                city = EXCLUDED.city,
                                segment = EXCLUDED.segment,
                                updated_at = NOW()
                        """,
                        rows,
                    )
            return len(rows)
        finally:
            conn.close()

    def _sync_orders(self) -> int:
        raw = self._get_paginated(
            "Sales Order",
            ["name", "customer", "transaction_date", "grand_total", "status"],
        )
        rows = [
            (
                str(uuid.uuid4()), self.tenant_id, str(o.get("name")), self.source,
                str(o.get("customer")) if o.get("customer") else None,
                o.get("transaction_date"), float(o.get("grand_total") or 0),
                (o.get("status") or "pending").lower(),
            )
            for o in raw
        ]
        if not rows:
            return 0
        conn = psycopg2.connect(self.database_url)
        try:
            with conn:
                with conn.cursor() as cur:
                    execute_values(
                        cur,
                        """
                        INSERT INTO canonical_orders
                            (id, tenant_id, external_id, source, customer_external_id,
                             order_date, total_amount, status)
                        VALUES %s
                        ON CONFLICT (tenant_id, external_id, source) DO UPDATE
                            SET total_amount = EXCLUDED.total_amount,
                                status = EXCLUDED.status,
                                updated_at = NOW()
                        """,
                        rows,
                    )
            return len(rows)
        finally:
            conn.close()

    def _sync_inventory(self) -> int:
        raw_items = self._get_paginated("Item", ["name", "item_name", "item_group"])
        raw_bins = self._get_paginated("Bin", ["item_code", "actual_qty", "reserved_qty", "warehouse"])

        bin_by_item: dict[str, dict] = {}
        for b in raw_bins:
            item_code = str(b.get("item_code"))
            bin_by_item.setdefault(item_code, b)

        rows = []
        for item in raw_items:
            item_code = str(item.get("name"))
            bin_data = bin_by_item.get(item_code, {})
            rows.append(
                (
                    str(uuid.uuid4()), self.tenant_id, item_code, self.source,
                    item.get("item_name") or item_code,
                    bin_data.get("warehouse"),
                    float(bin_data.get("actual_qty") or 0),
                    float(bin_data.get("reserved_qty") or 0),
                )
            )

        if not rows:
            return 0
        conn = psycopg2.connect(self.database_url)
        try:
            with conn:
                with conn.cursor() as cur:
                    execute_values(
                        cur,
                        """
                        INSERT INTO canonical_inventory
                            (id, tenant_id, external_id, source, product_name,
                             warehouse, quantity, reorder_level)
                        VALUES %s
                        ON CONFLICT (tenant_id, external_id, source, warehouse) DO UPDATE
                            SET quantity = EXCLUDED.quantity,
                                reorder_level = EXCLUDED.reorder_level,
                                updated_at = NOW()
                        """,
                        rows,
                    )
            return len(rows)
        finally:
            conn.close()