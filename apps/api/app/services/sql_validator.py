from __future__ import annotations

import re

import sqlparse

_FORBIDDEN_KEYWORDS = [
    "INSERT", "UPDATE", "DELETE", "DROP", "TRUNCATE", "ALTER",
    "CREATE", "GRANT", "REVOKE", "EXEC", "EXECUTE", "MERGE", "REPLACE",
]

_MAX_LIMIT = 1000


def _strip_sql(sql: str) -> str:
    cleaned = sql.strip()
    cleaned = re.sub(r"^```(?:sql)?", "", cleaned, flags=re.IGNORECASE).strip()
    cleaned = re.sub(r"```$", "", cleaned).strip()
    return cleaned.rstrip(";").strip()


def validate_sql(sql: str, tenant_id: str) -> tuple[bool, str]:
    if not sql or not sql.strip():
        return False, "Boş SQL sorgusu."

    cleaned = _strip_sql(sql)
    upper = cleaned.upper()

    statements = [s for s in sqlparse.parse(cleaned) if s.tokens]
    if len(statements) != 1:
        return False, "Yalnızca tek bir SELECT ifadesine izin verilir."

    stmt_type = statements[0].get_type()
    if stmt_type != "SELECT":
        return False, f"Yalnızca SELECT sorgularına izin verilir (bulunan: {stmt_type})."

    for kw in _FORBIDDEN_KEYWORDS:
        if re.search(rf"\b{kw}\b", upper):
            return False, f"Yasak ifade tespit edildi: {kw}"

    if "--" in cleaned or "/*" in cleaned:
        return False, "SQL yorumlarına izin verilmez."
    if ";" in cleaned:
        return False, "Çoklu sorgu (;) tespit edildi."

    if re.search(r"\bUNION\b", upper):
        return False, "UNION kullanımına izin verilmez."

    if "TENANT_ID" not in upper:
        return False, "Sorguda zorunlu tenant_id filtresi yok."

    limit_match = re.search(r"\bLIMIT\s+(\d+)", upper)
    if limit_match:
        current = int(limit_match.group(1))
        if current > _MAX_LIMIT:
            cleaned = re.sub(
                r"\bLIMIT\s+\d+",
                f"LIMIT {_MAX_LIMIT}",
                cleaned,
                flags=re.IGNORECASE,
            )
    else:
        cleaned = f"{cleaned} LIMIT {_MAX_LIMIT}"

    return True, cleaned
