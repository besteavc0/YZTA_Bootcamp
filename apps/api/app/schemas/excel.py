"""
TASK-014 · Excel Pydantic şema iskeleti

Bu şemalar Sprint 2 - TASK-025 (Excel upload & kolon eşleme) ve
TASK-026 (Excel vs ERP diff motoru) task'larında tamamlanacaktır.
Şu an sadece iskelet/placeholder alanlar bulunmaktadır.
"""

from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from enum import Enum


class ExcelUploadRequest(BaseModel):
    """
    Excel yükleme isteği şeması.
    TODO (Sprint 2): tenant_id, kolon eşleme (mapping) bilgisi eklenecek.
    """
    filename: str
    # TODO: column_mapping: Dict[str, str]  -- örn. {"SiparisNo": "order_id"}
    pass


class ExcelUploadResponse(BaseModel):
    """
    Excel yükleme sonucu şeması.
    TODO (Sprint 2): satır/kolon sayısı, önizleme verisi, hata listesi eklenecek.
    """
    filename: str
    n_rows: int
    n_columns: int
    # TODO: preview: List[Dict[str, Any]]
    # TODO: validation_errors: List[str]
    pass


class DiffCategory(str, Enum):
    """Excel vs ERP karşılaştırma sonucu kategorileri (Sprint 2 - TASK-026)."""
    MATCH = "match"
    MISMATCH = "mismatch"
    ONLY_IN_EXCEL = "only_in_excel"
    ONLY_IN_ERP = "only_in_erp"


class DiffResult(BaseModel):
    """
    Excel vs ERP karşılaştırma tek bir satır sonucu.
    TODO (Sprint 2): alanlar diff motoru tasarımına göre netleştirilecek.
    """
    category: DiffCategory
    # TODO: record_id: Optional[str]
    # TODO: excel_value: Optional[Dict[str, Any]]
    # TODO: erp_value: Optional[Dict[str, Any]]
    # TODO: differences: Optional[Dict[str, Any]]
    pass
