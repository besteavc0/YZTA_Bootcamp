"""
FastAPI auth dependency'leri (TASK-017 + TASK-018).

- get_current_user: Bearer token'ı doğrular; development'ta X-Dev-* header bypass'ı.
- require_admin / require_user_or_admin: rol tabanlı kapı.
"""
from __future__ import annotations

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.session import get_db
from app.security.auth import CurrentUser, verify_jwt

_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
    x_dev_user_id: str | None = Header(default=None),
    x_dev_role: str | None = Header(default=None),
    x_dev_tenant_id: str | None = Header(default=None),
) -> CurrentUser:
    """
    İstek yapan kullanıcıyı çözer.

    Geliştirme kolaylığı: ENVIRONMENT=development iken X-Dev-User-Id + X-Dev-Role
    + X-Dev-Tenant-Id header'ları verilirse gerçek JWT doğrulaması atlanır.
    Bu bypass production'da TAMAMEN devre dışıdır.
    """
    if settings.ENVIRONMENT == "development" and x_dev_user_id and x_dev_role and x_dev_tenant_id:
        return CurrentUser(
            user_id=x_dev_user_id,
            tenant_id=x_dev_tenant_id,
            email=f"{x_dev_user_id}@dev.local",
            role=x_dev_role,
            is_active=True,
        )

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kimlik doğrulama gerekli.",
        )

    user = await verify_jwt(credentials.credentials, db)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz veya süresi dolmuş token.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hesap aktif değil.",
        )
    return user


async def require_admin(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin yetkisi gerekli.")
    return user


async def require_user_or_admin(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if user.role not in ("admin", "user"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Yetkisiz erişim.")
    return user
