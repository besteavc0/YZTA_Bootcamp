"""Digest için Pydantic şemaları."""

from datetime import date, datetime
from typing import Any

from pydantic import BaseModel


class DigestResponse(BaseModel):
    tenant_id: str
    digest_date: date
    metrics: dict[str, Any]
    summary_text: str
    created_at: datetime | None = None


class DigestGenerateRequest(BaseModel):
    digest_date: date | None = None
