"""
Clerk JWT doğrulama ve kullanıcı çözümleme (TASK-017).

Frontend `Authorization: Bearer <clerk_jwt>` gönderir. Bu modül token'ı Clerk'in
JWKS public key'leriyle doğrular, `users` tablosunda upsert eder ve `CurrentUser`
döndürür. Geliştirme ortamında `X-Dev-*` header'larıyla auth atlanabilir.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass

import httpx
from jose import jwt
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings

logger = logging.getLogger("erpilot.security.auth")


@dataclass
class CurrentUser:
    user_id: str
    tenant_id: str
    email: str
    role: str
    is_active: bool = True


# JWKS cache (her istekte çekmemek için)
_jwks_cache: dict | None = None


async def _get_jwks() -> dict:
    global _jwks_cache
    if _jwks_cache is None:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(settings.CLERK_JWKS_URL)
            resp.raise_for_status()
            _jwks_cache = resp.json()
    return _jwks_cache


async def _upsert_user(db: AsyncSession, auth_provider_id: str, email: str, name: str | None) -> CurrentUser:
    """
    Clerk kullanıcısını users tablosuyla eşler. İlk girişte kayıt oluşturur
    (varsayılan tenant'a bağlar), sonraki girişlerde last_login_at günceller.
    """
    result = await db.execute(
        text(
            "SELECT id, tenant_id, email, role, is_active "
            "FROM users WHERE auth_provider_id = :aid"
        ),
        {"aid": auth_provider_id},
    )
    row = result.fetchone()

    if row is None:
        # İlk giriş: varsayılan (ilk) tenant'a bağla, 'user' rolüyle oluştur.
        tenant_result = await db.execute(text("SELECT id FROM tenants ORDER BY created_at LIMIT 1"))
        tenant_id = tenant_result.scalar()
        insert = await db.execute(
            text(
                "INSERT INTO users (tenant_id, auth_provider_id, email, full_name, role, last_login_at) "
                "VALUES (:tid, :aid, :email, :name, 'user', NOW()) "
                "RETURNING id, tenant_id, email, role, is_active"
            ),
            {"tid": tenant_id, "aid": auth_provider_id, "email": email, "name": name},
        )
        await db.commit()
        row = insert.fetchone()
    else:
        await db.execute(
            text("UPDATE users SET last_login_at = NOW() WHERE auth_provider_id = :aid"),
            {"aid": auth_provider_id},
        )
        await db.commit()

    return CurrentUser(
        user_id=str(row.id),
        tenant_id=str(row.tenant_id),
        email=row.email,
        role=row.role,
        is_active=row.is_active,
    )


async def verify_jwt(token: str, db: AsyncSession) -> CurrentUser | None:
    """Clerk JWT'sini doğrular ve CurrentUser döndürür; geçersizse None."""
    try:
        jwks = await _get_jwks()
        header = jwt.get_unverified_header(token)
        key = next((k for k in jwks.get("keys", []) if k["kid"] == header.get("kid")), None)
        if key is None:
            return None

        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
    except Exception as exc:
        logger.warning("jwt_verify_failed err=%s", exc)
        return None

    auth_provider_id = payload.get("sub")
    email = payload.get("email") or payload.get("email_address") or f"{auth_provider_id}@clerk"
    name = payload.get("name")
    if not auth_provider_id:
        return None

    return await _upsert_user(db, auth_provider_id, email, name)
