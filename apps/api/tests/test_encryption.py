"""
TASK-021 · Encryption testleri

ERP credential config bilgisinin Fernet ile şifrelendiğini ve tekrar
doğru şekilde çözülebildiğini doğrular.
"""

from cryptography.fernet import Fernet

from app.config import settings
from app.security.encryption import decrypt_config, encrypt_config


def test_encrypt_decrypt_config_round_trip():
    settings.CREDENTIAL_ENCRYPTION_KEY = Fernet.generate_key().decode()

    plain_config = {
        "file_path": "/tmp/demo-orders.csv",
        "entity_type": "orders",
        "source": "csv",
        "password": "super-secret",
        "column_mapping": {
            "external_id": "external_id",
            "order_date": "order_date",
            "total_amount": "total_amount",
            "status": "status",
        },
    }

    encrypted = encrypt_config(plain_config)
    decrypted = decrypt_config(encrypted)

    assert encrypted != plain_config
    assert isinstance(encrypted, str)
    assert encrypted.startswith("gAAAAA")
    assert decrypted == plain_config


def test_encrypted_config_does_not_contain_plaintext_values():
    settings.CREDENTIAL_ENCRYPTION_KEY = Fernet.generate_key().decode()

    plain_config = {
        "host": "erp.example.com",
        "username": "admin",
        "password": "very-secret-password",
    }

    encrypted = encrypt_config(plain_config)

    assert "erp.example.com" not in encrypted
    assert "admin" not in encrypted
    assert "very-secret-password" not in encrypted
    assert "password" not in encrypted