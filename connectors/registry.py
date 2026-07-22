"""
Connector registry: connector tipi (string) -> connector sınıfı eşlemesi.

Yeni connector eklerken bu dosyaya da DOKUNULMAZ; kayıt işlemi
`connectors/__init__.py` içinden `register_connector()` çağrısıyla yapılır.
"""
from __future__ import annotations

from typing import Any

from connectors.base import ERPConnector

CONNECTOR_REGISTRY: dict[str, type[ERPConnector]] = {}


def register_connector(connector_type: str, cls: type[ERPConnector]) -> None:
    """Bir connector sınıfını registry'ye kaydeder."""
    CONNECTOR_REGISTRY[connector_type] = cls


def get_connector(connector_type: str, config: dict[str, Any]) -> ERPConnector:
    """
    Verilen tipe karşılık gelen connector'ı örnekleyip döndürür.

    Raises:
        ValueError: `connector_type` registry'de tanımlı değilse.
    """
    cls = CONNECTOR_REGISTRY.get(connector_type)
    if cls is None:
        available = ", ".join(sorted(CONNECTOR_REGISTRY)) or "(kayıtlı connector yok)"
        raise ValueError(
            f"Tanımsız connector tipi: '{connector_type}'. Kayıtlı tipler: {available}"
        )
    return cls(config)
