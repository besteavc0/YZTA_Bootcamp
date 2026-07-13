from __future__ import annotations

import logging

from openai import AsyncOpenAI
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings

logger = logging.getLogger("erpilot.ai.embeddings")

_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


async def generate_embedding(text_input: str) -> list[float]:
    response = await _client.embeddings.create(
        model=settings.EMBEDDING_MODEL,
        input=text_input,
    )
    return response.data[0].embedding


async def update_glossary_embeddings(db: AsyncSession) -> int:
    result = await db.execute(
        text(
            "SELECT id, table_name, column_name, turkish_label, description, aliases "
            "FROM business_glossary WHERE embedding IS NULL"
        )
    )
    rows = result.fetchall()
    updated = 0

    for row in rows:
        aliases = row.aliases or []
        alias_text = ", ".join(aliases) if isinstance(aliases, list) else str(aliases)
        combined = (
            f"{row.turkish_label}. {row.description or ''}. "
            f"Eş anlamlılar: {alias_text}. "
            f"Tablo: {row.table_name}, kolon: {row.column_name}"
        )
        embedding = await generate_embedding(combined)
        vector_literal = "[" + ",".join(str(x) for x in embedding) + "]"
        await db.execute(
            text("UPDATE business_glossary SET embedding = :emb WHERE id = :id"),
            {"emb": vector_literal, "id": row.id},
        )
        updated += 1

    await db.commit()
    logger.info("glossary_embeddings_updated count=%d", updated)
    return updated
