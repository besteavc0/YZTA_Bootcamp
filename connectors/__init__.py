"""
Bu modül import edildiğinde, mevcut tüm connector implementasyonları
otomatik olarak registry'ye kaydedilir.

Henüz implement edilmemiş connector'lar (ör. sap_b1, logo, oracle) sessizce
atlanır; ilgili task'ta dosya eklendiğinde otomatik devreye girer.
"""
import importlib

from connectors.registry import register_connector

_KNOWN_CONNECTORS = [
    ("connectors.csv.connector", "csv", "CSVConnector"),           # TASK-006 (P2)
    ("connectors.dolibarr.connector", "dolibarr", "DolibarrConnector"),  # ücretsiz ERP denemesi (P1)
    ("connectors.sap_b1.connector", "sap_b1", "SAPB1Connector"),   # TASK-035 (P2) / ürün fazı
    ("connectors.logo.connector", "logo", "LogoConnector"),        # TASK-035 (P2) / ürün fazı
    ("connectors.oracle.connector", "oracle", "OracleConnector"),  # ürün fazı
]

for module_path, conn_type, cls_name in _KNOWN_CONNECTORS:
    try:
        module = importlib.import_module(module_path)
        cls = getattr(module, cls_name, None)
        if cls is not None:
            register_connector(conn_type, cls)
    except ModuleNotFoundError:
        continue
