"""Health-check routes."""

from fastapi import APIRouter

from app.models.common import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/healthz", response_model=HealthResponse)
def healthz() -> HealthResponse:
    return HealthResponse(status="ok", service="metromind-fastapi")
