"""
Dolibarr ERP connector.

Dolibarr'ın REST API'sinden (DOLAPIKEY auth) müşteri, ürün/stok ve sipariş
verisini çekip ERPilot'un canonical şemasına normalize eder.

Config alanları (erp_connections.config_encrypted içinde şifreli tutulur):
    base_url : Dolibarr kök URL'i, ör. "http://localhost:8080"
    api_key  : Dolibarr API anahtarı (DOLAPIKEY)

Mapping (Dolibarr -> canonical):
    thirdparties (mode=1, müşteri) -> canonical_customers
        id/name/town  -> external_id/name/city
    products                       -> canonical_inventory
        ref/label/stock_reel/seuil_stock_alerte -> external_id/product_name/quantity/reorder_level
    orders                         -> canonical_orders
        ref/socid/date/total_ttc/statut -> external_id/customer_external_id/order_date/total_amount/status
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

import httpx

from connectors.base import ERPConnector, SyncResult, TableSchema

logger = logging.getLogger("erpilot.connectors.dolibarr")

# Dolibarr sipariş statü kodu -> canonical status
# (0=taslak,1=onaylandı,2=işleniyor,3=teslim edildi,-1=iptal)
_ORDER_STATUS_MAP = {
    "0": "pending",
    "1": "pending",
    "2": "pending",
    "3": "completed",
    "-1": "cancelled",
}


class DolibarrConnector(ERPConnector):
    """Dolibarr REST API connector."""

    SOURCE = "dolibarr"

    def __init__(self, config: dict[str, Any]):
        super().__init__(config)
        self.base_url = str(config.get("base_url", "")).rstrip("/")
        self.api_key = config.get("api_key", "")
        # sync_incremental sonucunda canonical satırları burada toplanır (test/entegrasyon için)
        self.customers: list[dict] = []
        self.inventory: list[dict] = []
        self.orders: list[dict] = []

    # ---- yardımcılar ----
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
                    # Dolibarr boş listede bazen 404 döndürür
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

    # ---- ERPConnector sözleşmesi ----
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
                # /status kapalıysa thirdparties ile dene
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
            # Unix timestamp (Dolibarr çoğu tarihi epoch olarak döner)
            ts = int(value)
            return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()
        except (ValueError, TypeError):
            return str(value)

    def sync_incremental(self, since: datetime | None = None) -> SyncResult:
        """
        Dolibarr'dan veriyi çekip canonical formata dönüştürür.

        Not: Bu metod canonical satırları self.customers/inventory/orders içine
        doldurur ve toplam satır sayısını döndürür. DB'ye yazma işlemi çağıran
        katmanda (Celery sync task / servis) yapılır; böylece connector DB'den
        bağımsız kalır ve test edilebilir olur.
        """
        try:
            rows_synced = 0

            # 1) Müşteriler (thirdparties, mode=1 -> müşteri)
            raw_customers = self._get("thirdparties", {"mode": 1})
            for c in raw_customers:
                self.customers.append(
                    {
                        "external_id": str(c.get("id")),
                        "source": self.SOURCE,
                        "name": c.get("name") or c.get("nom") or "",
                        "city": c.get("town") or c.get("ville"),
                        "segment": None,
                    }
                )
            rows_synced += len(raw_customers)

            # 2) Ürünler / stok (products)
            raw_products = self._get("products")
            for p in raw_products:
                self.inventory.append(
                    {
                        "external_id": str(p.get("ref") or p.get("id")),
                        "source": self.SOURCE,
                        "product_name": p.get("label") or "",
                        "warehouse": None,
                        "quantity": float(p.get("stock_reel") or 0),
                        "reorder_level": float(p.get("seuil_stock_alerte") or 0),
                    }
                )
            rows_synced += len(raw_products)

            # 3) Siparişler (orders)
            raw_orders = self._get("orders")
            for o in raw_orders:
                statut = str(o.get("statut", o.get("status", "")))
                self.orders.append(
                    {
                        "external_id": str(o.get("ref") or o.get("id")),
                        "source": self.SOURCE,
                        "customer_external_id": str(o.get("socid")) if o.get("socid") else None,
                        "order_date": self._parse_date(o.get("date") or o.get("date_commande")),
                        "total_amount": float(o.get("total_ttc") or 0),
                        "status": _ORDER_STATUS_MAP.get(statut, "pending"),
                    }
                )
            rows_synced += len(raw_orders)

            logger.info(
                "dolibarr_sync_done customers=%d products=%d orders=%d",
                len(self.customers),
                len(self.inventory),
                len(self.orders),
            )
            return SyncResult(success=True, rows_synced=rows_synced)

        except httpx.HTTPStatusError as exc:
            msg = f"Dolibarr API hatası: HTTP {exc.response.status_code}"
            logger.error(msg)
            return SyncResult(success=False, error=msg)
        except httpx.HTTPError as exc:
            msg = f"Dolibarr bağlantı hatası: {exc}"
            logger.error(msg)
            return SyncResult(success=False, error=msg)
        except (ValueError, KeyError) as exc:
            msg = f"Dolibarr veri ayrıştırma hatası: {exc}"
            logger.error(msg)
            return SyncResult(success=False, error=msg)
