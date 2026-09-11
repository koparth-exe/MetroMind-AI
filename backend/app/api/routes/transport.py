"""Transport-mode discovery and validation routes."""

from fastapi import APIRouter, HTTPException, status

from app.domain.transport.models import (
    SupportedTransportModesResponse,
    TransportModeValidationResponse,
)
from app.domain.transport.registry import transport_registry

router = APIRouter(prefix="/transport", tags=["transport"])


@router.get("/modes", response_model=SupportedTransportModesResponse)
def get_supported_transport_modes() -> SupportedTransportModesResponse:
    """Return the canonical modes the FastAPI transport boundary recognizes."""

    return SupportedTransportModesResponse(modes=list(transport_registry.supported_modes()))


@router.get("/modes/{mode}", response_model=TransportModeValidationResponse)
def validate_transport_mode(mode: str) -> TransportModeValidationResponse:
    """Normalize a canonical mode name and reject unknown values."""

    try:
        resolved_mode = transport_registry.require_mode(mode)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc
    return TransportModeValidationResponse(mode=resolved_mode)
