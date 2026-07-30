"""TASK-009 kabul kriterleri: SQL validator güvenlik testleri."""
import pytest

from app.services.sql_validator import validate_sql

TENANT = "11111111-1111-1111-1111-111111111111"


# --- Reddedilmesi GEREKEN sorgular ---
@pytest.mark.parametrize(
    "bad_sql",
    [
        "DROP TABLE canonical_orders",
        "INSERT INTO canonical_orders VALUES (1)",
        "UPDATE canonical_orders SET total_amount = 0 WHERE tenant_id = :tenant_id",
        "DELETE FROM canonical_orders WHERE tenant_id = :tenant_id",
        "SELECT * FROM canonical_orders; DROP TABLE users",
        "SELECT * FROM canonical_orders WHERE tenant_id = :tenant_id -- yorum",
        "SELECT * FROM canonical_orders UNION SELECT * FROM users",
        "SELECT * FROM canonical_orders",  # tenant_id yok
        "TRUNCATE canonical_orders",
    ],
)
def test_dangerous_sql_rejected(bad_sql):
    is_valid, _ = validate_sql(bad_sql, TENANT)
    assert is_valid is False


# --- Geçmesi GEREKEN sorgular ---
def test_valid_select_passes():
    sql = "SELECT order_date, total_amount FROM canonical_orders WHERE tenant_id = :tenant_id LIMIT 10"
    is_valid, result = validate_sql(sql, TENANT)
    assert is_valid is True
    assert "LIMIT 10" in result


def test_limit_added_when_missing():
    sql = "SELECT total_amount FROM canonical_orders WHERE tenant_id = :tenant_id"
    is_valid, result = validate_sql(sql, TENANT)
    assert is_valid is True
    assert "LIMIT 1000" in result


def test_limit_capped_at_max():
    sql = "SELECT * FROM canonical_orders WHERE tenant_id = :tenant_id LIMIT 99999"
    is_valid, result = validate_sql(sql, TENANT)
    assert is_valid is True
    assert "LIMIT 1000" in result
    assert "99999" not in result


def test_markdown_fence_stripped():
    sql = "```sql\nSELECT total_amount FROM canonical_orders WHERE tenant_id = :tenant_id\n```"
    is_valid, result = validate_sql(sql, TENANT)
    assert is_valid is True
    assert "```" not in result
