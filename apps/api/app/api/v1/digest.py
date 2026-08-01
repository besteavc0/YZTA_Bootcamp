"""
Digest API endpoint'leri (TASK-029).

NOT: Auth/RBAC (require_admin) TASK-017/018 kapsaminda eklenecek, su an
endpoint'ler acik - ayni erp.py'deki gecici durum.
"""
from datetime import date as date_type

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import text

from app.db.session import AsyncSessionLocal
from app.schemas.digest import DigestResponse, DigestGenerateRequest
from app.services.digest_service import generate_digest

router = APIRouter(prefix="/digest", tags=["digest"])


@router.post("/generate", response_model=DigestResponse)
async def trigger_generate(payload: DigestGenerateRequest):
    target_date = payload.digest_date or date_type.today()

    async with AsyncSessionLocal() as session:
        result = await generate_digest(payload.tenant_id, target_date, session)

    return DigestResponse(
        tenant_id=payload.tenant_id,
        digest_date=result["digest_date"],
        metrics=result["metrics"],
        summary_text=result["summary_text"],
    )


@router.get("/latest", response_model=DigestResponse)
async def get_latest(tenant_id: str = Query(...)):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            text(
                """
                SELECT tenant_id, digest_date, metrics, summary_text, created_at
                FROM daily_digests
                WHERE tenant_id = :tid
                ORDER BY digest_date DESC
                LIMIT 1
                """
            ),
            {"tid": tenant_id},
        )
        row = result.mappings().first()

    if row is None:
        raise HTTPException(status_code=404, detail="Bu tenant icin henuz digest uretilmemis")

    data = dict(row)
    data["tenant_id"] = str(data["tenant_id"])
    return DigestResponse(**data)


@router.get("", response_model=DigestResponse)
async def get_by_date(tenant_id: str = Query(...), date: date_type = Query(...)):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            text(
                """
                SELECT tenant_id, digest_date, metrics, summary_text, created_at
                FROM daily_digests
                WHERE tenant_id = :tid AND digest_date = :d
                """
            ),
            {"tid": tenant_id, "d": date},
        )
        row = result.mappings().first()

    if row is None:
        raise HTTPException(status_code=404, detail="Bu tarih icin digest bulunamadi")

    data = dict(row)
    data["tenant_id"] = str(data["tenant_id"])
    return DigestResponse(**data)
