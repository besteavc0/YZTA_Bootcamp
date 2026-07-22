from __future__ import annotations

import logging

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.embeddings import generate_embedding
from app.ai.llm_client import llm_client
from app.ai.prompt_loader import load_prompt

logger = logging.getLogger("erpilot.services.sql_generator")

_SCHEMA_DDL = """
canonical_orders(id, tenant_id, external_id, source, customer_external_id,
                 order_date TIMESTAMPTZ, total_amount NUMERIC, status)
canonical_customers(id, tenant_id, external_id, source, name, city, segment)
canonical_inventory(id, tenant_id, external_id, source, product_name, warehouse,
                    quantity NUMERIC, reorder_level NUMERIC)
""".strip()

_EXAMPLES = """
Soru: Bu ay toplam satış tutarı ne kadar?
SQL: SELECT SUM(total_amount) AS toplam_satis FROM canonical_orders WHERE tenant_id = :tenant_id AND order_date >= date_trunc('month', CURRENT_DATE)

Soru: Kritik stok seviyesindeki ürünler hangileri?
SQL: SELECT product_name, quantity, reorder_level FROM canonical_inventory WHERE tenant_id = :tenant_id AND quantity < reorder_level
""".strip()


async def _fetch_relevant_glossary(question: str, db: AsyncSession, top_k: int = 8) -> str:
    try:
        embedding = await generate_embedding(question)
        vector_literal = "[" + ",".join(str(x) for x in embedding) + "]"
        result = await db.execute(
            text(
                "SELECT table_name, column_name, turkish_label, description, aliases "
                "FROM business_glossary WHERE embedding IS NOT NULL "
                "ORDER BY embedding <=> :emb LIMIT :k"
            ),
            {"emb": vector_literal, "k": top_k},
        )
        rows = result.fetchall()
    except Exception as exc:
        logger.warning("glossary_semantic_search_failed err=%s, tüm sözlük kullanılacak", exc)
        result = await db.execute(
            text(
                "SELECT table_name, column_name, turkish_label, description, aliases "
                "FROM business_glossary LIMIT :k"
            ),
            {"k": top_k},
        )
        rows = result.fetchall()

    lines = []
    for r in rows:
        aliases = r.aliases or []
        alias_text = ", ".join(aliases) if isinstance(aliases, list) else str(aliases)
        lines.append(
            f"- {r.table_name}.{r.column_name} = '{r.turkish_label}' "
            f"(eş anlamlılar: {alias_text})"
        )
    return "\n".join(lines) if lines else "(sözlük boş)"


async def generate_sql(question: str, tenant_id: str, db: AsyncSession) -> str:
    glossary = await _fetch_relevant_glossary(question, db)
    schema_block = f"{_SCHEMA_DDL}\n\nTürkçe sözlük:\n{glossary}"

    system_prompt = load_prompt("text_to_sql").format(
        schema=schema_block,
        examples=_EXAMPLES,
    )

    raw_sql = await llm_client.complete(system_prompt, question)
    logger.info("sql_generated question=%r", question[:80])
    return raw_sql.strip()
