"""
Test ortamı ayarları.

asyncpg + senkron TestClient birlikte kullanıldığında connection pool
event loop'lar arasında paylaşılamaz. Test sırasında NullPool kullanarak
her isteğin kendi bağlantısını açıp kapatmasını sağlıyoruz.
"""
import os

os.environ.setdefault("ENVIRONMENT", "development")

from sqlalchemy.pool import NullPool  # noqa: E402
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine  # noqa: E402

import app.db.session as session_module  # noqa: E402
from app.config import settings  # noqa: E402

# Engine'i NullPool ile yeniden kur (testler için)
_test_engine = create_async_engine(settings.DATABASE_URL, poolclass=NullPool)
session_module.engine = _test_engine
session_module.AsyncSessionLocal = async_sessionmaker(
    bind=_test_engine, expire_on_commit=False
)
