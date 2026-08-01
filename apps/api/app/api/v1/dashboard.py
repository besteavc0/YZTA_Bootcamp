from __future__ import annotations

from decimal import Decimal
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_user
from app.security.auth import CurrentUser
from app.security.rbac import require_role

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def to_float(value: Any) -> float:
    if value is None:
        return 0.0

    if isinstance(value, Decimal):
        return float(value)

    return float(value)


def to_int(value: Any) -> int:
    if value is None:
        return 0

    return int(value)


def to_iso(value: Any) -> str | None:
    if value is None:
        return None

    if hasattr(value, "isoformat"):
        return value.isoformat()

    return str(value)


@router.get("/stats")
async def get_dashboard_stats(
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    require_role(user, ["admin", "user", "viewer"])

    sales_result = await db.execute(
        text(
            """
            SELECT
                COALESCE(SUM(total_amount), 0) AS total_sales,
                COUNT(*) AS order_count
            FROM canonical_orders
            WHERE tenant_id = :tenant_id
              AND order_date >= date_trunc('month', CURRENT_DATE)
            """
        ),
        {"tenant_id": user.tenant_id},
    )
    sales_row = sales_result.mappings().first()

    erp_result = await db.execute(
        text(
            """
            SELECT
                COUNT(*) AS erp_connections_count,
                MAX(last_sync_at) AS last_sync_at
            FROM erp_connections
            WHERE tenant_id = :tenant_id
            """
        ),
        {"tenant_id": user.tenant_id},
    )
    erp_row = erp_result.mappings().first()

    latest_sync_result = await db.execute(
        text(
            """
            SELECT status, rows_synced, error_message, finished_at
            FROM sync_runs
            WHERE tenant_id = :tenant_id
            ORDER BY started_at DESC
            LIMIT 1
            """
        ),
        {"tenant_id": user.tenant_id},
    )
    latest_sync_row = latest_sync_result.mappings().first()

    excel_result = await db.execute(
        text(
            """
            SELECT COUNT(*) AS excel_upload_count
            FROM excel_uploads
            WHERE tenant_id = :tenant_id
            """
        ),
        {"tenant_id": user.tenant_id},
    )
    excel_row = excel_result.mappings().first()

    if user.role == "admin":
        chat_result = await db.execute(
            text(
                """
                SELECT COUNT(*) AS chat_messages_count
                FROM chat_messages
                WHERE tenant_id = :tenant_id
                """
            ),
            {"tenant_id": user.tenant_id},
        )
    else:
        chat_result = await db.execute(
            text(
                """
                SELECT COUNT(*) AS chat_messages_count
                FROM chat_messages
                WHERE tenant_id = :tenant_id
                  AND user_id = :user_id
                """
            ),
            {"tenant_id": user.tenant_id, "user_id": user.user_id},
        )

    chat_row = chat_result.mappings().first()

    audit_result = await db.execute(
        text(
            """
            SELECT COUNT(*) AS audit_event_count
            FROM audit_logs
            WHERE tenant_id = :tenant_id
            """
        ),
        {"tenant_id": user.tenant_id},
    )
    audit_row = audit_result.mappings().first()

    recent_activity_result = await db.execute(
        text(
            """
            SELECT action, resource_type, resource_id, status, created_at
            FROM audit_logs
            WHERE tenant_id = :tenant_id
            ORDER BY created_at DESC
            LIMIT 5
            """
        ),
        {"tenant_id": user.tenant_id},
    )
    recent_activity_rows = recent_activity_result.mappings().all()

    return {
        "total_sales": to_float(sales_row["total_sales"] if sales_row else 0),
        "order_count": to_int(sales_row["order_count"] if sales_row else 0),
        "erp_connections_count": to_int(
            erp_row["erp_connections_count"] if erp_row else 0
        ),
        "last_sync_status": latest_sync_row["status"] if latest_sync_row else None,
        "last_sync_rows": to_int(
            latest_sync_row["rows_synced"] if latest_sync_row else 0
        ),
        "last_sync_error": latest_sync_row["error_message"]
        if latest_sync_row
        else None,
        "last_sync_at": to_iso(
            latest_sync_row["finished_at"]
            if latest_sync_row
            else erp_row["last_sync_at"]
            if erp_row
            else None
        ),
        "excel_upload_count": to_int(
            excel_row["excel_upload_count"] if excel_row else 0
        ),
        "chat_messages_count": to_int(
            chat_row["chat_messages_count"] if chat_row else 0
        ),
        "audit_event_count": to_int(
            audit_row["audit_event_count"] if audit_row else 0
        ),
        "recent_activities": [
            {
                "action": row["action"],
                "resource_type": row["resource_type"],
                "resource_id": row["resource_id"],
                "status": row["status"],
                "created_at": to_iso(row["created_at"]),
            }
            for row in recent_activity_rows
        ],
    }