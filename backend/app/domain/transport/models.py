"""Pydantic API contracts for transport-mode discovery and validation."""

from pydantic import BaseModel, Field

from app.domain.transport.enums import TransportMode


class SupportedTransportModesResponse(BaseModel):
    """Modes currently accepted by the FastAPI transport boundary."""

    modes: list[TransportMode] = Field(
        description="Canonical transport-mode values accepted by this backend."
    )


class TransportModeValidationResponse(BaseModel):
    """Result of validating a mode at an API boundary."""

    mode: TransportMode = Field(description="Canonical, normalized transport mode.")
    supported: bool = Field(
        default=True,
        description="Whether the backend recognizes this mode."
    )
