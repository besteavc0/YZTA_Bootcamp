from fastapi import APIRouter
from app.api.v1 import chat, health, erp, digest

from app.api.v1 import chat, health, erp, audit, excel, dashboard

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(chat.router)
api_router.include_router(erp.router)
api_router.include_router(digest.router)
api_router.include_router(audit.router)
api_router.include_router(excel.router)
api_router.include_router(dashboard.router)
