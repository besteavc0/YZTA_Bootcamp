"""ERP connection ve sync run icin Pydantic semalari (TASK-007)."""
from datetime import datetime
from typing import Any
from pydantic import BaseModel
from uuid import UUID


class ERPConnectionCreate(BaseModel):
    name: str
    connector_type: str  # csv | erpnext | dolibarr | sap_b1 | logo
    config: dict[str, Any]  # duz JSON gelir, backend'de encrypt edilecek (TASK-020)


class ERPConnectionResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    name: str
    connector_type: str
    is_active: bool
    last_sync_at: datetime | None = None
    last_sync_status: str | None = None
    created_at: datetime


class SyncRunResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    erp_connection_id: UUID
    started_at: datetime
    finished_at: datetime | None = None
    rows_synced: int | None = None
    status: str
    error_message: str | None = None


class SyncTriggerResponse(BaseModel):
    message: str
    task_id: str
