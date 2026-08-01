from __future__ import annotations

import os
import uuid

import psycopg2
from psycopg2.extras import execute_values

import logging
from datetime import datetime, timezone
from typing import Any

import httpx

from connectors.base import ERPConnector, SyncResult, TableSchema

logger = logging.getLogger("erpilot.connectors.dolibarr")

DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/erpilot"

# Dolibarr sipariş statü kodu -> canonical status
# (0=taslak,1=onaylandı,2=işleniyor,3=teslim edildi,-1=iptal)
_ORDER_STATUS_MAP = {
    "0": "draft",
    "1": "confirmed",
    "2": "delivered",
    "3": "invoiced",
    "-1": "cancelled",
}


class DolibarrConnector(ERPConnector):
    """Dolibarr REST API connector."""

    SOURCE = "dolibarr"

    def __init__(self, config: dict[str, Any]):
        super().__init__(config)
        self.base_url = str(config.get("base_url", "")).rstrip("/")
        self.api_key = config.get("api_key", "")
        self.customers: list[dict] = []
        self.inventory: list[dict] = []
        self.orders: list[dict] = []
        self.tenant_id = config.get("tenant_id")
        self.source = config.get("source", self.SOURCE)
        self.database_url = config.get(
            "database_url", os.environ.get("DATABASE_URL", DEFAULT_DATABASE_URL)
        )

  
    @property
    def _api_root(self) -> str:
        return f"{self.base_url}/api/index.php"

    @property
    def _headers(self) -> dict:
        return {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "DOLAPIKEY": self.api_key,
        }

    def _get(self, endpoint: str, params: dict | None = None) -> list[dict]:
        """Dolibarr'dan sayfalı liste çeker (tüm sayfaları toplar)."""
        results: list[dict] = []
        page = 0
        limit = 100
        with httpx.Client(timeout=30) as client:
            while True:
                q = {"limit": limit, "page": page}
                if params:
                    q.update(params)
                resp = client.get(f"{self._api_root}/{endpoint}", headers=self._headers, params=q)
                if resp.status_code == 404:
                    break
                resp.raise_for_status()
                data = resp.json()
                if not isinstance(data, list) or not data:
                    break
                results.extend(data)
                if len(data) < limit:
                    break
                page += 1
        return results


    def test_connection(self) -> bool:
        """API'ye basit bir istek atarak bağlantıyı ve api_key'i doğrular."""
        if not self.base_url or not self.api_key:
            return False
        try:
            with httpx.Client(timeout=15) as client:
                resp = client.get(
                    f"{self._api_root}/status",
                    headers=self._headers,
                )
                if resp.status_code == 200:
                    return True
                resp2 = client.get(
                    f"{self._api_root}/thirdparties",
                    headers=self._headers,
                    params={"limit": 1},
                )
                return resp2.status_code in (200, 404)
        except httpx.HTTPError as exc:
            logger.warning("dolibarr_test_connection_failed err=%s", exc)
            return False

    def extract_tables(self) -> list[TableSchema]:
        return [
            TableSchema(name="thirdparties", columns=[{"name": "name"}, {"name": "town"}]),
            TableSchema(
                name="products",
                columns=[{"name": "ref"}, {"name": "label"}, {"name": "stock_reel"}],
            ),
            TableSchema(
                name="orders",
                columns=[{"name": "ref"}, {"name": "socid"}, {"name": "total_ttc"}],
            ),
        ]

    def _parse_date(self, value: Any) -> str:
        """Dolibarr tarih alanı (unix ts veya 'YYYY-MM-DD') -> ISO string."""
        if value is None or value == "":
            return datetime.now(timezone.utc).isoformat()
        try:
            # Unix timestamp (çoğu tarihi epoch olarak döndüğü için)
            ts = int(value)
            return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()
        except (ValueError, TypeError):
            return str(value)

    def sync_incremental(self, since: datetime | None = None) -> SyncResult:
        if not self.tenant_id:
            return SyncResult(success=False, error="config içinde tenant_id eksik")

        try:
            rows_synced = 0
            rows_synced += self._sync_customers()
            rows_synced += self._sync_inventory()
            rows_synced += self._sync_orders()

            logger.info("dolibarr_sync_done rows_synced=%d", rows_synced)

            return SyncResult(success=True, rows_synced=rows_synced)

        except httpx.HTTPStatusError as exc:
            msg = f"Dolibarr API hatası: HTTP {exc.response.status_code}"
            logger.error(msg)
            return SyncResult(success=False, error=msg)
        except httpx.HTTPError as exc:
            msg = f"Dolibarr bağlantı hatası: {exc}"
            logger.error(msg)
            return SyncResult(success=False, error=msg)
        except (ValueError, KeyError, psycopg2.Error) as exc:
            msg = f"Dolibarr veri işleme hatası: {exc}"
            logger.error(msg)
            return SyncResult(success=False, error=msg)

    def _sync_customers(self) -> int:
        raw_customers = self._get("thirdparties", {"mode": 1})

        rows = [
            (
                str(uuid.uuid4()),
                self.tenant_id,
                str(c.get("id")),
                self.source,
                c.get("name") or c.get("nom") or "",
                c.get("town") or c.get("ville"),
                None,
            )
            for c in raw_customers
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

    def _sync_inventory(self) -> int:
        raw_products = self._get("products")

        rows = [
            (
                str(uuid.uuid4()),
                self.tenant_id,
                str(p.get("ref") or p.get("id")),
                self.source,
                p.get("label") or "",
                None,
                float(p.get("stock_reel") or 0),
                float(p.get("seuil_stock_alerte") or 0),
            )
            for p in raw_products
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
                        INSERT INTO canonical_inventory
                            (id, tenant_id, external_id, source, product_name,
                             warehouse, quantity, reorder_level)
                        VALUES %s
                        ON CONFLICT (tenant_id, external_id, source, warehouse) DO UPDATE
                            SET product_name = EXCLUDED.product_name,
                                quantity = EXCLUDED.quantity,
                                reorder_level = EXCLUDED.reorder_level,
                                updated_at = NOW()
                        """,
                        rows,
                    )

            return len(rows)
        finally:
            conn.close()

    def _sync_orders(self) -> int:
        raw_orders = self._get("orders", {"sortfield": "t.rowid", "sortorder": "ASC"})

        rows = []

        for o in raw_orders:
            statut = str(o.get("statut", o.get("status", "")))

            try:
                total_amount = float(o.get("total_ttc") or 0)
            except (ValueError, TypeError):
                total_amount = 0.0

            rows.append(
                (
                    str(uuid.uuid4()),
                    self.tenant_id,
                    str(o.get("ref") or o.get("id")),
                    self.source,
                    str(o.get("socid")) if o.get("socid") else None,
                    self._parse_date(o.get("date") or o.get("date_commande")),
                    total_amount,
                    _ORDER_STATUS_MAP.get(statut, "pending"),
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
                        INSERT INTO canonical_orders
                            (id, tenant_id, external_id, source, customer_external_id,
                             order_date, total_amount, status)
                        VALUES %s
                        ON CONFLICT (tenant_id, external_id, source) DO UPDATE
                            SET customer_external_id = EXCLUDED.customer_external_id,
                                order_date = EXCLUDED.order_date,
                                total_amount = EXCLUDED.total_amount,
                                status = EXCLUDED.status,
                                updated_at = NOW()
                        """,
                        rows,
                    )

            return len(rows)
        finally:
            conn.close()
