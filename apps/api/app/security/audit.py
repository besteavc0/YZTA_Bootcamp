"""
TASK-019 · Audit log servisi

Sistemdeki kritik tüm işlemleri (giriş, soru sorma, Excel yükleme, ERP sync,
rol değiştirme) audit_logs tablosuna yazan servis.

Kullanım (bir endpoint içinde):
    await log_action(
        db=db,
        user=current_user,
        action="chat_query",
        resource_type="chat_messages",
        resource_id=str(message.id),
        details={"question": question},
        request=request,
        status="success",
    )
"""

from typing import Any, Optional

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog

# CurrentUser, TASK-017'de app/security/auth.py içinde tanımlanacak
# (user_id, tenant_id, email, role, is_active alanlarına sahip bir dataclass).
# O modül henüz repo'da olmadığı için import'u type-checking zamanı hata
# vermesin diye TYPE_CHECKING bloğunda tutuyoruz; runtime'da sadece
# user.user_id / user.tenant_id gibi attribute erişimi yapılıyor, bu yüzden
# gerçek sınıf gelince hiçbir değişiklik gerekmez.
try:
    from app.security.auth import CurrentUser  # noqa: F401
except ImportError:  # TASK-017 henüz merge edilmediyse
    CurrentUser = Any  # type: ignore


SENSITIVE_KEYS = {"password", "secret", "token", "api_key", "credential", "config"}
MASK = "***MASKED***"


def sanitize_details(details: dict) -> dict:
    """
    Audit log'a yazılacak details dict'inden hassas alanları maskeler.
    Anahtar adı (case-insensitive) SENSITIVE_KEYS'ten birini içeriyorsa
    (substring eşleşmesi) o alanın değeri maskelenir. Nested dict/list'ler
    recursive olarak taranır.

    Örnek:
        >>> sanitize_details({"host": "localhost", "password": "gizli123"})
        {'host': 'localhost', 'password': '***MASKED***'}
    """
    if not isinstance(details, dict):
        return details

    sanitized: dict[str, Any] = {}
    for key, value in details.items():
        key_lower = key.lower()
        is_sensitive = any(word in key_lower for word in SENSITIVE_KEYS)

        if is_sensitive:
            sanitized[key] = MASK
        elif isinstance(value, dict):
            sanitized[key] = sanitize_details(value)
        elif isinstance(value, list):
            sanitized[key] = [
                sanitize_details(item) if isinstance(item, dict) else item
                for item in value
            ]
        else:
            sanitized[key] = value
    return sanitized


async def log_action(
    db: AsyncSession,
    user: Optional["CurrentUser"],
    action: str,
    resource_type: Optional[str],
    resource_id: Optional[str],
    details: dict,
    request: Request,
    status: str = "success",
    tenant_id: Optional[str] = None,
) -> None:
    """
    Bir işlemi audit_logs tablosuna yazar.

    Args:
        db: aktif AsyncSession
        user: işlemi yapan kullanıcı (login denemesi başarısızsa None olabilir)
        action: "login" | "chat_query" | "excel_upload" | "erp_sync" |
                "erp_config_change" | "user_role_change"
        resource_type: örn. "chat_messages", "erp_connections"
        resource_id: ilgili kaydın id'si (varsa)
        details: ek bilgi (otomatik olarak sanitize_details ile maskelenir)
        request: FastAPI Request nesnesi — ip_address ve user_agent buradan alınır
        status: "success" | "denied" | "error"
        tenant_id: user None ise (örn. başarısız login denemesi) tenant_id'yi
                   ayrıca belirtmek gerekir; user verilmişse otomatik
                   user.tenant_id kullanılır

    Not: audit_logs.tenant_id NOT NULL olduğu için, user None geçiliyorsa
    tenant_id parametresi mutlaka verilmelidir.
    """
    safe_details = sanitize_details(details or {})

    client_host = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    resolved_tenant_id = user.tenant_id if user else tenant_id
    if resolved_tenant_id is None:
        raise ValueError(
            "log_action: tenant_id belirlenemedi (user None ise tenant_id "
            "parametresi zorunludur, audit_logs.tenant_id NOT NULL'dur)"
        )

    entry = AuditLog(
        tenant_id=resolved_tenant_id,
        user_id=user.user_id if user else None,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=safe_details,
        ip_address=client_host,
        user_agent=user_agent,
        status=status,
    )
    db.add(entry)
    await db.commit()
