"""Canonical transport route and station definitions for MetroMind AI.

Coordinates represent approximate demonstration coordinates derived from the
legacy reference implementation, intended for spatial visualization and transit
network mapping.
"""

from pydantic import BaseModel, Field

from app.domain.transport.enums import TransportMode
from app.domain.transport.registry import transport_registry


class StationStop(BaseModel):
    """A designated station or stop along a transit route."""

    name: str = Field(description="Display name of the station or bus stop.")
    latitude: float = Field(
        description="Approximate demonstration latitude (WGS-84 decimal degrees)."
    )
    longitude: float = Field(
        description="Approximate demonstration longitude (WGS-84 decimal degrees)."
    )


class Route(BaseModel):
    """Canonical representation of a transit route."""

    route_id: str = Field(
        description="Unique route identifier (e.g. 'R1' for Railway, 'B1' for Bus)."
    )
    name: str = Field(description="Human-readable corridor or line name.")
    mode: TransportMode = Field(description="Canonical transport mode.")
    color: str = Field(
        description="Hexadecimal brand/line color code for UI visualization."
    )
    stations: list[str] = Field(
        description="Ordered list of station/stop names served along the route."
    )
    coordinates: list[list[float]] = Field(
        description="Ordered list of [latitude, longitude] demo coordinates defining route trajectory."
    )


# Demonstration coordinates for Mumbai Metropolitan Region transit corridors.
# Coordinates are approximate reference values from the legacy system.
RAILWAY_ROUTES: tuple[Route, ...] = (
    Route(
        route_id="R1",
        name="Central Line",
        mode=TransportMode.RAILWAY,
        color="#ef4444",
        stations=["CSMT", "Dadar", "Kurla", "Thane"],
        coordinates=[
            [18.9400, 72.8352],
            [19.0178, 72.8438],
            [19.0664, 72.8801],
            [19.1860, 72.9759],
        ],
    ),
    Route(
        route_id="R2",
        name="Western Line",
        mode=TransportMode.RAILWAY,
        color="#3b82f6",
        stations=["Dadar", "Bandra", "Andheri", "Borivali"],
        coordinates=[
            [19.0178, 72.8438],
            [19.0544, 72.8406],
            [19.1197, 72.8468],
            [19.2307, 72.8567],
        ],
    ),
    Route(
        route_id="R3",
        name="Harbour Line",
        mode=TransportMode.RAILWAY,
        color="#facc15",
        stations=["CSMT", "Kurla", "Vashi", "Panvel"],
        coordinates=[
            [18.9400, 72.8352],
            [19.0664, 72.8801],
            [19.0745, 72.9986],
            [18.9902, 73.1172],
        ],
    ),
    Route(
        route_id="R4",
        name="Trans-Harbour Line",
        mode=TransportMode.RAILWAY,
        color="#f97316",
        stations=["Thane", "Airoli", "Vashi"],
        coordinates=[
            [19.1860, 72.9759],
            [19.1513, 72.9932],
            [19.0745, 72.9986],
        ],
    ),
)

BUS_ROUTES: tuple[Route, ...] = (
    Route(
        route_id="B1",
        name="Vashi–Dadar",
        mode=TransportMode.BUS,
        color="#a855f7",
        stations=["Vashi", "Sion", "Kurla", "Dadar"],
        coordinates=[
            [19.0745, 72.9986],
            [19.0460, 72.8620],
            [19.0664, 72.8801],
            [19.0178, 72.8438],
        ],
    ),
    Route(
        route_id="B2",
        name="Panvel–Thane",
        mode=TransportMode.BUS,
        color="#14b8a6",
        stations=["Panvel", "Kharghar", "Vashi", "Airoli", "Thane"],
        coordinates=[
            [18.9902, 73.1172],
            [19.0476, 73.0699],
            [19.0745, 72.9986],
            [19.1513, 72.9932],
            [19.1860, 72.9759],
        ],
    ),
    Route(
        route_id="B3",
        name="Kharghar–CBD Belapur",
        mode=TransportMode.BUS,
        color="#f59e0b",
        stations=["Kharghar", "Belapur CBD", "Nerul"],
        coordinates=[
            [19.0476, 73.0699],
            [19.0176, 73.0397],
            [19.0330, 73.0169],
        ],
    ),
    Route(
        route_id="B4",
        name="Airoli–Vashi",
        mode=TransportMode.BUS,
        color="#ec4899",
        stations=["Airoli", "Ghansoli", "Koparkhairane", "Vashi"],
        coordinates=[
            [19.1513, 72.9932],
            [19.1260, 72.9980],
            [19.1020, 72.9970],
            [19.0745, 72.9986],
        ],
    ),
)

_ROUTES_BY_MODE: dict[TransportMode, tuple[Route, ...]] = {
    TransportMode.RAILWAY: RAILWAY_ROUTES,
    TransportMode.BUS: BUS_ROUTES,
}

_ALL_ROUTES_BY_ID: dict[str, Route] = {
    route.route_id: route
    for routes in _ROUTES_BY_MODE.values()
    for route in routes
}


def get_routes_for_mode(mode: TransportMode | str) -> tuple[Route, ...]:
    """Retrieve canonical routes for a validated transport mode.

    Raises ValueError if the mode is unsupported or invalid.
    """
    resolved_mode = transport_registry.require_mode(mode)
    return _ROUTES_BY_MODE[resolved_mode]


def get_route_by_id(route_id: str) -> Route | None:
    """Lookup a route by its unique identifier (e.g. 'R1', 'B2')."""
    return _ALL_ROUTES_BY_ID.get(route_id.strip().upper())
