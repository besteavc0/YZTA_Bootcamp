from fastapi import APIRouter

from app.api.v1 import (
    anomalies,
    audit,
    chat,
    dashboard,
    digest,
    erp,
    excel,
    health,
    users,
)

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(chat.router)
api_router.include_router(erp.router, prefix="/erp", tags=["erp"])
api_router.include_router(digest.router, prefix="/digest", tags=["digest"])
api_router.include_router(audit.router, prefix="/audit", tags=["audit"])
api_router.include_router(excel.router, prefix="/excel", tags=["excel"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(anomalies.router, prefix="/anomalies", tags=["anomalies"])
api_router.include_router(audit.router, prefix="/audit", tags=["audit"])