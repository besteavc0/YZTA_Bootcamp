from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.api.v1 import health as _health
from app.config import settings

app = FastAPI(
    title="ERPilot API",
    description="Türkçe konuşan ERP veri analizi asistanı - backend API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
app.include_router(_health.router)


@app.get("/", tags=["root"])
async def root() -> dict:
    return {"service": "erpilot-api", "environment": settings.ENVIRONMENT}
