"""
Digest API endpoint'leri.

Sprint 3 kapsamında günlük özetler authenticated kullanıcının tenant'ına göre
okunur ve üretilir. Frontend tenant_id göndermez; tenant izolasyonu backend'de
CurrentUser.tenant_id üzerinden sağlanır.
"""

from datetime import date as date_type
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text

from app.db.session import AsyncSessionLocal
from app.dependencies import get_current_user
from app.schemas.digest import DigestGenerateRequest, DigestResponse
from app.security.auth import CurrentUser
from app.security.rbac import require_role
from app.services.digest_service import generate_digest

router = APIRouter(prefix="/digest", tags=["digest"])


def require_digest_reader(
    current_user: CurrentUser = Depends(get_current_user),
) -> CurrentUser:
    return require_role(current_user, ["admin", "user", "viewer"])


def require_digest_generator(
    current_user: CurrentUser = Depends(get_current_user),
) -> CurrentUser:
    return require_role(current_user, ["admin", "user"])


@router.post("/generate", response_model=DigestResponse)
async def trigger_generate(
    payload: DigestGenerateRequest,
    current_user: CurrentUser = Depends(require_digest_generator),
):
    target_date = payload.digest_date or date_type.today()
    tenant_id = UUID(str(current_user.tenant_id))

    async with AsyncSessionLocal() as session:
        result = await generate_digest(tenant_id, target_date, session)

    return DigestResponse(
        tenant_id=str(current_user.tenant_id),
        digest_date=result["digest_date"],
        metrics=result["metrics"],
        summary_text=result["summary_text"],
    )


@router.get("/latest", response_model=DigestResponse)
async def get_latest(
    current_user: CurrentUser = Depends(require_digest_reader),
):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            text(
                """
                SELECT tenant_id, digest_date, metrics, summary_text, created_at
                FROM daily_digests
                WHERE tenant_id = :tenant_id
                ORDER BY digest_date DESC
                LIMIT 1
                """
            ),
            {
                "tenant_id": str(current_user.tenant_id),
            },
        )

        row = result.mappings().first()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Bu tenant için henüz digest üretilmemiş.",
        )

    data = dict(row)
    data["tenant_id"] = str(data["tenant_id"])

    return DigestResponse(**data)


@router.get("", response_model=DigestResponse)
async def get_by_date(
    date: date_type = Query(...),
    current_user: CurrentUser = Depends(require_digest_reader),
):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            text(
                """
                SELECT tenant_id, digest_date, metrics, summary_text, created_at
                FROM daily_digests
                WHERE tenant_id = :tenant_id AND digest_date = :digest_date
                """
            ),
            {
                "tenant_id": str(current_user.tenant_id),
                "digest_date": date,
            },
        )

        row = result.mappings().first()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Bu tarih için digest bulunamadı.",
        )

    data = dict(row)
    data["tenant_id"] = str(data["tenant_id"])

    return DigestResponse(**data)