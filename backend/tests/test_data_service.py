"""Tests for TransportDataService mode isolation and dataset summary calculations."""

import pytest

from app.domain.transport.enums import TransportMode
from app.services.data_service import TransportDataService


def test_service_provides_routes_and_fleet_by_mode() -> None:
    service = TransportDataService()

    rail_routes = service.get_routes("railway")
    assert len(rail_routes) == 4
    assert [r.route_id for r in rail_routes] == ["R1", "R2", "R3", "R4"]

    bus_routes = service.get_routes("bus")
    assert len(bus_routes) == 4
    assert [r.route_id for r in bus_routes] == ["B1", "B2", "B3", "B4"]

    assert service.capacity_for("railway") == 3000
    assert service.fleet_for("railway") == 4

    assert service.capacity_for("bus") == 70
    assert service.fleet_for("bus") == 4


def test_service_dataset_summary_internal_consistency() -> None:
    service = TransportDataService()

    rail_summary = service.get_dataset_summary(TransportMode.RAILWAY)
    assert rail_summary.mode is TransportMode.RAILWAY
    assert rail_summary.records == 2688
    assert rail_summary.routes == 4
    assert rail_summary.stations == 10  # distinct stations across R1-R4
    assert rail_summary.missing_values == 0
    assert rail_summary.invalid_values == 0
    assert rail_summary.date_start == "2026-07-27"
    assert rail_summary.date_end == "2026-08-23"
    assert rail_summary.average_demand > 0
    assert rail_summary.max_demand >= rail_summary.average_demand
    assert rail_summary.quality == "Excellent"

    bus_summary = service.get_dataset_summary(TransportMode.BUS)
    assert bus_summary.mode is TransportMode.BUS
    assert bus_summary.records == 2688
    assert bus_summary.routes == 4
    assert bus_summary.stations == 12  # distinct stations across B1-B4
    assert bus_summary.date_start == "2026-07-27"
    assert bus_summary.date_end == "2026-08-23"
    assert bus_summary.average_demand > 0
    assert bus_summary.max_demand >= bus_summary.average_demand
    assert bus_summary.quality == "Excellent"


def test_service_mode_isolation_guarantee() -> None:
    service = TransportDataService()

    railway_records = service.get_demo_dataset(TransportMode.RAILWAY)
    bus_records = service.get_demo_dataset(TransportMode.BUS)

    # Railway store contains only Railway records
    assert all(r.mode is TransportMode.RAILWAY for r in railway_records)
    # Bus store contains only Bus records
    assert all(r.mode is TransportMode.BUS for r in bus_records)

    # Resetting bus store does NOT affect railway store
    service.reset_demo(TransportMode.BUS)
    assert len(service.get_demo_dataset(TransportMode.RAILWAY)) == 2688
    assert all(r.mode is TransportMode.RAILWAY for r in service.get_demo_dataset(TransportMode.RAILWAY))


def test_service_rejects_unsupported_mode() -> None:
    service = TransportDataService()

    with pytest.raises(ValueError, match="Unsupported transport mode"):
        service.get_demo_dataset("train")

    with pytest.raises(ValueError, match="Unsupported transport mode"):
        service.get_dataset_summary("rail")
