"""
Tum aktif tenant'lar icin gunluk digest ureten Celery task'i (TASK-029).

run_anomalies.py'deki ayni pattern: her task calismasinda taze bir async
engine (NullPool) olusturup is bitince kapatiyoruz - Celery'nin her
calistirmada yeni event loop acmasi yuzunden paylasilan engine kullanmak
"attached to a different loop" hatasina yol aciyordu (TASK-023'te bulundu).
"""
import asyncio
import logging
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import NullPool

from workers.celery_app import celery_app
from app.config import settings
from app.models.tenant import Tenant
from app.services.digest_service import generate_digest

logger = logging.getLogger("erpilot.workers.generate_digest")


async def _generate_daily_digests_async() -> dict:
    summary = {"tenants_processed": 0, "tenants_failed": 0}
    today = date.today()

    engine = create_async_engine(settings.DATABASE_URL, poolclass=NullPool)
    SessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    try:
        async with SessionLocal() as session:
            result = await session.execute(select(Tenant.id).where(Tenant.is_active.is_(True)))
            tenant_ids = [row[0] for row in result.all()]

        logger.info("digest_generation_started tenant_count=%d date=%s", len(tenant_ids), today)

        for tenant_id in tenant_ids:
            try:
                async with SessionLocal() as session:
                    await generate_digest(tenant_id, today, session)
                    summary["tenants_processed"] += 1
            except Exception as exc:
                summary["tenants_failed"] += 1
                logger.error("digest_generation_tenant_failed tenant_id=%s error=%s", tenant_id, exc)
                continue
    finally:
        await engine.dispose()

    logger.info(
        "digest_generation_finished tenants_processed=%d tenants_failed=%d",
        summary["tenants_processed"], summary["tenants_failed"],
    )
    return summary


@celery_app.task(name="workers.tasks.generate_digest.generate_daily_digests")
def generate_daily_digests() -> dict:
    """Celery entry point - async fonksiyonu senkron context'te calistirir."""
    return asyncio.run(_generate_daily_digests_async())
