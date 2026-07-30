from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class ChatRequest(BaseModel):
    question: str


class SourceInfo(BaseModel):
    table: str
    filters: str


class ChatResponse(BaseModel):
    answer: str
    sql_query: str | None = None
    sources: list[SourceInfo] = []
    created_at: datetime


class ChatHistoryItem(BaseModel):
    id: str
    role: str
    content: str
    sql_query: str | None = None
    sources: list[SourceInfo] = []
    created_at: datetime
