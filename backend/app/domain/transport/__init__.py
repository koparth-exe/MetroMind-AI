"""Canonical transport-mode domain contracts."""

from app.domain.transport.enums import TransportMode
from app.domain.transport.fleet import (
    FleetConfig,
    capacity_for,
    fleet_for,
    get_fleet_config,
)
from app.domain.transport.registry import transport_registry
from app.domain.transport.routes import (
    BUS_ROUTES,
    RAILWAY_ROUTES,
    Route,
    StationStop,
    get_route_by_id,
    get_routes_for_mode,
)

__all__ = [
    "BUS_ROUTES",
    "RAILWAY_ROUTES",
    "FleetConfig",
    "Route",
    "StationStop",
    "TransportMode",
    "capacity_for",
    "fleet_for",
    "get_fleet_config",
    "get_route_by_id",
    "get_routes_for_mode",
    "transport_registry",
]

