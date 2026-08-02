"""
ERP bağlantı yönetimi endpoint'leri.

TASK-018 kapsamında tüm ERP endpoint'leri sadece admin rolüne açıktır.
TASK-020 kapsamında erp_connections.config_encrypted alanı Fernet ile
şifrelenmiş olarak saklanır; API response'larında decrypted config dönülmez.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import text

from app.db.session import AsyncSessionLocal
from app.dependencies import get_current_user
from app.schemas.erp import (
    ERPConnectionCreate,
    ERPConnectionResponse,
    SyncRunResponse,
    SyncTriggerResponse,
)
from app.security.audit import log_action
from app.security.auth import CurrentUser
from app.security.encryption import decrypt_config, encrypt_config
from app.security.rbac import require_role
from connectors.registry import get_connector

router = APIRouter(prefix="/erp", tags=["erp"])


def require_admin_user(
    current_user: CurrentUser = Depends(get_current_user),
) -> CurrentUser:
    return require_role(current_user, ["admin"])


@router.get("/connections", response_model=list[ERPConnectionResponse])
async def list_connections(
    current_user: CurrentUser = Depends(require_admin_user),
):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            text(
                """
                SELECT id, tenant_id, name, connector_type, is_active,
                       last_sync_at, last_sync_status, created_at
                FROM erp_connections
                WHERE tenant_id = :tenant_id
                ORDER BY created_at DESC
                """
            ),
            {
                "tenant_id": str(current_user.tenant_id),
            },
        )

        rows = result.mappings().all()

        return [ERPConnectionResponse(**dict(row)) for row in rows]


@router.post("/connections", response_model=ERPConnectionResponse, status_code=201)
async def create_connection(
    payload: ERPConnectionCreate,
    request: Request,
    current_user: CurrentUser = Depends(require_admin_user),
):
    new_id = str(uuid.uuid4())
    config_encrypted = encrypt_config(payload.config)

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
                "tenant_id": str(current_user.tenant_id),
                "name": payload.name,
                "connector_type": payload.connector_type,
                "config_encrypted": config_encrypted,
            },
        )

        await log_action(
            db=session,
            user=current_user,
            action="erp_config_change",
            resource_type="erp_connections",
            resource_id=new_id,
            details={
                "operation": "create_connection",
                "connector_type": payload.connector_type,
                "connection_name": payload.name,
            },
            request=request,
            status="success",
            tenant_id=str(current_user.tenant_id),
        )

        await session.commit()

        result = await session.execute(
            text(
                """
                SELECT id, tenant_id, name, connector_type, is_active,
                       last_sync_at, last_sync_status, created_at
                FROM erp_connections
                WHERE id = :id AND tenant_id = :tenant_id
                """
            ),
            {
                "id": new_id,
                "tenant_id": str(current_user.tenant_id),
            },
        )

        row = result.mappings().first()

        if row is None:
            raise HTTPException(status_code=404, detail="ERP connection not found")

        return ERPConnectionResponse(**dict(row))


@router.post("/connections/{connection_id}/test")
async def test_connection(
    connection_id: str,
    request: Request,
    current_user: CurrentUser = Depends(require_admin_user),
):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            text(
                """
                SELECT connector_type, config_encrypted, tenant_id
                FROM erp_connections
                WHERE id = :id AND tenant_id = :tenant_id
                """
            ),
            {
                "id": connection_id,
                "tenant_id": str(current_user.tenant_id),
            },
        )

        row = result.mappings().first()

        if row is None:
            raise HTTPException(status_code=404, detail="ERP connection not found")

        config = decrypt_config(row["config_encrypted"])
        config["tenant_id"] = str(current_user.tenant_id)

        connector = get_connector(row["connector_type"], config)
        ok = connector.test_connection()

        await log_action(
            db=session,
            user=current_user,
            action="erp_config_change",
            resource_type="erp_connections",
            resource_id=connection_id,
            details={
                "operation": "test_connection",
                "connector_type": row["connector_type"],
            },
            request=request,
            status="success" if ok else "error",
            tenant_id=str(current_user.tenant_id),
        )

        await session.commit()

        return {"success": ok}


@router.post("/connections/{connection_id}/sync", response_model=SyncTriggerResponse)
async def trigger_sync(
    connection_id: str,
    request: Request,
    current_user: CurrentUser = Depends(require_admin_user),
):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            text(
                """
                SELECT id, tenant_id
                FROM erp_connections
                WHERE id = :id AND tenant_id = :tenant_id
                """
            ),
            {
                "id": connection_id,
                "tenant_id": str(current_user.tenant_id),
            },
        )

        row = result.mappings().first()

        if row is None:
            raise HTTPException(status_code=404, detail="Bağlantı bulunamadı")

        from workers.tasks.sync_erp import sync_erp_connection

        async_result = sync_erp_connection.delay(
            connection_id,
            str(current_user.tenant_id),
        )

        await log_action(
            db=session,
            user=current_user,
            action="erp_sync",
            resource_type="erp_connections",
            resource_id=connection_id,
            details={
                "operation": "trigger_sync",
                "task_id": async_result.id,
            },
            request=request,
            status="success",
            tenant_id=str(current_user.tenant_id),
        )

        await session.commit()

        return SyncTriggerResponse(
            message="Sync kuyruğa alındı",
            task_id=async_result.id,
        )


@router.get("/sync-runs/{connection_id}", response_model=list[SyncRunResponse])
async def list_sync_runs(
    connection_id: str,
    current_user: CurrentUser = Depends(require_admin_user),
):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            text(
                """
                SELECT sr.id, sr.tenant_id, sr.erp_connection_id, sr.started_at,
                       sr.finished_at, sr.rows_synced, sr.status, sr.error_message
                FROM sync_runs sr
                JOIN erp_connections ec ON ec.id = sr.erp_connection_id
                WHERE sr.erp_connection_id = :connection_id
                  AND ec.tenant_id = :tenant_id
                ORDER BY sr.started_at DESC
                LIMIT 20
                """
            ),
            {
                "connection_id": connection_id,
                "tenant_id": str(current_user.tenant_id),
            },
        )

        rows = result.mappings().all()

        return [SyncRunResponse(**dict(row)) for row in rows]
    
@router.delete("/connections/{connection_id}")
async def delete_connection(
    connection_id: str,
    request: Request,
    current_user: CurrentUser = Depends(require_admin_user),
):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            text(
                """
                SELECT id, name, connector_type
                FROM erp_connections
                WHERE id = :id AND tenant_id = :tenant_id
                """
            ),
            {
                "id": connection_id,
                "tenant_id": str(current_user.tenant_id),
            },
        )

        row = result.mappings().first()

        if row is None:
            raise HTTPException(status_code=404, detail="ERP connection not found")

        await session.execute(
            text(
                """
                DELETE FROM erp_connections
                WHERE id = :id AND tenant_id = :tenant_id
                """
            ),
            {
                "id": connection_id,
                "tenant_id": str(current_user.tenant_id),
            },
        )

        await log_action(
            db=session,
            user=current_user,
            action="erp_config_change",
            resource_type="erp_connections",
            resource_id=connection_id,
            details={
                "operation": "delete_connection",
                "connector_type": row["connector_type"],
                "connection_name": row["name"],
            },
            request=request,
            status="success",
            tenant_id=str(current_user.tenant_id),
        )

        await session.commit()

        return {
            "success": True,
            "connection_id": connection_id,
        }