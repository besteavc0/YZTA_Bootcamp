"""
TASK-021 · Güvenlik & Tenant İzolasyon Testleri

Multi-tenant yapının güvenliğini ve RBAC kurallarını kanıtlar:
  - SQL validator'ın tenant_id atlatan sorguları reddettiği
  - Cross-tenant erişimin engellendiği (üretilen SQL daima :tenant_id parametreli)
  - Rol bazlı erişim matrisinin doğru uygulandığı
"""
import os

os.environ.setdefault("ENVIRONMENT", "development")

import psycopg2  # noqa: E402
import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.services.sql_validator import validate_sql  # noqa: E402

client = TestClient(app)

_conn = psycopg2.connect(
    os.environ.get("PG_TEST_DSN", "postgresql://erpilot:erpilot@localhost:5432/erpilot")
)
_cur = _conn.cursor()
_cur.execute("SELECT id FROM tenants ORDER BY created_at LIMIT 1")
TENANT_A = str(_cur.fetchone()[0])
_cur.execute("SELECT id FROM users ORDER BY created_at LIMIT 1")
USER_ID = str(_cur.fetchone()[0])
_conn.close()

# Var olmayan başka bir tenant (izolasyon testi için)
TENANT_B = "99999999-9999-9999-9999-999999999999"


def _headers(role: str, tenant: str = TENANT_A):
    return {"X-Dev-User-Id": USER_ID, "X-Dev-Role": role, "X-Dev-Tenant-Id": tenant}


# ---------- Tenant izolasyonu (validator seviyesi) ----------
def test_sql_without_tenant_filter_rejected():
    """tenant_id filtresi olmayan sorgu reddedilmeli — cross-tenant sızıntı önlenir."""
    is_valid, _ = validate_sql("SELECT * FROM canonical_orders", TENANT_A)
    assert is_valid is False


def test_cross_tenant_union_rejected():
    """Başka tabloya UNION ile sızmaya çalışan sorgu reddedilmeli."""
    bad = "SELECT * FROM canonical_orders WHERE tenant_id = :tenant_id UNION SELECT * FROM users"
    is_valid, _ = validate_sql(bad, TENANT_A)
    assert is_valid is False


def test_valid_tenant_scoped_query_passes():
    good = "SELECT total_amount FROM canonical_orders WHERE tenant_id = :tenant_id"
    is_valid, safe = validate_sql(good, TENANT_A)
    assert is_valid is True
    assert ":tenant_id" in safe  # parametre korunmuş


# ---------- RBAC matrisi ----------
def test_unauthenticated_gets_401():
    assert client.post("/api/v1/chat", json={"question": "x"}).status_code == 401
    assert client.get("/api/v1/auth/me").status_code == 401


def test_viewer_cannot_chat():
    r = client.post("/api/v1/chat", json={"question": "x"}, headers=_headers("viewer"))
    assert r.status_code == 403


def test_viewer_can_read_history():
    r = client.get("/api/v1/chat/history", headers=_headers("viewer"))
    assert r.status_code == 200


@pytest.mark.parametrize("role", ["admin", "user"])
def test_authorized_roles_reach_me(role):
    r = client.get("/api/v1/auth/me", headers=_headers(role))
    assert r.status_code == 200
    assert r.json()["role"] == role
