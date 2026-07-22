"""
Dolibarr connector testleri.

Gerçek Dolibarr olmadan, httpx yanıtları mock'lanarak canonical mapping doğrulanır.
Gerçek entegrasyon testi için: RUN_DOLIBARR_TESTS=1 + DOLIBARR_URL + DOLIBARR_KEY env.
"""
import os
from unittest.mock import MagicMock, patch

import pytest

from connectors.dolibarr.connector import DolibarrConnector
from connectors.registry import get_connector


def test_registered_in_registry():
    import connectors  # noqa: F401
    c = get_connector("dolibarr", {"base_url": "http://x:8080", "api_key": "k"})
    assert isinstance(c, DolibarrConnector)


def test_api_root_and_headers():
    c = DolibarrConnector({"base_url": "http://localhost:8080/", "api_key": "secret"})
    assert c._api_root == "http://localhost:8080/api/index.php"
    assert c._headers["DOLAPIKEY"] == "secret"


def test_test_connection_requires_config():
    assert DolibarrConnector({}).test_connection() is False
    assert DolibarrConnector({"base_url": "http://x"}).test_connection() is False


def test_sync_maps_dolibarr_to_canonical():
    """Dolibarr JSON yanıtlarının canonical şemaya doğru map edildiğini doğrular."""
    c = DolibarrConnector({"base_url": "http://localhost:8080", "api_key": "k"})

    fake_customers = [{"id": 1, "name": "Acme Ltd", "town": "İstanbul"}]
    fake_products = [
        {"ref": "PRD-1", "label": "Widget", "stock_reel": "5", "seuil_stock_alerte": "10"}
    ]
    fake_orders = [
        {"ref": "CMD-1", "socid": 1, "date": 1720000000, "total_ttc": "1500.50", "statut": "3"}
    ]

    def fake_get(endpoint, params=None):
        if endpoint == "thirdparties":
            return fake_customers
        if endpoint == "products":
            return fake_products
        if endpoint == "orders":
            return fake_orders
        return []

    with patch.object(c, "_get", side_effect=fake_get):
        result = c.sync_incremental()

    assert result.success is True
    assert result.rows_synced == 3

    # Müşteri mapping
    assert c.customers[0]["external_id"] == "1"
    assert c.customers[0]["name"] == "Acme Ltd"
    assert c.customers[0]["city"] == "İstanbul"
    assert c.customers[0]["source"] == "dolibarr"

    # Stok mapping (kritik stok: 5 < 10)
    assert c.inventory[0]["external_id"] == "PRD-1"
    assert c.inventory[0]["quantity"] == 5.0
    assert c.inventory[0]["reorder_level"] == 10.0

    # Sipariş mapping (statut 3 -> completed)
    assert c.orders[0]["external_id"] == "CMD-1"
    assert c.orders[0]["total_amount"] == 1500.50
    assert c.orders[0]["status"] == "completed"
    assert c.orders[0]["customer_external_id"] == "1"


def test_sync_handles_http_error():
    import httpx

    c = DolibarrConnector({"base_url": "http://localhost:8080", "api_key": "k"})
    with patch.object(c, "_get", side_effect=httpx.ConnectError("bağlanılamadı")):
        result = c.sync_incremental()
    assert result.success is False
    assert "bağlantı hatası" in result.error.lower() or "baglanti" in result.error.lower()


@pytest.mark.skipif(
    os.environ.get("RUN_DOLIBARR_TESTS") != "1",
    reason="Gerçek Dolibarr gerekir; RUN_DOLIBARR_TESTS=1 + DOLIBARR_URL + DOLIBARR_KEY ile çalıştırın.",
)
def test_real_dolibarr_connection():
    c = DolibarrConnector(
        {
            "base_url": os.environ["DOLIBARR_URL"],
            "api_key": os.environ["DOLIBARR_KEY"],
        }
    )
    assert c.test_connection() is True
    result = c.sync_incremental()
    assert result.success is True
