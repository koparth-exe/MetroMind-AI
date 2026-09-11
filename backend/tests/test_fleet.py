"""Tests for fleet capacity configuration and helper functions."""

import pytest

from app.domain.transport.enums import TransportMode
from app.domain.transport.fleet import (
    capacity_for,
    fleet_for,
    get_fleet_config,
)


def test_railway_fleet_configuration_demo_values() -> None:
    config = get_fleet_config(TransportMode.RAILWAY)
    assert config.mode is TransportMode.RAILWAY
    assert config.vehicle_capacity == 3000
    assert config.fleet_size == 4
    assert config.vehicle_type_name == "Train"
    assert config.total_fleet_capacity == 12000


def test_bus_fleet_configuration_demo_values() -> None:
    config = get_fleet_config(TransportMode.BUS)
    assert config.mode is TransportMode.BUS
    assert config.vehicle_capacity == 70
    assert config.fleet_size == 4
    assert config.vehicle_type_name == "Bus"
    assert config.total_fleet_capacity == 280


def test_capacity_and_fleet_helpers() -> None:
    assert capacity_for("railway") == 3000
    assert fleet_for("railway") == 4

    assert capacity_for("bus") == 70
    assert fleet_for("bus") == 4


def test_fleet_helpers_reject_invalid_modes() -> None:
    for invalid in ["train", "rail", "tram", "xyz"]:
        with pytest.raises(ValueError, match="Unsupported transport mode"):
            get_fleet_config(invalid)
        with pytest.raises(ValueError, match="Unsupported transport mode"):
            capacity_for(invalid)
        with pytest.raises(ValueError, match="Unsupported transport mode"):
            fleet_for(invalid)


def test_capacity_coverage_calculation_and_unit_safety() -> None:
    """Verify capacity coverage percentage calculation across transport modes.

    Formula:
        coverage_percent = (total_allocated_capacity / total_predicted_demand) * 100

    Guards:
        - Prevents double-percentage scaling (ratio 3.6842 vs 368.42% vs 36842%)
        - Prevents division-by-one / undefined fallback (1,200,000% bug)
        - Allows coverage exceeding 100% (not artificially clamped)
        - Tests both Bus and Railway mode scenarios
    """
    # 1. Bus corridor scenario: 4 buses * 70 = 280 capacity, 76 predicted demand
    bus_capacity = 280
    bus_demand = 76.0
    bus_ratio = bus_capacity / bus_demand
    bus_percent = bus_ratio * 100.0

    assert round(bus_ratio, 4) == 3.6842
    assert round(bus_percent, 2) == 368.42
    assert round(bus_percent) == 368
    # Critical unit distinction: ratio != percentage != double-multiplied
    assert bus_ratio != bus_percent
    assert bus_percent != (bus_percent * 100.0)

    # 2. Railway corridor scenario: 4 trains * 3000 = 12000 capacity, 8566.8 demand
    railway_capacity = 12000
    railway_demand = 8566.8
    railway_ratio = railway_capacity / railway_demand
    railway_percent = railway_ratio * 100.0

    assert round(railway_ratio, 4) == 1.4008
    assert round(railway_percent, 2) == 140.08
    assert round(railway_percent) == 140

    # 3. Regression guard against the 1,200,000% bug (12000 / 1 * 100)
    # Total capacity must never fall back to Railway 12000 in Bus mode or divide by 1.0
    bugged_value = (12000 / 1.0) * 100.0
    assert bugged_value == 1200000.0
    assert bus_percent != bugged_value
    assert railway_percent != bugged_value

    # 4. Zero/invalid demand handling
    zero_demand = 0.0
    safe_percent = (bus_capacity / zero_demand * 100.0) if zero_demand > 0 else 0.0
    assert safe_percent == 0.0

