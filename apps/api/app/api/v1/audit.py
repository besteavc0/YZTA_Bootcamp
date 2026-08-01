"""
Audit log endpoint'leri.

Admin kullanıcılar kendi tenant'larına ait audit kayıtlarını action, status ve
tarih aralığı filtreleriyle görüntüleyebilir.
"""

from datetime import date as date_type
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import require_admin
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.audit import AuditLogListResponse, AuditLogResponse
from app.security.auth import CurrentUser

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/logs", response_model=AuditLogListResponse)
async def get_audit_logs(
    action: Optional[str] = Query(default=None, description="Filtrelenecek action tipi"),
    status: Optional[str] = Query(default=None, description="Filtrelenecek log durumu"),
    start_date: Optional[date_type] = Query(default=None, description="Başlangıç tarihi"),
    end_date: Optional[date_type] = Query(default=None, description="Bitiş tarihi"),
    limit: int = Query(default=50, ge=1, le=200, description="Maksimum 200"),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_admin),
) -> AuditLogListResponse:
    """
    Sadece admin erişebilir. Sadece kullanıcının kendi tenant'ına ait logları döndürür.
    """
    conditions = [AuditLog.tenant_id == current_user.tenant_id]

    if action:
        conditions.append(AuditLog.action == action)

    if status:
        conditions.append(AuditLog.status == status)

    if start_date:
        conditions.append(func.date(AuditLog.created_at) >= start_date)

    if end_date:
        conditions.append(func.date(AuditLog.created_at) <= end_date)

    total_result = await db.execute(
        select(func.count(AuditLog.id)).where(*conditions)
    )
    total_count = total_result.scalar_one()

    stmt = (
        select(AuditLog, User.email)
        .join(User, User.id == AuditLog.user_id, isouter=True)
        .where(*conditions)
        .order_by(AuditLog.created_at.desc())
        .offset(offset)
        .limit(limit)
    )

    result = await db.execute(stmt)
    rows = result.all()

    items = [
        AuditLogResponse(
            id=log.id,
            user_email=email,
            action=log.action,
            resource_type=log.resource_type,
            resource_id=log.resource_id,
            details=log.details,
            ip_address=log.ip_address,
            status=log.status,
            created_at=log.created_at,
        )
        for log, email in rows
    ]

    return AuditLogListResponse(
        items=items,
        total_count=total_count,
        limit=limit,
        offset=offset,
    )