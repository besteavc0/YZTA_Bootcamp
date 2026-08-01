"""
Gunluk ozet (morning digest) servisi - TASK-029.

generate_digest(): bir tenant + tarih icin metrikleri hesaplar, LLM ile
Turkce ozet paragrafi uretir, daily_digests tablosuna upsert eder.

daily_digests icin ayri bir ORM modeli yazmadik (init_db.sql'de tablo zaten
var, TASK-003 kapsaminda bilerek disarida birakilmisti) - burada dogrudan
SQLAlchemy text() ile calisiyoruz, ayni apps/api/app/api/v1/erp.py'deki gibi.
"""
from __future__ import annotations

import json
import logging
import uuid
from datetime import date, timedelta
from typing import Any
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.llm_client import llm_client
from app.ai.prompt_loader import load_prompt

logger = logging.getLogger("erpilot.services.digest_service")


def _pct_change(today: float, yesterday: float) -> float | None:
    """Yuzde degisim hesaplar. Dun 0 ise None doner (bolme hatasi olmasin)."""
    if yesterday == 0:
        return None
    return round(((today - yesterday) / yesterday) * 100, 1)


async def _fetch_metrics(tenant_id: UUID, target_date: date, db: AsyncSession) -> dict[str, Any]:
    """Digest icin gereken tum metrikleri DB'den ceker."""
    yesterday = target_date - timedelta(days=1)

    # 1) Bugunku ve dunku siparis sayisi + toplam tutar
    today_result = await db.execute(
        text(
            """
            SELECT COUNT(*) AS order_count, COALESCE(SUM(total_amount), 0) AS total_amount
            FROM canonical_orders
            WHERE tenant_id = :tid AND order_date::date = :d
            """
        ),
        {"tid": tenant_id, "d": target_date},
    )
    today_row = today_result.mappings().first()

    yesterday_result = await db.execute(
        text(
            """
            SELECT COUNT(*) AS order_count, COALESCE(SUM(total_amount), 0) AS total_amount
            FROM canonical_orders
            WHERE tenant_id = :tid AND order_date::date = :d
            """
        ),
        {"tid": tenant_id, "d": yesterday},
    )
    yesterday_row = yesterday_result.mappings().first()

    today_order_count = today_row["order_count"] or 0
    today_total_amount = float(today_row["total_amount"] or 0)
    yesterday_order_count = yesterday_row["order_count"] or 0
    yesterday_total_amount = float(yesterday_row["total_amount"] or 0)

    # 2) En cok siparis veren 3 musteri (bugun)
    top_customers_result = await db.execute(
        text(
            """
            SELECT
                COALESCE(cc.name, o.customer_external_id) AS customer_name,
                COUNT(*) AS order_count,
                COALESCE(SUM(o.total_amount), 0) AS total_amount
            FROM canonical_orders o
            LEFT JOIN canonical_customers cc
                ON cc.tenant_id = o.tenant_id AND cc.external_id = o.customer_external_id
            WHERE o.tenant_id = :tid AND o.order_date::date = :d
            GROUP BY COALESCE(cc.name, o.customer_external_id)
            ORDER BY COUNT(*) DESC
            LIMIT 3
            """
        ),
        {"tid": tenant_id, "d": target_date},
    )
    top_customers = [
        {
            "name": row["customer_name"],
            "order_count": row["order_count"],
            "total_amount": float(row["total_amount"]),
        }
        for row in top_customers_result.mappings().all()
    ]

    # 3) Kritik stok altindaki urun sayisi
    critical_stock_result = await db.execute(
        text(
            """
            SELECT COUNT(*) AS cnt
            FROM canonical_inventory
            WHERE tenant_id = :tid AND quantity < reorder_level
            """
        ),
        {"tid": tenant_id},
    )
    critical_stock_count = critical_stock_result.scalar() or 0

    # 4) Bugun tespit edilen yeni anomali sayisi
    new_anomalies_result = await db.execute(
        text(
            """
            SELECT COUNT(*) AS cnt
            FROM anomaly_findings
            WHERE tenant_id = :tid AND detected_at::date = :d
            """
        ),
        {"tid": tenant_id, "d": target_date},
    )
    new_anomalies_count = new_anomalies_result.scalar() or 0

    return {
        "digest_date": target_date.isoformat(),
        "today_order_count": today_order_count,
        "today_total_amount": today_total_amount,
        "yesterday_order_count": yesterday_order_count,
        "yesterday_total_amount": yesterday_total_amount,
        "order_count_change_pct": _pct_change(today_order_count, yesterday_order_count),
        "total_amount_change_pct": _pct_change(today_total_amount, yesterday_total_amount),
        "top_customers": top_customers,
        "critical_stock_count": critical_stock_count,
        "new_anomalies_count": new_anomalies_count,
    }


async def build_digest_text(metrics: dict[str, Any]) -> str:
    """Metrikleri LLM'e gonderip Turkce yonetici ozeti uretir."""
    prompt_template = load_prompt("digest_summary")
    system_prompt = prompt_template.format(
        metrics=json.dumps(metrics, ensure_ascii=False, indent=2)
    )
    summary = await llm_client.complete(system_prompt, "Ozet metnini olustur.")
    return summary.strip()


async def _upsert_digest(
    tenant_id: UUID, target_date: date, metrics: dict[str, Any], summary_text: str, db: AsyncSession
) -> None:
    await db.execute(
        text(
            """
            INSERT INTO daily_digests (id, tenant_id, digest_date, metrics, summary_text)
            VALUES (:id, :tid, :d, :metrics, :summary)
            ON CONFLICT (tenant_id, digest_date) DO UPDATE
                SET metrics = EXCLUDED.metrics,
                    summary_text = EXCLUDED.summary_text
            """
        ),
        {
            "id": str(uuid.uuid4()),
            "tid": tenant_id,
            "d": target_date,
            "metrics": json.dumps(metrics, ensure_ascii=False),
            "summary": summary_text,
        },
    )
    await db.commit()


async def generate_digest(tenant_id: UUID, target_date: date, db: AsyncSession) -> dict[str, Any]:
    """
    Bir tenant + tarih icin digest uretir: metrikleri hesaplar, LLM ile
    Turkce ozet paragrafi uretir, daily_digests tablosuna upsert eder.
    """
    metrics = await _fetch_metrics(tenant_id, target_date, db)
    summary_text = await build_digest_text(metrics)
    await _upsert_digest(tenant_id, target_date, metrics, summary_text, db)

    logger.info(
        "digest_generated tenant_id=%s date=%s orders=%d anomalies=%d",
        tenant_id, target_date, metrics["today_order_count"], metrics["new_anomalies_count"],
    )
    return {"metrics": metrics, "summary_text": summary_text, "digest_date": target_date}
