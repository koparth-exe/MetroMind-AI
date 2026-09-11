"""Tests for deterministic demo data generation and mode isolation."""

import pytest

from app.domain.data.demo import generate_demo_dataset
from app.domain.transport.enums import TransportMode


def test_railway_demo_dataset_generation_and_isolation() -> None:
    records = generate_demo_dataset("RAILWAY")
    # 4 routes * 28 days * 24 hours = 2688 records
    assert len(records) == 2688

    # Strictly isolated: all records must be RAILWAY
    assert all(r.mode is TransportMode.RAILWAY for r in records)

    # Route IDs must only belong to RAILWAY
    railway_route_ids = {"R1", "R2", "R3", "R4"}
    observed_routes = {r.route_id for r in records}
    assert observed_routes == railway_route_ids

    # Passenger demand bounds
    assert all(r.passenger_count >= 30 for r in records)
    assert all(r.passenger_count <= 10000 for r in records)


def test_bus_demo_dataset_generation_and_isolation() -> None:
    records = generate_demo_dataset("BUS")
    # 4 routes * 28 days * 24 hours = 2688 records
    assert len(records) == 2688

    # Strictly isolated: all records must be BUS
    assert all(r.mode is TransportMode.BUS for r in records)

    # Route IDs must only belong to BUS
    bus_route_ids = {"B1", "B2", "B3", "B4"}
    observed_routes = {r.route_id for r in records}
    assert observed_routes == bus_route_ids

    # Realism check: bus passenger count should have realistic lower bound >= 1
    # and not be clamped inappropriately to 30
    assert all(r.passenger_count >= 1 for r in records)
    min_bus_demand = min(r.passenger_count for r in records)
    assert min_bus_demand < 10, f"Expected off-peak bus demand to dip below 10, got {min_bus_demand}"


def test_railway_and_bus_datasets_do_not_cross_contaminate() -> None:
    railway_records = generate_demo_dataset(TransportMode.RAILWAY)
    bus_records = generate_demo_dataset(TransportMode.BUS)

    railway_route_ids = {r.route_id for r in railway_records}
    bus_route_ids = {r.route_id for r in bus_records}

    assert railway_route_ids.isdisjoint(bus_route_ids)

    # No bus mode in railway dataset
    assert not any(r.mode is TransportMode.BUS for r in railway_records)
    # No railway mode in bus dataset
    assert not any(r.mode is TransportMode.RAILWAY for r in bus_records)


def test_demo_dataset_determinism() -> None:
    run_1 = generate_demo_dataset("railway")
    run_2 = generate_demo_dataset("railway")

    assert len(run_1) == len(run_2)
    for r1, r2 in zip(run_1, run_2):
        assert r1.timestamp == r2.timestamp
        assert r1.route_id == r2.route_id
        assert r1.passenger_count == r2.passenger_count
        assert r1.mode == r2.mode


def test_invalid_mode_rejected_by_demo_generator() -> None:
    with pytest.raises(ValueError, match="Unsupported transport mode"):
        generate_demo_dataset("train")
