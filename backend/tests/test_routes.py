"""Tests for canonical transport routes and station definitions."""

import pytest

from app.domain.transport.enums import TransportMode
from app.domain.transport.routes import (
    BUS_ROUTES,
    RAILWAY_ROUTES,
    get_route_by_id,
    get_routes_for_mode,
)


def test_railway_routes_exist_with_expected_ids() -> None:
    railway_ids = [r.route_id for r in RAILWAY_ROUTES]
    assert railway_ids == ["R1", "R2", "R3", "R4"]
    for route in RAILWAY_ROUTES:
        assert route.mode is TransportMode.RAILWAY
        assert route.stations, f"Route {route.route_id} must have stations defined"
        assert len(route.coordinates) == len(route.stations)


def test_bus_routes_exist_with_expected_ids() -> None:
    bus_ids = [r.route_id for r in BUS_ROUTES]
    assert bus_ids == ["B1", "B2", "B3", "B4"]
    for route in BUS_ROUTES:
        assert route.mode is TransportMode.BUS
        assert route.stations, f"Route {route.route_id} must have stations defined"
        assert len(route.coordinates) == len(route.stations)


def test_railway_and_bus_route_ids_do_not_collide() -> None:
    railway_ids = {r.route_id for r in RAILWAY_ROUTES}
    bus_ids = {r.route_id for r in BUS_ROUTES}
    collision = railway_ids.intersection(bus_ids)
    assert not collision, f"Route IDs collided between modes: {collision}"


def test_get_routes_for_mode_isolation_and_normalization() -> None:
    railway_routes = get_routes_for_mode("railway")
    assert all(r.mode is TransportMode.RAILWAY for r in railway_routes)
    assert [r.route_id for r in railway_routes] == ["R1", "R2", "R3", "R4"]

    bus_routes = get_routes_for_mode("BUS")
    assert all(r.mode is TransportMode.BUS for r in bus_routes)
    assert [r.route_id for r in bus_routes] == ["B1", "B2", "B3", "B4"]


def test_get_routes_rejects_invalid_modes() -> None:
    for invalid in ["train", "rail", "metro", "auto", ""]:
        with pytest.raises(ValueError, match="Unsupported transport mode"):
            get_routes_for_mode(invalid)


def test_get_route_by_id_lookup() -> None:
    r1 = get_route_by_id("R1")
    assert r1 is not None
    assert r1.name == "Central Line"
    assert r1.mode is TransportMode.RAILWAY

    b2 = get_route_by_id("b2")
    assert b2 is not None
    assert b2.name == "Panvel–Thane"
    assert b2.mode is TransportMode.BUS

    assert get_route_by_id("unknown_route") is None
