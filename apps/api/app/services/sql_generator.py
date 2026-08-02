from __future__ import annotations

import logging

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.embeddings import generate_embedding
from app.ai.llm_client import llm_client
from app.ai.prompt_loader import load_prompt

import re
import unicodedata

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

Soru: Aylara göre toplam satışları listele.
SQL: SELECT date_trunc('month', order_date) AS ay, SUM(total_amount) AS toplam_satis
FROM canonical_orders
WHERE tenant_id = :tenant_id
GROUP BY ay
ORDER BY toplam_satis DESC
LIMIT 1000;

Soru: En çok satış yapılan ay hangisidir?
SQL: SELECT date_trunc('month', order_date) AS ay, SUM(total_amount) AS toplam_satis
FROM canonical_orders
WHERE tenant_id = :tenant_id
GROUP BY ay
ORDER BY toplam_satis DESC
LIMIT 1;

Soru: Stok seviyesi kritik olan ürünler hangileridir?
SQL: SELECT product_name, quantity, reorder_level
FROM canonical_inventory
WHERE tenant_id = :tenant_id AND quantity < reorder_level
LIMIT 1000;

Soru: Müşterilere göre toplam satışları listele.
SQL: SELECT c.name, SUM(o.total_amount) AS toplam_satis
FROM canonical_orders o
LEFT JOIN canonical_customers c
  ON c.tenant_id = o.tenant_id
 AND c.external_id = o.customer_external_id
WHERE o.tenant_id = :tenant_id
GROUP BY c.name
ORDER BY toplam_satis DESC
LIMIT 1000;
""".strip()

def _normalize_question(question: str) -> str:
    normalized = question.casefold()

    # Türkçe karakterleri ASCII karşılıklarına indir.
    translation_table = str.maketrans(
        {
            "ç": "c",
            "ğ": "g",
            "ı": "i",
            "i̇": "i",
            "ö": "o",
            "ş": "s",
            "ü": "u",
        }
    )
    normalized = normalized.translate(translation_table)

    normalized = unicodedata.normalize("NFKD", normalized)
    normalized = "".join(
        char for char in normalized if not unicodedata.combining(char)
    )
    normalized = re.sub(r"\s+", " ", normalized)

    return normalized.strip()

def _contains_any(text: str, keywords: list[str]) -> bool:
    return any(keyword in text for keyword in keywords)


def _generate_rule_based_sql(question: str) -> str | None:
    q = _normalize_question(question)

    asks_sales = _contains_any(
    q,
    ["satis", "ciro", "tutar", "gelir", "siparis"]
)
    asks_month = _contains_any(
    q,
    ["ay", "aylar", "aylik", "hangi aylarda", "aylarda"]
)
    asks_customer = _contains_any(q, ["musteri", "cari"])
    asks_stock = _contains_any(q, ["stok", "urun", "envanter"])
    asks_critical = _contains_any(q, ["kritik", "az", "dusuk", "reorder"])
    asks_count = _contains_any(q, ["kac", "adet", "sayisi", "count"])
    asks_highest = _contains_any(q, ["en cok", "daha fazla", "en fazla", "yuksek"])
    asks_this_year = _contains_any(
    q,
    ["bu yil", "bu sene", "2026", "yil", "sene"]
)
    asks_this_month = _contains_any(q, ["bu ay", "ay toplam"])

    if _contains_any(q, ["hangi aylarda", "aylarda satis", "bu yil hangi aylarda"]):
        return """
SELECT
  to_char(date_trunc('month', order_date), 'YYYY-MM') AS ay,
  SUM(total_amount) AS toplam_satis,
  COUNT(*) AS siparis_sayisi
FROM canonical_orders
WHERE tenant_id = :tenant_id
  AND order_date >= date_trunc('year', CURRENT_DATE)
GROUP BY date_trunc('month', order_date)
ORDER BY date_trunc('month', order_date)
LIMIT 1000
""".strip()

    if asks_stock and asks_critical:
        return """
SELECT product_name, warehouse, quantity, reorder_level
FROM canonical_inventory
WHERE tenant_id = :tenant_id
  AND quantity < reorder_level
ORDER BY quantity ASC
LIMIT 1000
""".strip()

    if asks_customer and asks_sales:
        return """
SELECT
  COALESCE(c.name, o.customer_external_id, 'Bilinmeyen müşteri') AS musteri,
  SUM(o.total_amount) AS toplam_satis,
  COUNT(*) AS siparis_sayisi
FROM canonical_orders o
LEFT JOIN canonical_customers c
  ON c.tenant_id = o.tenant_id
 AND c.external_id = o.customer_external_id
WHERE o.tenant_id = :tenant_id
GROUP BY COALESCE(c.name, o.customer_external_id, 'Bilinmeyen müşteri')
ORDER BY toplam_satis DESC
LIMIT 1000
""".strip()

    if asks_sales and asks_month:
        year_filter = (
            "AND order_date >= date_trunc('year', CURRENT_DATE)"
            if asks_this_year
            else ""
        )

        return f"""
SELECT
  to_char(date_trunc('month', order_date), 'YYYY-MM') AS ay,
  SUM(total_amount) AS toplam_satis,
  COUNT(*) AS siparis_sayisi
FROM canonical_orders
WHERE tenant_id = :tenant_id
  {year_filter}
GROUP BY date_trunc('month', order_date)
ORDER BY date_trunc('month', order_date)
LIMIT 1000
""".strip()

    if asks_sales and asks_this_month:
        return """
SELECT
  SUM(total_amount) AS toplam_satis,
  COUNT(*) AS siparis_sayisi
FROM canonical_orders
WHERE tenant_id = :tenant_id
  AND order_date >= date_trunc('month', CURRENT_DATE)
LIMIT 1000
""".strip()

    if asks_sales and asks_highest:
        return """
SELECT external_id, customer_external_id, order_date, total_amount, status
FROM canonical_orders
WHERE tenant_id = :tenant_id
ORDER BY total_amount DESC
LIMIT 1
""".strip()

    if asks_count and _contains_any(q, ["siparis", "order"]):
        return """
SELECT COUNT(*) AS siparis_sayisi
FROM canonical_orders
WHERE tenant_id = :tenant_id
LIMIT 1000
""".strip()

    if _contains_any(q, ["baska ay", "diger ay", "agustos disinda", "bu ay disinda"]):
        return """
SELECT
  to_char(date_trunc('month', order_date), 'YYYY-MM') AS ay,
  SUM(total_amount) AS toplam_satis,
  COUNT(*) AS siparis_sayisi
FROM canonical_orders
WHERE tenant_id = :tenant_id
GROUP BY date_trunc('month', order_date)
ORDER BY date_trunc('month', order_date)
LIMIT 1000
""".strip()

    return None


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
    rule_based_sql = _generate_rule_based_sql(question)
    if rule_based_sql:
        logger.info("sql_generated_rule_based question=%r", question[:80])
        return rule_based_sql

    glossary = await _fetch_relevant_glossary(question, db)
    schema_block = f"{_SCHEMA_DDL}\n\nTürkçe sözlük:\n{glossary}"

    system_prompt = load_prompt("text_to_sql").format(
        schema=schema_block,
        examples=_EXAMPLES,
    )

    raw_sql = await llm_client.complete(system_prompt, question)
    logger.info("sql_generated question=%r", question[:80])
    return raw_sql.strip()


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
