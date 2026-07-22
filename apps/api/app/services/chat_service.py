from __future__ import annotations

import logging
import re
from datetime import datetime, timezone

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.llm_client import llm_client
from app.schemas.chat import ChatResponse, SourceInfo
from app.services.sql_generator import generate_sql
from app.services.sql_validator import validate_sql

logger = logging.getLogger("erpilot.services.chat")

_CANNOT_ANSWER = (
    "Bu soruyu anlayamadım, lütfen farklı bir şekilde sorar mısınız?"
)

_SUMMARY_SYSTEM = (
    "Sen bir ERP veri analisti asistanısın. Sana bir kullanıcının Türkçe sorusu ve "
    "veritabanından dönen sonuç veriliyor. Sonucu, yönetici dostu, kısa ve net bir "
    "Türkçe cümleyle özetle. Sayıları Türk Lirası (₺) ve binlik ayraçla yaz. "
    "Uydurma yapma, sadece verilen veriyi kullan."
)


def _extract_tables(sql: str) -> list[str]:
    tables = re.findall(r"\b(?:FROM|JOIN)\s+([a-zA-Z_][a-zA-Z0-9_]*)", sql, flags=re.IGNORECASE)
    seen: list[str] = []
    for t in tables:
        if t.lower() not in [s.lower() for s in seen]:
            seen.append(t)
    return seen


async def answer_question(
    question: str,
    tenant_id: str,
    db: AsyncSession,
) -> ChatResponse:
    now = datetime.now(timezone.utc)

    raw_sql = await generate_sql(question, tenant_id, db)

    if not raw_sql or raw_sql.strip().upper().startswith("BILINMIYOR"):
        return ChatResponse(answer=_CANNOT_ANSWER, sql_query=None, sources=[], created_at=now)

    is_valid, result = validate_sql(raw_sql, tenant_id)
    if not is_valid:
        logger.warning("sql_rejected reason=%s sql=%r", result, raw_sql[:120])
        return ChatResponse(answer=_CANNOT_ANSWER, sql_query=None, sources=[], created_at=now)

    safe_sql = result

    try:
        rows_result = await db.execute(text(safe_sql), {"tenant_id": tenant_id})
        rows = rows_result.fetchall()
        columns = list(rows_result.keys())
    except Exception as exc:
        logger.error("sql_execution_failed err=%s sql=%r", exc, safe_sql[:120])
        return ChatResponse(answer=_CANNOT_ANSWER, sql_query=safe_sql, sources=[], created_at=now)

    data_preview = [dict(zip(columns, row)) for row in rows[:50]]
    summary_input = f"Soru: {question}\nSonuç (ilk 50 satır): {data_preview}"
    try:
        answer = await llm_client.complete(_SUMMARY_SYSTEM, summary_input)
    except Exception as exc:
        logger.error("summary_failed err=%s", exc)
        answer = f"Sorgu {len(rows)} kayıt döndürdü."

    sources = [SourceInfo(table=t, filters=f"tenant_id={tenant_id}") for t in _extract_tables(safe_sql)]

    return ChatResponse(
        answer=answer.strip(),
        sql_query=safe_sql,
        sources=sources,
        created_at=now,
    )
