"""Centralized FastAPI exception handlers."""

import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.models.common import ErrorResponse

logger = logging.getLogger(__name__)


class AppError(Exception):
    """Application-level error with an HTTP status code."""

    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _error_body(error: str, detail: str | None = None) -> dict[str, str | None]:
    return ErrorResponse(error=error, detail=detail).model_dump()


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def handle_app_error(_request: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=_error_body(exc.message),
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(
        _request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content=_error_body("Validation error", str(exc.errors())),
        )

    @app.exception_handler(HTTPException)
    async def handle_http_exception(
        _request: Request,
        exc: HTTPException,
    ) -> JSONResponse:
        detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
        return JSONResponse(
            status_code=exc.status_code,
            content=_error_body(detail),
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(
        _request: Request,
        exc: Exception,
    ) -> JSONResponse:
        logger.exception("Unhandled application error: %s", type(exc).__name__)
        settings = get_settings()
        detail = None if settings.is_production else type(exc).__name__
        return JSONResponse(
            status_code=500,
            content=_error_body("Internal server error", detail),
        )
