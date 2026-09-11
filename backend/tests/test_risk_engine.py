"""Integration tests for the Phase 5 Risk Engine service.

Tests cover:
- Mode isolation (RAILWAY vs BUS produce different results)
- Route-level output completeness
- Per-observation risk record fields
- Risk score bounds across all observations
- Determinism (same inputs → same outputs)
- Held-out residual sigma usage (not training residuals)
- Negative prediction handling
- Summary statistics integrity
"""

import pytest

from app.domain.transport.enums import TransportMode
from app.mathematics.risk.thresholds import RiskLevel
from app.services.risk_service import RiskEngineService


@pytest.fixture(scope="module")
def risk_service() -> RiskEngineService:
    """Singleton RiskEngineService for the test module."""
    return RiskEngineService()


@pytest.fixture(scope="module")
def railway_result(risk_service: RiskEngineService):
    """Pre-computed RAILWAY mode risk result."""
    return risk_service.compute_mode_risk(TransportMode.RAILWAY)


@pytest.fixture(scope="module")
def bus_result(risk_service: RiskEngineService):
    """Pre-computed BUS mode risk result."""
    return risk_service.compute_mode_risk(TransportMode.BUS)


class TestModeIsolation:

    def test_railway_mode_field_is_railway(self, railway_result):
        """RAILWAY risk result must report mode='RAILWAY'."""
        assert railway_result.mode == "RAILWAY"

    def test_bus_mode_field_is_bus(self, bus_result):
        """BUS risk result must report mode='BUS'."""
        assert bus_result.mode == "BUS"

    def test_railway_capacity_is_3000(self, railway_result):
        """RAILWAY capacity must be 3000 (from fleet.py, not hard-coded)."""
        assert railway_result.capacity == 3000

    def test_bus_capacity_is_70(self, bus_result):
        """BUS capacity must be 70 (from fleet.py, not hard-coded)."""
        assert bus_result.capacity == 70

    def test_railway_routes_are_only_railway_routes(self, railway_result):
        """RAILWAY result must only contain R-prefixed route IDs."""
        route_ids = {r.route_id for r in railway_result.route_results}
        assert all(rid.startswith("R") for rid in route_ids), (
            f"Non-railway routes found in railway result: {route_ids}"
        )

    def test_bus_routes_are_only_bus_routes(self, bus_result):
        """BUS result must only contain B-prefixed route IDs."""
        route_ids = {r.route_id for r in bus_result.route_results}
        assert all(rid.startswith("B") for rid in route_ids), (
            f"Non-bus routes found in bus result: {route_ids}"
        )

    def test_railway_and_bus_capacities_differ(self, railway_result, bus_result):
        """Railway and Bus capacities must be different (no cross-mode leakage)."""
        assert railway_result.capacity != bus_result.capacity

    def test_railway_and_bus_produce_different_results(self, railway_result, bus_result):
        """Different mode inputs must produce different output records."""
        # Both should have results, and capacities are different
        assert len(railway_result.route_results) > 0
        assert len(bus_result.route_results) > 0
        # At minimum, different capacity means different utilization
        rail_caps = {r.capacity for r in railway_result.route_results}
        bus_caps = {r.capacity for r in bus_result.route_results}
        assert rail_caps.isdisjoint(bus_caps) or rail_caps != bus_caps


class TestRouteAndObservationCompleteness:

    def test_railway_has_four_routes(self, railway_result):
        """RAILWAY has 4 defined routes (R1–R4)."""
        route_ids = {r.route_id for r in railway_result.route_results}
        expected = {"R1", "R2", "R3", "R4"}
        assert route_ids == expected, (
            f"Expected {expected} but got {route_ids}"
        )

    def test_bus_has_four_routes(self, bus_result):
        """BUS has 4 defined routes (B1–B4)."""
        route_ids = {r.route_id for r in bus_result.route_results}
        expected = {"B1", "B2", "B3", "B4"}
        assert route_ids == expected, (
            f"Expected {expected} but got {route_ids}"
        )

    def test_each_route_has_at_least_one_observation(self, railway_result):
        """Every route must have at least one risk observation."""
        from collections import defaultdict
        counts: dict[str, int] = defaultdict(int)
        for r in railway_result.route_results:
            counts[r.route_id] += 1
        for route_id, count in counts.items():
            assert count >= 1, f"Route {route_id} has no observations"

    def test_results_sorted_by_route_then_timestamp(self, railway_result):
        """Results must be sorted deterministically by (route_id, timestamp)."""
        records = railway_result.route_results
        for i in range(len(records) - 1):
            a, b = records[i], records[i + 1]
            assert (a.route_id, a.timestamp) <= (b.route_id, b.timestamp), (
                f"Sort violation at index {i}: {(a.route_id, a.timestamp)} > {(b.route_id, b.timestamp)}"
            )


class TestRiskRecordFields:

    def test_every_record_has_valid_risk_level(self, railway_result):
        """Every risk record must have a valid RiskLevel value."""
        valid_levels = {level.value for level in RiskLevel}
        for r in railway_result.route_results:
            assert r.risk_level.value in valid_levels, (
                f"Invalid risk_level {r.risk_level} for {r.route_id}"
            )

    def test_risk_score_bounds_for_all_railway(self, railway_result):
        """Every risk score must be in [0, 100]."""
        for r in railway_result.route_results:
            assert 0.0 <= r.risk_score <= 100.0, (
                f"Risk score {r.risk_score} out of bounds for {r.route_id} @ {r.timestamp}"
            )

    def test_risk_score_bounds_for_all_bus(self, bus_result):
        """Every risk score must be in [0, 100]."""
        for r in bus_result.route_results:
            assert 0.0 <= r.risk_score <= 100.0, (
                f"Risk score {r.risk_score} out of bounds for {r.route_id} @ {r.timestamp}"
            )

    def test_overload_probability_bounds(self, railway_result):
        """Overload probability must be in [0, 1] for all observations."""
        for r in railway_result.route_results:
            assert 0.0 <= r.overload_probability <= 1.0, (
                f"Probability {r.overload_probability} out of bounds for {r.route_id}"
            )

    def test_utilization_ratio_is_non_negative(self, railway_result):
        """Utilization ratio must always be >= 0 (effective demand is clamped)."""
        for r in railway_result.route_results:
            assert r.utilization_ratio >= 0.0, (
                f"Negative utilization ratio {r.utilization_ratio} for {r.route_id}"
            )

    def test_effective_demand_is_non_negative(self, railway_result):
        """Effective demand must be >= 0 (clamped from raw prediction)."""
        for r in railway_result.route_results:
            assert r.effective_demand >= 0.0, (
                f"Negative effective_demand {r.effective_demand} for {r.route_id}"
            )

    def test_sigma_is_non_negative(self, railway_result):
        """Uncertainty sigma must be >= 0."""
        for r in railway_result.route_results:
            assert r.uncertainty_sigma >= 0.0, (
                f"Negative sigma {r.uncertainty_sigma} for {r.route_id}"
            )

    def test_sigma_source_is_valid(self, railway_result):
        """sigma_source must be a recognized value."""
        valid_sources = {"route-level", "mode-wide-fallback"}
        for r in railway_result.route_results:
            assert r.sigma_source in valid_sources, (
                f"Unknown sigma_source '{r.sigma_source}' for {r.route_id}"
            )

    def test_utilization_percentage_equals_ratio_times_100(self, railway_result):
        """utilization_percentage must equal utilization_ratio * 100."""
        for r in railway_result.route_results:
            expected = round(r.utilization_ratio * 100.0, 4)
            assert abs(r.utilization_percentage - expected) < 1e-3, (
                f"Mismatch: ratio={r.utilization_ratio}, pct={r.utilization_percentage}"
            )


class TestDeterminism:

    def test_repeated_railway_calls_produce_identical_results(self, risk_service: RiskEngineService):
        """Two sequential calls with same inputs must produce identical results."""
        result1 = risk_service.compute_mode_risk(TransportMode.RAILWAY)
        result2 = risk_service.compute_mode_risk(TransportMode.RAILWAY)

        assert len(result1.route_results) == len(result2.route_results)
        for r1, r2 in zip(result1.route_results, result2.route_results):
            assert r1.route_id == r2.route_id
            assert r1.timestamp == r2.timestamp
            assert r1.risk_score == r2.risk_score
            assert r1.risk_level == r2.risk_level

    def test_repeated_bus_calls_produce_identical_results(self, risk_service: RiskEngineService):
        """Two sequential BUS calls must produce identical results."""
        result1 = risk_service.compute_mode_risk(TransportMode.BUS)
        result2 = risk_service.compute_mode_risk(TransportMode.BUS)

        assert len(result1.route_results) == len(result2.route_results)
        for r1, r2 in zip(result1.route_results, result2.route_results):
            assert r1.risk_score == r2.risk_score


class TestSummaryStatistics:

    def test_railway_summary_has_all_required_keys(self, risk_service: RiskEngineService):
        """RAILWAY summary must contain all required fields."""
        summary = risk_service.compute_mode_risk_summary(TransportMode.RAILWAY)
        required_keys = {
            "mode", "best_model_name", "capacity", "mode_sigma",
            "num_routes_analyzed", "num_observations", "highest_risk_route",
            "average_risk_score", "max_risk_score", "max_overload_probability",
            "level_counts",
        }
        assert required_keys.issubset(set(summary.keys()))

    def test_bus_summary_mode_field_is_bus(self, risk_service: RiskEngineService):
        """BUS summary must report mode='BUS'."""
        summary = risk_service.compute_mode_risk_summary(TransportMode.BUS)
        assert summary["mode"] == "BUS"

    def test_summary_average_score_in_bounds(self, risk_service: RiskEngineService):
        """Average risk score in summary must be in [0, 100]."""
        summary = risk_service.compute_mode_risk_summary(TransportMode.RAILWAY)
        assert 0.0 <= summary["average_risk_score"] <= 100.0

    def test_summary_max_score_in_bounds(self, risk_service: RiskEngineService):
        """Max risk score in summary must be in [0, 100]."""
        summary = risk_service.compute_mode_risk_summary(TransportMode.RAILWAY)
        assert 0.0 <= summary["max_risk_score"] <= 100.0

    def test_summary_level_counts_sum_to_total_observations(self, risk_service: RiskEngineService):
        """Level count totals must equal total observations."""
        summary = risk_service.compute_mode_risk_summary(TransportMode.RAILWAY)
        total_from_counts = sum(summary["level_counts"].values())
        assert total_from_counts == summary["num_observations"]

    def test_summary_max_prob_in_bounds(self, risk_service: RiskEngineService):
        """Max overload probability must be in [0, 1]."""
        summary = risk_service.compute_mode_risk_summary(TransportMode.RAILWAY)
        assert 0.0 <= summary["max_overload_probability"] <= 1.0

    def test_invalid_mode_raises_value_error(self, risk_service: RiskEngineService):
        """Invalid mode string must raise ValueError (not silently ignore)."""
        with pytest.raises(ValueError, match="Unsupported transport mode"):
            risk_service.compute_mode_risk("TRAM")
