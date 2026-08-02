"""
User management endpoint'leri.

Admin kullanıcılar kendi tenant'larındaki kullanıcıları listeleyebilir,
rol değiştirebilir ve kullanıcıları aktif/pasif yapabilir.
"""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import require_admin
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.user import (
    UserResponse,
    UserRoleUpdateRequest,
    UserStatusUpdateRequest,
)
from app.security.auth import CurrentUser

router = APIRouter(prefix="/users", tags=["users"])


def _to_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        name=user.full_name or user.email,
        email=user.email,
        role=user.role,
        status="active" if user.is_active else "inactive",
        last_login_at=user.last_login_at,
        created_at=user.created_at,
    )


def _request_ip(request: Request) -> str | None:
    return request.client.host if request.client else None


def _current_user_uuid(current_user: CurrentUser) -> UUID | None:
    try:
        return UUID(str(current_user.user_id))
    except ValueError:
        return None


async def _get_target_user(
    user_id: UUID,
    current_user: CurrentUser,
    db: AsyncSession,
) -> User:
    result = await db.execute(
        select(User).where(
            User.id == user_id,
            User.tenant_id == current_user.tenant_id,
        )
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı.",
        )

    return user


async def _active_admin_count(
    tenant_id: str,
    db: AsyncSession,
) -> int:
    result = await db.execute(
        select(func.count(User.id)).where(
            User.tenant_id == tenant_id,
            User.role == "admin",
            User.is_active.is_(True),
        )
    )

    return result.scalar_one()


def _add_audit_log(
    *,
    request: Request,
    current_user: CurrentUser,
    action: str,
    resource_id: str,
    details: dict,
    db: AsyncSession,
) -> None:
    db.add(
        AuditLog(
            tenant_id=UUID(str(current_user.tenant_id)),
            user_id=_current_user_uuid(current_user),
            action=action,
            resource_type="users",
            resource_id=resource_id,
            details=details,
            ip_address=_request_ip(request),
            user_agent=request.headers.get("user-agent"),
            status="success",
        )
    )


@router.get("", response_model=list[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_admin),
) -> list[UserResponse]:
    result = await db.execute(
        select(User)
        .where(User.tenant_id == current_user.tenant_id)
        .order_by(User.created_at.desc())
    )

    return [_to_response(user) for user in result.scalars().all()]


@router.patch("/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: UUID,
    payload: UserRoleUpdateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_admin),
) -> UserResponse:
    target_user = await _get_target_user(user_id, current_user, db)

    previous_role = target_user.role

    if previous_role == payload.role:
        return _to_response(target_user)

    current_user_id = _current_user_uuid(current_user)

    if current_user_id == target_user.id and payload.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kendi admin rolünüzü kaldıramazsınız.",
        )

    if previous_role == "admin" and payload.role != "admin":
        admin_count = await _active_admin_count(current_user.tenant_id, db)

        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Son aktif admin kullanıcının rolü değiştirilemez.",
            )

    target_user.role = payload.role
    target_user.updated_at = datetime.now(timezone.utc)

    _add_audit_log(
        request=request,
        current_user=current_user,
        action="user_role_change",
        resource_id=str(target_user.id),
        details={
            "target_user": target_user.email,
            "previous_role": previous_role,
            "new_role": payload.role,
        },
        db=db,
    )

    await db.commit()
    await db.refresh(target_user)

    return _to_response(target_user)


@router.patch("/{user_id}/status", response_model=UserResponse)
async def update_user_status(
    user_id: UUID,
    payload: UserStatusUpdateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_admin),
) -> UserResponse:
    target_user = await _get_target_user(user_id, current_user, db)

    next_is_active = payload.status == "active"
    previous_status = "active" if target_user.is_active else "inactive"

    if previous_status == payload.status:
        return _to_response(target_user)

    current_user_id = _current_user_uuid(current_user)

    if current_user_id == target_user.id and not next_is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kendi hesabınızı pasifleştiremezsiniz.",
        )

    if target_user.role == "admin" and not next_is_active:
        admin_count = await _active_admin_count(current_user.tenant_id, db)

        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Son aktif admin kullanıcı pasifleştirilemez.",
            )

    target_user.is_active = next_is_active
    target_user.updated_at = datetime.now(timezone.utc)

    _add_audit_log(
        request=request,
        current_user=current_user,
        action="user_status_change",
        resource_id=str(target_user.id),
        details={
            "target_user": target_user.email,
            "previous_status": previous_status,
            "new_status": payload.status,
        },
        db=db,
    )

    await db.commit()
    await db.refresh(target_user)

    return _to_response(target_user)