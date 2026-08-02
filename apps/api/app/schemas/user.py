"""User management Pydantic şemaları."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel


UserRole = Literal["admin", "user", "viewer"]
UserStatus = Literal["active", "inactive"]


class UserResponse(BaseModel):
    id: UUID
    name: str
    email: str
    role: UserRole
    status: UserStatus
    last_login_at: datetime | None = None
    created_at: datetime


class UserRoleUpdateRequest(BaseModel):
    role: UserRole


class UserStatusUpdateRequest(BaseModel):
    status: UserStatus