import json
from typing import Any

from cryptography.fernet import Fernet, InvalidToken

from app.config import settings


def get_fernet() -> Fernet:
    key = getattr(settings, "CREDENTIAL_ENCRYPTION_KEY", None)

    if not key:
        raise RuntimeError("CREDENTIAL_ENCRYPTION_KEY tanımlı değil.")

    return Fernet(key.encode("utf-8"))


def encrypt_config(config: dict[str, Any]) -> str:
    payload = json.dumps(config, ensure_ascii=False).encode("utf-8")

    return get_fernet().encrypt(payload).decode("utf-8")


def decrypt_config(encrypted: str) -> dict[str, Any]:
    try:
        decrypted = get_fernet().decrypt(encrypted.encode("utf-8"))
        return json.loads(decrypted.decode("utf-8"))
    except InvalidToken as exc:
        raise ValueError("ERP bağlantı config bilgisi çözülemedi.") from exc