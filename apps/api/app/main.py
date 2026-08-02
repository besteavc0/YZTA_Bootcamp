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

allowed_origins = {
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://erpilot.up.railway.app",
}

frontend_url = getattr(settings, "FRONTEND_URL", None)
if frontend_url:
    allowed_origins.add(frontend_url.rstrip("/"))

if settings.FRONTEND_URL not in allowed_origins:
    allowed_origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
app.include_router(_health.router)


@app.get("/", tags=["root"])
async def root() -> dict:
    return {"service": "erpilot-api", "environment": settings.ENVIRONMENT}
