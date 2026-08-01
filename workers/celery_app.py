"""
Celery uygulama tanimi - tum worker task'lari (sync, anomaly, digest vb.)
bu instance uzerinden calisir.
"""
import os
from celery import Celery
from celery.schedules import crontab

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "erpilot",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=[
        "workers.tasks.sync_erp",
        "workers.tasks.run_anomalies",
        "workers.tasks.generate_digest",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Europe/Istanbul",
    enable_utc=True,
)

celery_app.conf.beat_schedule = {
    # TASK-023: anomali taramasi her saat basi calisir
    "anomaly-scan-hourly": {
        "task": "workers.tasks.run_anomalies.run_anomaly_scan",
        "schedule": crontab(minute=0),
    },
    # TASK-029: gunluk ozet her sabah 07:00'de calisir
    "generate-digest-morning": {
        "task": "workers.tasks.generate_digest.generate_daily_digests",
        "schedule": crontab(hour=7, minute=0),
    },
}
