"""
TASK-025 · POST /api/v1/excel/upload endpoint
TASK-026'da bu dosyaya /compare ve /diffs/{upload_id} endpoint'leri eklenecek.

Not: CurrentUser, require_admin/require_user_or_admin TASK-017/018'de
(P1) gelecek. O modüller merge edilene kadar bu dosya import hatası
verir — bu beklenen bir durumdur.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.excel import ExcelDiffResult, ExcelUpload
from app.schemas.excel_full import (
    CompareRequest,
    CompareResponse,
    DiffResultResponse,
    ExcelUploadResponse,
)
from app.security.auth import CurrentUser
from app.services.excel_compare_service import (
    ExcelCompareService,
    ExcelValidationError,
    parse_excel,
)
from sqlalchemy import select

router = APIRouter(prefix="/excel", tags=["excel"])

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = (".xlsx", ".xls", ".csv")


@router.post("/upload", response_model=ExcelUploadResponse)
async def upload_excel(
    file: UploadFile = File(...),
    entity_type: str = Form(...),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> ExcelUploadResponse:
    # 1) Content-Type / uzantı kontrolü
    if not file.filename or not file.filename.lower().endswith(ALLOWED_EXTENSIONS):
        raise HTTPException(
            status_code=400,
            detail="Sadece .xlsx, .xls ve .csv dosyaları kabul edilir",
        )

    # 2) Dosya boyutu kontrolü (10 MB)
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Dosya boyutu 10 MB sınırını aşıyor",
        )

    # 3) Excel'i parse et ve kolon eşlemesini dene
    try:
        _, mapping_info = parse_excel(file_bytes, file.filename, entity_type)
    except ExcelValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 4) excel_uploads tablosuna kaydet (raw_data, TASK-026'nın compare()'ı için gerekli)
    upload = ExcelUpload(
        tenant_id=current_user.tenant_id,
        uploaded_by=current_user.user_id,
        filename=file.filename,
        entity_type=entity_type,
        column_mapping=mapping_info["column_mapping"],
        row_count=mapping_info["row_count"],
        raw_data=mapping_info["raw_data"],
    )
    db.add(upload)
    await db.commit()
    await db.refresh(upload)

    return ExcelUploadResponse(
        upload_id=upload.id,
        filename=upload.filename,
        entity_type=upload.entity_type,
        row_count=upload.row_count,
        detected_columns=mapping_info["detected_columns"],
        column_mapping=mapping_info["column_mapping"],
    )


@router.post("/compare", response_model=CompareResponse)
async def compare_excel(
    request: CompareRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> CompareResponse:
    """
    TASK-026 · Yüklenen Excel'i canonical ERP verisiyle karşılaştırır.
    """
    service = ExcelCompareService(db)
    try:
        diffs = await service.compare(request.upload_id, current_user.tenant_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    only_in_excel = sum(1 for d in diffs if d.diff_type == "only_in_excel")
    only_in_erp = sum(1 for d in diffs if d.diff_type == "only_in_erp")
    mismatch = sum(1 for d in diffs if d.diff_type == "mismatch")

    return CompareResponse(
        upload_id=request.upload_id,
        total_diffs=len(diffs),
        only_in_excel_count=only_in_excel,
        only_in_erp_count=only_in_erp,
        mismatch_count=mismatch,
    )


@router.get("/diffs/{upload_id}", response_model=list[DiffResultResponse])
async def get_diffs(
    upload_id: UUID,
    diff_type: str | None = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> list[DiffResultResponse]:
    """
    TASK-025'te boş liste dönüyordu, TASK-026'da tamamlandı.
    diff_type filtresi destekler: only_in_excel | only_in_erp | mismatch
    """
    stmt = (
        select(ExcelDiffResult)
        .where(
            ExcelDiffResult.upload_id == upload_id,
            ExcelDiffResult.tenant_id == current_user.tenant_id,
        )
        .order_by(ExcelDiffResult.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    if diff_type:
        stmt = stmt.where(ExcelDiffResult.diff_type == diff_type)

    result = await db.execute(stmt)
    return list(result.scalars().all())
