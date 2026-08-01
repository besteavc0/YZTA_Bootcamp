from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings


def normalize_database_url(database_url: str) -> str:
    url = database_url.strip().strip('"').strip("'")

    if not url:
        raise RuntimeError("DATABASE_URL boş. Railway API service Variables alanını kontrol et.")

    if url.startswith("${{"):
        raise RuntimeError(
            "DATABASE_URL Railway reference olarak çözülmemiş görünüyor. "
            "API service Variables içinde Postgres.DATABASE_URL referansını doğru seç."
        )

    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)

    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

    return url


DATABASE_URL = normalize_database_url(settings.DATABASE_URL)

engine = create_async_engine(
    DATABASE_URL,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    class_=AsyncSession,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
