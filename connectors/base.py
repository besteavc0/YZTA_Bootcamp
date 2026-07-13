"""
ERP connector plugin mimarisinin temeli.

Yeni bir ERP kaynağı eklemek için:
    1. `connectors/<yeni_kaynak>/connector.py` içinde `ERPConnector`'ı miras alan
       bir sınıf yazılır.
    2. `connectors/__init__.py` üzerinden otomatik registry'ye kaydedilir.

Bu dosyaya (base.py) yeni connector eklerken DOKUNULMAZ.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass
class TableSchema:
    """Bir connector'ın çıkardığı tek bir tablo/kaynağın şema bilgisi."""

    name: str
    columns: list[dict] = field(default_factory=list)


@dataclass
class SyncResult:
    """Bir senkronizasyon çalıştırmasının sonucu."""

    success: bool
    rows_synced: int = 0
    error: str | None = None


class ERPConnector(ABC):
    """
    Tüm ERP connector'larının uyması gereken sözleşme.

    Her connector, tenant'a özel bağlantı bilgisini `config` dict'i olarak alır
    (ör. CSV için dosya yolu, SAP B1 için host/port/kullanıcı adı vb.).
    """

    def __init__(self, config: dict[str, Any]):
        self.config = config

    @abstractmethod
    def test_connection(self) -> bool:
        """Bağlantının kurulabildiğini/kaynağın erişilebilir olduğunu doğrular."""
        raise NotImplementedError

    @abstractmethod
    def extract_tables(self) -> list[TableSchema]:
        """Kaynaktaki tabloların/dosyaların şema bilgisini döndürür."""
        raise NotImplementedError

    @abstractmethod
    def sync_incremental(self, since: datetime | None = None) -> SyncResult:
        """
        Kaynaktaki veriyi (varsa `since` tarihinden itibaren) canonical
        tablolara senkronize eder ve sonucu döndürür.
        """
        raise NotImplementedError
