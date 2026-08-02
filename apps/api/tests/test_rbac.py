"""
TASK-021 · RBAC testleri

Rol bazlı erişim kontrolünün kritik endpointlerde doğru çalıştığını doğrular.
Özellikle TASK-018 kapsamında ERP endpointlerinin sadece admin rolüne açık
olması beklenir.
"""

import os

os.environ.setdefault("ENVIRONMENT", "development")

import psycopg2  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

client = TestClient(app)

_conn = psycopg2.connect(
    os.environ.get("PG_TEST_DSN", "postgresql://erpilot:erpilot@postgres:5432/erpilot")
)

_cur = _conn.cursor()
_cur.execute("SELECT id FROM tenants ORDER BY created_at LIMIT 1")
TENANT_ID = str(_cur.fetchone()[0])

_cur.execute("SELECT id FROM users ORDER BY created_at LIMIT 1")
USER_ID = str(_cur.fetchone()[0])

_conn.close()


def _headers(role: str):
    return {
        "X-Dev-User-Id": USER_ID,
        "X-Dev-Role": role,
        "X-Dev-Tenant-Id": TENANT_ID,
    }


def test_erp_connections_requires_authentication():
    response = client.get("/api/v1/erp/connections")

    assert response.status_code == 401


def test_user_cannot_access_erp_connections():
    response = client.get("/api/v1/erp/connections", headers=_headers("user"))

    assert response.status_code == 403


def test_viewer_cannot_access_erp_connections():
    response = client.get("/api/v1/erp/connections", headers=_headers("viewer"))

    assert response.status_code == 403


def test_admin_can_access_erp_connections():
    response = client.get("/api/v1/erp/connections", headers=_headers("admin"))

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_user_cannot_trigger_erp_sync():
    response = client.post(
        "/api/v1/erp/connections/00000000-0000-0000-0000-000000000000/sync",
        headers=_headers("user"),
    )

    assert response.status_code == 403


def test_viewer_cannot_test_erp_connection():
    response = client.post(
        "/api/v1/erp/connections/00000000-0000-0000-0000-000000000000/test",
        headers=_headers("viewer"),
    )

    assert response.status_code == 403


def test_admin_reaches_erp_sync_endpoint_but_unknown_connection_returns_404():
    response = client.post(
        "/api/v1/erp/connections/00000000-0000-0000-0000-000000000000/sync",
        headers=_headers("admin"),
    )

    assert response.status_code == 404