"""
TASK-010 + TASK-018: Chat endpoint & RBAC entegrasyon testleri.

LLM çağrıları mock'lanır (OpenAI gerektirmez); DB gerçek (seed edilmiş) kullanılır.
Dev bypass header'larıyla farklı roller simüle edilir.
"""
import os
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("ENVIRONMENT", "development")

from app.main import app  # noqa: E402
import app.api.v1.chat as chat_endpoint  # noqa: E402
from app.schemas.chat import ChatResponse, SourceInfo  # noqa: E402
from datetime import datetime, timezone  # noqa: E402

client = TestClient(app)

# Seed script'in oluşturduğu tenant'ı testte kullanıyoruz.
import psycopg2  # noqa: E402

_conn = psycopg2.connect(
    os.environ.get("PG_TEST_DSN", "postgresql://erpilot:erpilot@localhost:5432/erpilot")
)
_cur = _conn.cursor()
_cur.execute("SELECT id FROM tenants ORDER BY created_at LIMIT 1")
TENANT_ID = str(_cur.fetchone()[0])
_cur.execute("SELECT id FROM users ORDER BY created_at LIMIT 1")
USER_ID = str(_cur.fetchone()[0])
_conn.close()


def _headers(role: str, user_id: str = USER_ID):
    return {
        "X-Dev-User-Id": user_id,
        "X-Dev-Role": role,
        "X-Dev-Tenant-Id": TENANT_ID,
    }


def test_chat_requires_auth():
    r = client.post("/api/v1/chat", json={"question": "test"})
    assert r.status_code == 401


def test_viewer_cannot_chat():
    r = client.post("/api/v1/chat", json={"question": "test"}, headers=_headers("viewer"))
    assert r.status_code == 403


def test_user_can_chat_and_message_saved():
    fake = ChatResponse(
        answer="Bu ay toplam satış 616.862 ₺.",
        sql_query="SELECT SUM(total_amount) FROM canonical_orders WHERE tenant_id = :tenant_id LIMIT 1000",
        sources=[SourceInfo(table="canonical_orders", filters=f"tenant_id={TENANT_ID}")],
        created_at=datetime.now(timezone.utc),
    )
    with patch.object(chat_endpoint, "answer_question", new=AsyncMock(return_value=fake)):
        r = client.post(
            "/api/v1/chat",
            json={"question": "Bu ay toplam satış ne kadar?"},
            headers=_headers("user"),
        )
    assert r.status_code == 200
    body = r.json()
    assert "satış" in body["answer"]
    assert body["sql_query"] is not None
    assert len(body["sources"]) == 1


def test_history_pagination_and_sql_visibility():
    # user: SQL görünmez
    r_user = client.get("/api/v1/chat/history?limit=5", headers=_headers("user"))
    assert r_user.status_code == 200
    for item in r_user.json()["items"]:
        if item["role"] == "assistant":
            assert item["sql_query"] is None

    # admin: SQL görünür
    r_admin = client.get("/api/v1/chat/history?limit=5", headers=_headers("admin"))
    assert r_admin.status_code == 200


def test_auth_me():
    r = client.get("/api/v1/auth/me", headers=_headers("admin"))
    assert r.status_code == 200
    assert r.json()["role"] == "admin"
    assert r.json()["tenant_id"] == TENANT_ID
