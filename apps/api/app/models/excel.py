import uuid
from datetime import datetime
from typing import Any
from sqlalchemy import String, Integer, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class ExcelUpload(Base):
    __tablename__ = "excel_uploads"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=func.uuid_generate_v4())
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    uploaded_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    column_mapping: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    row_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # NOT: init_db.sql'deki orijinal şemada yoktu, TASK-026'nın (Excel vs ERP
    # diff motoru) çalışabilmesi için eklendi. Ham dosya diske/S3'e
    # yazılmadığından, parse edilmiş satırlar burada JSON olarak saklanır.
    raw_data: Mapped[list[dict[str, Any]] | None] = mapped_column(JSONB, nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class ExcelDiffResult(Base):
    __tablename__ = "excel_diff_results"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=func.uuid_generate_v4())
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    upload_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("excel_uploads.id", ondelete="CASCADE"), nullable=False)
    diff_type: Mapped[str] = mapped_column(String(20), nullable=False)
    external_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    excel_data: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    erp_data: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
