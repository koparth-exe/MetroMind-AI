"""Shared Pydantic schemas for the FastAPI foundation."""

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Deterministic health-check payload."""

    status: str = Field(description="Service availability indicator.")
    service: str = Field(description="Backend identifier.")


class ErrorResponse(BaseModel):
    """Consistent JSON error envelope."""

    error: str
    detail: str | None = None
