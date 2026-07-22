from __future__ import annotations

import json

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_user
from app.schemas.chat import ChatRequest, ChatResponse
from app.security.auth import CurrentUser
from app.security.rbac import require_role
from app.services.chat_service import answer_question

router = APIRouter()


@router.get("/auth/me", tags=["auth"])
async def me(user: CurrentUser = Depends(get_current_user)) -> dict:
    return {
        "user_id": user.user_id,
        "tenant_id": user.tenant_id,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
    }


@router.post("/chat", response_model=ChatResponse, tags=["chat"])
async def chat(
    payload: ChatRequest,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ChatResponse:
    require_role(user, ["admin", "user"])

    response = await answer_question(payload.question, user.tenant_id, db)

    sources_json = json.dumps([s.model_dump() for s in response.sources])
    await db.execute(
        text(
            "INSERT INTO chat_messages (tenant_id, user_id, role, content) "
            "VALUES (:tid, :uid, 'user', :content)"
        ),
        {"tid": user.tenant_id, "uid": user.user_id, "content": payload.question},
    )
    await db.execute(
        text(
            "INSERT INTO chat_messages (tenant_id, user_id, role, content, sql_query, sources) "
            "VALUES (:tid, :uid, 'assistant', :content, :sql, :sources)"
        ),
        {
            "tid": user.tenant_id,
            "uid": user.user_id,
            "content": response.answer,
            "sql": response.sql_query,
            "sources": sources_json,
        },
    )
    await db.commit()
    return response


@router.get("/chat/history", tags=["chat"])
async def chat_history(
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0, ge=0),
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    require_role(user, ["admin", "user", "viewer"])

    if user.role == "admin":
        query = (
            "SELECT id, role, content, sql_query, sources, created_at "
            "FROM chat_messages WHERE tenant_id = :tid "
            "ORDER BY created_at DESC LIMIT :limit OFFSET :offset"
        )
    else:
        query = (
            "SELECT id, role, content, sql_query, sources, created_at "
            "FROM chat_messages WHERE tenant_id = :tid "
            "ORDER BY created_at DESC LIMIT :limit OFFSET :offset"
        )

    result = await db.execute(
        text(query),
        {"tid": user.tenant_id, "limit": limit, "offset": offset},
    )
    rows = result.fetchall()
    items = [
        {
            "id": str(r.id),
            "role": r.role,
            "content": r.content,
            "sql_query": r.sql_query if user.role == "admin" else None,
            "sources": r.sources,
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]
    return {"items": items, "limit": limit, "offset": offset}
