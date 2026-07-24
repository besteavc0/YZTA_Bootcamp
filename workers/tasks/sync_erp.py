"""
ERP baglantilarini senkronize eden Celery task'i (TASK-007).

Su an icin config_encrypted alani duz JSON olarak okunuyor - TASK-020'de
gercek Fernet decrypt entegre edilecek (_decrypt_config fonksiyonu
o zaman guncellenecek).
"""
import os
import json
import uuid

import psycopg2
from psycopg2.extras import RealDictCursor

from workers.celery_app import celery_app
from connectors.registry import get_connector

# Celery worker senkron calisir (asyncpg degil, duz psycopg2 kullaniyoruz).
# DATABASE_URL app tarafinda "postgresql+asyncpg://..." formatinda olabilir,
# worker icin senkron surucuye ceviriyoruz.
_raw_url = os.environ.get(
    "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/erpilot"
)
DATABASE_URL_SYNC = _raw_url.replace("postgresql+asyncpg://", "postgresql://")


def _get_connection_row(cur, connection_id: str):
    cur.execute(
        """
        SELECT id, tenant_id, connector_type, config_encrypted
        FROM erp_connections
        WHERE id = %s
        """,
        (connection_id,),
    )
    return cur.fetchone()


def _decrypt_config(config_encrypted: str) -> dict:
    # TODO(TASK-020): burada gercek Fernet decrypt_config() cagrilacak.
    return json.loads(config_encrypted)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=30)
def sync_erp_connection(self, connection_id: str, tenant_id: str):
    """
    Belirtilen erp_connections kaydini senkronize eder.
    sync_runs tablosuna baslangic/bitis kaydi yazar, hata durumunda
    3 kez retry dener (Celery'nin kendi retry mekanizmasi).
    """
    conn = psycopg2.connect(DATABASE_URL_SYNC)
    conn.autocommit = False
    sync_run_id = str(uuid.uuid4())

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            row = _get_connection_row(cur, connection_id)
            if row is None:
                raise ValueError(f"erp_connections kaydi bulunamadi: {connection_id}")

        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO sync_runs (id, tenant_id, erp_connection_id, started_at, status)
                VALUES (%s, %s, %s, NOW(), 'running')
                """,
                (sync_run_id, tenant_id, connection_id),
            )
        conn.commit()

        config = _decrypt_config(row["config_encrypted"])
        config["tenant_id"] = tenant_id
        config.setdefault("database_url", DATABASE_URL_SYNC)

        connector = get_connector(row["connector_type"], config)
        result = connector.sync_incremental()

        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE sync_runs
                SET finished_at = NOW(), rows_synced = %s, status = %s, error_message = %s
                WHERE id = %s
                """,
                (
                    result.rows_synced,
                    "success" if result.success else "failed",
                    result.error,
                    sync_run_id,
                ),
            )
            cur.execute(
                """
                UPDATE erp_connections
                SET last_sync_at = NOW(), last_sync_status = %s
                WHERE id = %s
                """,
                ("success" if result.success else "failed", connection_id),
            )
        conn.commit()

        return {
            "success": result.success,
            "rows_synced": result.rows_synced,
            "error": result.error,
        }

    except Exception as exc:
        conn.rollback()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE sync_runs
                    SET finished_at = NOW(), status = 'failed', error_message = %s
                    WHERE id = %s
                    """,
                    (str(exc), sync_run_id),
                )
                cur.execute(
                    "UPDATE erp_connections SET last_sync_status = 'failed' WHERE id = %s",
                    (connection_id,),
                )
            conn.commit()
        except Exception:
            conn.rollback()

        raise self.retry(exc=exc)
    finally:
        conn.close()
