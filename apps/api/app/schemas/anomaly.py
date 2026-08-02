from typing import Any

from pydantic import BaseModel


class AnomalyFindingResponse(BaseModel):
    id: str
    title: str
    description: str | None = None
    severity: str
    isResolved: bool
    detectedAt: str
    metadata: dict[str, Any]


class AnomalyListResponse(BaseModel):
    items: list[AnomalyFindingResponse]