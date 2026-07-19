"""TASK-025/026 · Excel Pydantic şemaları — tam hali."""

from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ExcelUploadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    upload_id: UUID
    filename: str
    entity_type: str
    row_count: int
    detected_columns: list[str]
    column_mapping: dict[str, str]


class CompareRequest(BaseModel):
    upload_id: UUID


class CompareResponse(BaseModel):
    upload_id: UUID
    total_diffs: int
    only_in_excel_count: int
    only_in_erp_count: int
    mismatch_count: int


class DiffResultResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    diff_type: str
    external_id: Optional[str] = None
    excel_data: Optional[dict[str, Any]] = None
    erp_data: Optional[dict[str, Any]] = None
    created_at: datetime
