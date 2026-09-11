"""FastAPI application entry point.

Start with:

    uvicorn app.main:app --reload
"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.data import router as data_router
from app.api.routes.health import router as health_router
from app.api.routes.math import router as math_router
from app.api.routes.risk import router as risk_router
from app.api.routes.transport import router as transport_router
from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import configure_logging

logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.log_level)

    application = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        description="MetroMind AI FastAPI foundation with canonical transport-mode validation.",
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Accept", "Content-Type"],
    )

    register_exception_handlers(application)
    application.include_router(health_router, prefix="/api")
    application.include_router(transport_router, prefix="/api")
    application.include_router(data_router, prefix="/api")
    application.include_router(math_router, prefix="/api")
    application.include_router(risk_router, prefix="/api")

    logger.info("FastAPI application created env=%s", settings.app_env)
    return application


app = create_app()
