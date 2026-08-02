from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.anomaly import AnomalyFinding, AnomalyRule
from app.schemas.anomaly import AnomalyFindingResponse, AnomalyListResponse
from app.security.auth import CurrentUser
from app.security.rbac import require_role

router = APIRouter(prefix="/anomalies", tags=["anomalies"])


RULE_TITLE_MAP = {
    "gece_saati_yuksek_tutarli_siparis": "Gece saati yüksek tutarlı sipariş",
    "kisa_surede_cok_siparis": "Aynı müşteriden kısa sürede çok sipariş",
    "negatif_veya_sifir_stok": "Negatif veya sıfır stok",
    "ortalamanin_3_katindan_fazla_tutar": "Ortalamanın 3 katından fazla sipariş tutarı",
    "30_gun_siparis_vermeyen_musteri": "30 gündür sipariş vermeyen müşteri",
}


def map_finding(
    finding: AnomalyFinding,
    rule: AnomalyRule | None,
) -> AnomalyFindingResponse:
    rule_name = rule.name if rule else None
    title = RULE_TITLE_MAP.get(rule_name or "", rule.description if rule else "Anomali")

    return AnomalyFindingResponse(
        id=str(finding.id),
        title=title,
        description=finding.description,
        severity=finding.severity,
        isResolved=finding.is_resolved,
        detectedAt=finding.detected_at.isoformat(),
        metadata={
            "ruleName": rule_name,
            "resourceType": finding.resource_type,
            "externalId": finding.resource_external_id,
            "resolvedAt": finding.resolved_at.isoformat()
            if finding.resolved_at
            else None,
            "resolutionNote": finding.resolution_note,
        },
    )


@router.get("", response_model=AnomalyListResponse)
async def list_anomalies(
    severity: str | None = Query(default=None),
    is_resolved: bool | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> AnomalyListResponse:
    require_role(current_user, ["admin", "user", "viewer"])

    tenant_uuid = UUID(str(current_user.tenant_id))

    stmt = (
        select(AnomalyFinding, AnomalyRule)
        .join(AnomalyRule, AnomalyRule.id == AnomalyFinding.rule_id)
        .where(AnomalyFinding.tenant_id == tenant_uuid)
        .order_by(AnomalyFinding.detected_at.desc())
        .limit(limit)
        .offset(offset)
    )

    if severity:
        stmt = stmt.where(AnomalyFinding.severity == severity)

    if is_resolved is not None:
        stmt = stmt.where(AnomalyFinding.is_resolved.is_(is_resolved))

    result = await db.execute(stmt)
    rows = result.all()

    return AnomalyListResponse(
        items=[map_finding(finding, rule) for finding, rule in rows]
    )


@router.patch("/{finding_id}/resolve", response_model=AnomalyFindingResponse)
async def resolve_anomaly(
    finding_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> AnomalyFindingResponse:
    require_role(current_user, ["admin"])

    tenant_uuid = UUID(str(current_user.tenant_id))
    user_uuid = UUID(str(current_user.user_id))

    result = await db.execute(
        select(AnomalyFinding, AnomalyRule)
        .join(AnomalyRule, AnomalyRule.id == AnomalyFinding.rule_id)
        .where(
            AnomalyFinding.id == finding_id,
            AnomalyFinding.tenant_id == tenant_uuid,
        )
    )
    row = result.first()

    if row is None:
        raise HTTPException(status_code=404, detail="Anomali bulunamadı.")

    finding, rule = row

    finding.is_resolved = True
    finding.resolved_by = user_uuid
    finding.resolved_at = datetime.utcnow()

    await db.commit()
    await db.refresh(finding)

    return map_finding(finding, rule)