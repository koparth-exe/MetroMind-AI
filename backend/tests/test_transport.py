"""Tests for the Phase 2 canonical transport-mode boundary."""

import pytest
from fastapi.testclient import TestClient

from app.domain.transport.enums import TransportMode
from app.domain.transport.registry import transport_registry
from app.main import app


def test_railway_and_bus_are_recognized() -> None:
    assert transport_registry.require_mode("RAILWAY") is TransportMode.RAILWAY
    assert transport_registry.require_mode("BUS") is TransportMode.BUS


@pytest.mark.parametrize(
    ("raw_mode", "expected"),
    [("railway", TransportMode.RAILWAY), (" Railway ", TransportMode.RAILWAY), ("bus", TransportMode.BUS)],
)
def test_transport_mode_normalization(raw_mode: str, expected: TransportMode) -> None:
    assert transport_registry.require_mode(raw_mode) is expected


@pytest.mark.parametrize("invalid_mode", ["train", "rail", "tram", "", "RAILWAY_BUS"])
def test_invalid_modes_are_rejected(invalid_mode: str) -> None:
    with pytest.raises(ValueError, match="Unsupported transport mode"):
        transport_registry.require_mode(invalid_mode)


def test_supported_modes_endpoint_returns_canonical_values() -> None:
    response = TestClient(app).get("/api/transport/modes")

    assert response.status_code == 200
    assert response.json() == {"modes": ["RAILWAY", "BUS"]}


def test_mode_validation_endpoint_normalizes_and_rejects_invalid_values() -> None:
    client = TestClient(app)

    assert client.get("/api/transport/modes/bus").json() == {
        "mode": "BUS",
        "supported": True,
    }
    response = client.get("/api/transport/modes/train")
    assert response.status_code == 422
    assert "Unsupported transport mode" in response.json()["error"]
