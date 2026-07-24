"""
ERP baglanti yonetimi endpoint'leri (TASK-007).

NOT: Auth/RBAC (require_admin) TASK-017/018'de eklenecek, su an
endpoint'ler acik. Credential sifreleme TASK-020'de eklenecek,
su an config duz JSON olarak yaziliyor - PRODUCTION'A ALINMADAN
ONCE MUTLAKA TASK-020 ile entegre edilmeli.
"""
import json
import uuid

from fastapi import APIRouter, HTTPException
from sqlalchemy import text

from app.db.session import AsyncSessionLocal
from app.schemas.erp import (
    ERPConnectionCreate,
    ERPConnectionResponse,
    SyncRunResponse,
    SyncTriggerResponse,
)
from connectors.registry import get_connector

router = APIRouter(prefix="/erp", tags=["erp"])


@router.get("/connections", response_model=list[ERPConnectionResponse])
async def list_connections():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            text(
                """
                SELECT id, tenant_id, name, connector_type, is_active,
                       last_sync_at, last_sync_status, created_at
                FROM erp_connections
                ORDER BY created_at DESC
                """
            )
        )
        rows = result.mappings().all()
        return [ERPConnectionResponse(**dict(row)) for row in rows]


@router.post("/connections", response_model=ERPConnectionResponse, status_code=201)
async def create_connection(payload: ERPConnectionCreate):
    new_id = str(uuid.uuid4())
    # TODO(TASK-020): burada encrypt_config(payload.config) cagrilmali.
    config_encrypted = json.dumps(payload.config, ensure_ascii=False)

    async with AsyncSessionLocal() as session:
        await session.execute(
            text(
                """
                INSERT INTO erp_connections
                    (id, tenant_id, name, connector_type, config_encrypted, is_active)
                VALUES
                    (:id, :tenant_id, :name, :connector_type, :config_encrypted, TRUE)
                """
            ),
            {
                "id": new_id,
                "tenant_id": payload.tenant_id,
                "name": payload.name,
                "connector_type": payload.connector_type,
                "config_encrypted": config_encrypted,
            },
        )
        await session.commit()

        result = await session.execute(
            text(
                """
                SELECT id, tenant_id, name, connector_type, is_active,
                       last_sync_at, last_sync_status, created_at
                FROM erp_connections WHERE id = :id
                """
            ),
            {"id": new_id},
        )
        row = result.mappings().first()
        return ERPConnectionResponse(**dict(row))


@router.post("/connections/{connection_id}/test")
async def test_connection(connection_id: str):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            text(
                "SELECT connector_type, config_encrypted, tenant_id FROM erp_connections WHERE id = :id"
            ),
            {"id": connection_id},
        )
        row = result.mappings().first()
        if row is None:
            raise HTTPException(status_code=404, detail="Baglanti bulunamadi")

        config = json.loads(row["config_encrypted"])  # TODO(TASK-020): decrypt_config()
        config["tenant_id"] = row["tenant_id"]

        connector = get_connector(row["connector_type"], config)
        ok = connector.test_connection()
        return {"success": ok}


@router.post("/connections/{connection_id}/sync", response_model=SyncTriggerResponse)
async def trigger_sync(connection_id: str):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            text("SELECT tenant_id FROM erp_connections WHERE id = :id"),
            {"id": connection_id},
        )
        row = result.mappings().first()
        if row is None:
            raise HTTPException(status_code=404, detail="Baglanti bulunamadi")

    # Celery task'ini tetikle (worker sureci ayri calisir)
    from workers.tasks.sync_erp import sync_erp_connection

    async_result = sync_erp_connection.delay(connection_id, row["tenant_id"])
    return SyncTriggerResponse(
        message="Sync kuyruga alindi", task_id=async_result.id
    )


@router.get("/sync-runs/{connection_id}", response_model=list[SyncRunResponse])
async def list_sync_runs(connection_id: str):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            text(
                """
                SELECT id, tenant_id, erp_connection_id, started_at,
                       finished_at, rows_synced, status, error_message
                FROM sync_runs
                WHERE erp_connection_id = :cid
                ORDER BY started_at DESC
                LIMIT 20
                """
            ),
            {"cid": connection_id},
        )
        rows = result.mappings().all()
        return [SyncRunResponse(**dict(row)) for row in rows]
