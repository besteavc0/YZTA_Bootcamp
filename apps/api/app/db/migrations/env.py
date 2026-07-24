import asyncio
from logging.config import fileConfig

from sqlalchemy.ext.asyncio import async_engine_from_config
from sqlalchemy import pool

from alembic import context

# app.config ve app.models'i import edebilmek icin apps/api kok dizini
# path'te olmali (alembic.ini icindeki prepend_sys_path = . bunu sagliyor,
# alembic'in apps/api icinden calistirilmasi sarti ile)
from app.config import settings
from app.db.base import Base
from app import models  # noqa: F401 - tum modelleri Base.metadata'ya kaydeder icin

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# .env / config.py'deki DATABASE_URL'i alembic.ini yerine buradan kullan
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# autogenerate icin hedef metadata - tum ORM modellerimiz
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    """Run migrations in 'online' mode - async engine kullanarak."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
