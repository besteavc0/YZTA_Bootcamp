"""
Rol tabanlı erişim kontrolü (RBAC) — TASK-018.

Roller: admin > user > viewer
Endpoint'ler bu modüldeki dependency'lerle korunur.
"""
from __future__ import annotations

from fastapi import HTTPException, status

from app.security.auth import CurrentUser

VALID_ROLES = {"admin", "user", "viewer"}


def require_role(user: CurrentUser, allowed_roles: list[str]) -> CurrentUser:
    """Kullanıcının rolü izin verilenler arasında değilse 403 fırlatır."""
    if user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Erişim reddedildi: bu işlem için yetkiniz yok.",
        )
    return user
