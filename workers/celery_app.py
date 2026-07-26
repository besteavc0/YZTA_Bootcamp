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
    ],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Europe/Istanbul",
    enable_utc=True,
)

# TASK-023: anomali taramasi her saat basi calisir
celery_app.conf.beat_schedule = {
    "anomaly-scan-hourly": {
        "task": "workers.tasks.run_anomalies.run_anomaly_scan",
        "schedule": crontab(minute=0),
    },
}
