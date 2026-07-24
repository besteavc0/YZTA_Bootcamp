"""
Celery uygulama tanimi - tum worker task'lari (sync, anomaly, digest vb.)
bu instance uzerinden calisir.
"""
import os
from celery import Celery

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "erpilot",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["workers.tasks.sync_erp"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Europe/Istanbul",
    enable_utc=True,
)

# workers/tasks/ altindaki tum task modullerini otomatik kesfet

