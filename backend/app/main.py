from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.db import engine, sync_schema
from app.models import Base
from app.routers.ai import router as ai_router
from app.routers.admin import router as admin_router
from app.routers.auth import router as auth_router
from app.routers.marketplace import router as market_router
from app.routers.me import router as me_router

app = FastAPI(title=settings.app_name)

uploads_dir = Path("backend/uploads")
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(me_router)
app.include_router(market_router)
app.include_router(ai_router)
app.include_router(admin_router)


@app.get("/health")
def health():
    return {"ok": True, "app": settings.app_name}


@app.on_event("startup")
def _startup_create_tables():
    if settings.auto_create_db:
        Base.metadata.create_all(bind=engine)
        sync_schema()
