"""
Anomali kurallarini tum aktif tenant'lar icin periyodik calistiran Celery task'i (TASK-023).

NOT: app.db.session'daki paylasilan AsyncSessionLocal, FastAPI'nin tek ve
surekli event loop'u icin tasarlanmis. Celery (prefork) her task
calistirmasinda asyncio.run() ile yeni bir event loop actigi icin,
paylasilan engine'i kullanmak "attached to a different loop" hatasina
yol aciyor. Bu yuzden burada her task calismasinda kendi engine'imizi
olusturup isimiz bitince kapatiyoruz (NullPool ile connection pooling'i
de devre disi birakiyoruz, cunku pool'lanmis baglantilar da loop'a bagli
kalabiliyor).
"""
import asyncio
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import NullPool

from workers.celery_app import celery_app
from app.config import settings
from app.models.tenant import Tenant
from app.services.anomaly_service import AnomalyService

logger = logging.getLogger("erpilot.workers.run_anomalies")


async def _run_anomaly_scan_async() -> dict:
    """
    Tum aktif tenant'lari sirayla tarar. Bir tenant'ta hata olursa
    o tenant'i loglayip atlar, digerlerine devam eder (bir tenant'in
    hatasi tum taramayi durdurmamali).
    """
    summary = {"tenants_scanned": 0, "tenants_failed": 0, "total_findings": 0}

    engine = create_async_engine(settings.DATABASE_URL, poolclass=NullPool)
    SessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    try:
        async with SessionLocal() as session:
            result = await session.execute(select(Tenant.id).where(Tenant.is_active.is_(True)))
            tenant_ids = [row[0] for row in result.all()]

        logger.info("anomaly_scan_started tenant_count=%d", len(tenant_ids))

        for tenant_id in tenant_ids:
            try:
                async with SessionLocal() as session:
                    service = AnomalyService(session)
                    rule_results = await service.run_all_rules(tenant_id)
                    findings_count = sum(rule_results.values())
                    summary["tenants_scanned"] += 1
                    summary["total_findings"] += findings_count
                    logger.info(
                        "anomaly_scan_tenant_done tenant_id=%s findings=%d detail=%s",
                        tenant_id, findings_count, rule_results,
                    )
            except Exception as exc:
                summary["tenants_failed"] += 1
                logger.error(
                    "anomaly_scan_tenant_failed tenant_id=%s error=%s", tenant_id, exc
                )
                continue
    finally:
        await engine.dispose()

    logger.info(
        "anomaly_scan_finished tenants_scanned=%d tenants_failed=%d total_findings=%d",
        summary["tenants_scanned"], summary["tenants_failed"], summary["total_findings"],
    )
    return summary


@celery_app.task(name="workers.tasks.run_anomalies.run_anomaly_scan")
def run_anomaly_scan() -> dict:
    """Celery entry point - async fonksiyonu senkron context'te calistirir."""
    return asyncio.run(_run_anomaly_scan_async())