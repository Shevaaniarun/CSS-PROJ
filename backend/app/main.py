from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncEngine

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.utils.startup import ensure_default_admin

settings = get_settings()
DEFAULT_DEV_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]


@asynccontextmanager
async def lifespan(_: FastAPI):
    configure_logging()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    if settings.app_env == "development":
        async with SessionLocal() as session:
            await ensure_default_admin(session)
    yield


def create_app(db_engine: AsyncEngine = engine) -> FastAPI:
    app = FastAPI(title=settings.app_name, debug=settings.app_debug, lifespan=lifespan)
    cors_origins = settings.cors_origins or DEFAULT_DEV_ORIGINS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    async def health() -> dict:
        return {"status": "ok"}

    app.include_router(api_router, prefix=settings.api_v1_prefix)
    return app


app = create_app()
