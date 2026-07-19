"""
TASK-019 · GET /api/v1/audit/logs endpoint

Not: `require_admin` ve `CurrentUser`, TASK-017/TASK-018'de (P1) kurulacak
`app.security.auth` ve `app.dependencies` modüllerinden geliyor. O modüller
main'e merge edilene kadar bu dosya import hatası verir — bu beklenen bir
durumdur, TASK-017/018 tamamlanınca otomatik çalışır.
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_user, require_admin
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.audit import AuditLogResponse
from app.security.auth import CurrentUser

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/logs", response_model=list[AuditLogResponse])
async def get_audit_logs(
    action: Optional[str] = Query(default=None, description="Filtrelenecek action tipi"),
    limit: int = Query(default=50, le=200, description="Maksimum 200"),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_admin),
) -> list[AuditLogResponse]:
    """
    Sadece admin erişebilir. Sadece kendi tenant'ının loglarını döndürür.
    """
    stmt = (
        select(AuditLog, User.email)
        .join(User, User.id == AuditLog.user_id, isouter=True)
        .where(AuditLog.tenant_id == current_user.tenant_id)
        .order_by(AuditLog.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    if action:
        stmt = stmt.where(AuditLog.action == action)

    result = await db.execute(stmt)
    rows = result.all()

    return [
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
