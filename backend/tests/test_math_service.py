"""Integration tests for mode-aware MathEngineService."""

import pytest

from app.domain.transport.enums import TransportMode
from app.services.math_service import MathEngineService, MIN_PREDICTED_DEMAND_FLOOR
from app.models.math import OptimizationInput, PredictionInput, PredictionRoute, SimulationInput


@pytest.fixture
def math_service() -> MathEngineService:
    return MathEngineService()


def test_railway_and_bus_evaluations_are_strictly_isolated(
    math_service: MathEngineService,
) -> None:
    rail_res = math_service.evaluate_demand_models(TransportMode.RAILWAY)
    bus_res = math_service.evaluate_demand_models(TransportMode.BUS)

    # Railway demand levels are orders of magnitude higher (trains vs buses)
    assert rail_res.training_count > 0
    assert bus_res.training_count > 0

    # Route features must not be cross-contaminated
    assert any("R1" in f for f in rail_res.feature_names)
    assert not any("B1" in f for f in rail_res.feature_names)

    assert any("B1" in f for f in bus_res.feature_names)
    assert not any("R1" in f for f in bus_res.feature_names)

    # Predictions check
    rail_lr = rail_res.evaluations["Linear Regression"]
    bus_lr = bus_res.evaluations["Linear Regression"]
    assert rail_lr.mae > 100.0  # Railway demand scale
    assert bus_lr.mae < 100.0   # Bus demand scale


def test_route_filtering_and_invalid_route_rejection(
    math_service: MathEngineService,
) -> None:
    # Filter RAILWAY to route R1
    r1_res = math_service.evaluate_demand_models(TransportMode.RAILWAY, route_id="R1")
    assert r1_res.training_count > 0
    assert not any("route_R1" in f for f in r1_res.feature_names)  # Route dummies omitted for single route

    # Attempting to query Bus route B1 on Railway mode must fail with validation error
    with pytest.raises(ValueError, match="does not exist for mode 'RAILWAY'"):
        math_service.evaluate_demand_models(TransportMode.RAILWAY, route_id="B1")

    # Non-existent route
    with pytest.raises(ValueError, match="does not exist"):
        math_service.evaluate_demand_models(TransportMode.BUS, route_id="UNKNOWN")


def test_residual_analysis_service_call(math_service: MathEngineService) -> None:
    res = math_service.get_residual_analysis(TransportMode.RAILWAY, model_name="Linear Regression")
    assert res["mode"] == "RAILWAY"
    assert res["model_name"] == "Linear Regression"
    assert "mean_residual" in res["residual_analysis"]
    assert "mae" in res["residual_analysis"]


def test_correlations_and_seasonality_service_call(math_service: MathEngineService) -> None:
    corrs = math_service.get_feature_correlations(TransportMode.BUS)
    assert corrs["mode"] == "BUS"
    assert "hour" in corrs["feature_correlations"]

    season = math_service.get_seasonality_analysis(TransportMode.RAILWAY, top_k=3)
    assert len(season.dominant_harmonics) == 3
    assert season.dominant_harmonics[0].period_hours > 0.0


def test_simulation_uses_mode_aware_residual_sigma(math_service: MathEngineService) -> None:
    """Verify that Simulator uses authoritative mode-specific residual sigma rather than fixed 150.0."""
    nominal_input = SimulationInput(rainfall=0.0, temperature=20.0, demand_multiplier=1.0)

    rail_sim = math_service.run_simulation(TransportMode.RAILWAY, nominal_input)
    bus_sim = math_service.run_simulation(TransportMode.BUS, nominal_input)

    # Get authoritative held-out model sigmas
    rail_comp = math_service.evaluate_demand_models(TransportMode.RAILWAY)
    rail_sigma = rail_comp.evaluations[rail_comp.best_model_name].residuals.std_residual

    bus_comp = math_service.evaluate_demand_models(TransportMode.BUS)
    bus_sigma = bus_comp.evaluations[bus_comp.best_model_name].residuals.std_residual

    assert rail_sigma > 50.0  # Railway residual scale ~95.4
    assert bus_sigma < 5.0   # Bus residual scale ~0.98

    # For Bus route B1 (demand ~25.2, capacity 70):
    # If sigma were 150.0, probability would be norm.sf((70 - 25.2) / 150) = norm.sf(0.2987) ~ 0.383
    # With authoritative sigma (~0.98), z = (70 - 25.2) / 0.98 ~ 45.7 -> norm.sf(z) ~ 0.0
    b1_route = next(r for r in bus_sim.routes if r.route_id == "B1")
    assert b1_route.overcrowding_probability == pytest.approx(0.0, abs=1e-2)
    assert b1_route.overcrowding_probability != pytest.approx(0.383, abs=0.05)


def _make_dummy_predictions(route_ids: list[str]) -> list[PredictionRoute]:
    return [
        PredictionRoute(
            route_id=r_id,
            predicted_demand=2000.0,
            historical_average=1900.0,
            difference=100.0,
            percent_difference=5.26,
            lower_bound=1800.0,
            upper_bound=2200.0,
        )
        for r_id in route_ids
    ]


def test_solve_optimization_infeasible_fleet_raises_value_error(
    math_service: MathEngineService,
) -> None:
    """Verify that available fleet smaller than minimum required fleet is rejected as infeasible."""
    preds = _make_dummy_predictions(["R1", "R2", "R3", "R4"])
    inp = OptimizationInput(
        predictions=preds,
        available_buses=2,
        bus_capacity=3000,
        min_buses_per_route=1,
        max_buses_per_route=4,
    )

    with pytest.raises(ValueError, match=r"Optimization infeasible.*available fleet \(2\).*smaller than minimum fleet required \(4\)"):
        math_service.solve_optimization(TransportMode.RAILWAY, inp)


def test_solve_optimization_zero_fleet_infeasible(
    math_service: MathEngineService,
) -> None:
    """Verify that zero available fleet with positive min per route is rejected as infeasible."""
    preds = _make_dummy_predictions(["R1", "R2", "R3", "R4"])
    inp = OptimizationInput(
        predictions=preds,
        available_buses=0,
        bus_capacity=3000,
        min_buses_per_route=1,
        max_buses_per_route=4,
    )

    with pytest.raises(ValueError, match=r"Optimization infeasible.*available fleet \(0\).*smaller than minimum fleet required \(4\)"):
        math_service.solve_optimization(TransportMode.RAILWAY, inp)


def test_solve_optimization_exactly_feasible_minimum(
    math_service: MathEngineService,
) -> None:
    """Verify that available fleet exactly matching required minimum succeeds with exact coverage."""
    preds = _make_dummy_predictions(["R1", "R2", "R3", "R4"])
    inp = OptimizationInput(
        predictions=preds,
        available_buses=4,
        bus_capacity=3000,
        min_buses_per_route=1,
        max_buses_per_route=4,
    )

    res = math_service.solve_optimization(TransportMode.RAILWAY, inp)
    assert res.total_buses == 4
    assert len(res.routes) == 4
    for r in res.routes:
        assert r.buses == 1
    assert sum(r.buses for r in res.routes) <= inp.available_buses


def test_solve_optimization_allocation_invariant_and_bounds(
    math_service: MathEngineService,
) -> None:
    """Verify sum(allocation) <= available_fleet holds across multiple fleet levels, and invalid bounds fail."""
    preds = _make_dummy_predictions(["R1", "R2", "R3", "R4"])

    # Inverted bounds check (min > max)
    with pytest.raises(ValueError, match=r"cannot exceed maximum allocation"):
        math_service.solve_optimization(
            TransportMode.RAILWAY,
            OptimizationInput(
                predictions=preds,
                available_buses=6,
                bus_capacity=3000,
                min_buses_per_route=3,
                max_buses_per_route=2,
            ),
        )

    # Negative available fleet check
    with pytest.raises(ValueError, match=r"available fleet cannot be negative"):
        math_service.solve_optimization(
            TransportMode.RAILWAY,
            OptimizationInput(
                predictions=preds,
                available_buses=-1,
                bus_capacity=3000,
                min_buses_per_route=1,
                max_buses_per_route=4,
            ),
        )

    # Invariant verification across fleet scale
    for fleet in [4, 5, 6, 8, 12]:
        inp = OptimizationInput(
            predictions=preds,
            available_buses=fleet,
            bus_capacity=3000,
            min_buses_per_route=1,
            max_buses_per_route=4,
        )
        res = math_service.solve_optimization(TransportMode.RAILWAY, inp)
        total_allocated = sum(r.buses for r in res.routes)
        assert total_allocated <= fleet
        assert res.total_buses == total_allocated


def test_predict_scenario_operational_demand_floor(
    math_service: MathEngineService,
) -> None:
    """Verify that predictions with raw model output below 10.0 pax/h are bounded by MIN_PREDICTED_DEMAND_FLOOR."""
    low_input = PredictionInput(
        date="2026-09-06",
        hour=3,
        rainfall=20.0,
        temperature=15.0,
        demand_multiplier=0.05,
        is_holiday=True,
    )
    bus_res = math_service.predict_scenario(TransportMode.BUS, low_input)
    assert len(bus_res.routes) == 4
    for r in bus_res.routes:
        # Floor must be exactly enforced
        assert r.predicted_demand == MIN_PREDICTED_DEMAND_FLOOR
        assert r.predicted_demand >= 10.0
        # Prediction intervals must be constructed around the floored prediction
        assert r.lower_bound <= r.predicted_demand
        assert r.upper_bound >= r.predicted_demand
        assert r.lower_bound >= 0.0


def test_predict_scenario_preserves_unfloored_normal_demand(
    math_service: MathEngineService,
) -> None:
    """Verify that nominal predictions above 10.0 pax/h are preserved without floor clamping."""
    nominal_input = PredictionInput(
        date="2026-09-06",
        hour=18,
        rainfall=0.0,
        temperature=25.0,
        demand_multiplier=1.0,
    )
    bus_res = math_service.predict_scenario(TransportMode.BUS, nominal_input)
    # Check that nominal Bus routes preserve authoritative unfloored forecasts
    b1 = next(r for r in bus_res.routes if r.route_id == "B1")
    assert b1.predicted_demand == 32.3
    assert b1.predicted_demand > MIN_PREDICTED_DEMAND_FLOOR

    b3 = next(r for r in bus_res.routes if r.route_id == "B3")
    assert b3.predicted_demand == 23.1
    assert b3.predicted_demand > MIN_PREDICTED_DEMAND_FLOOR

    # Railway predictions (~2000 pax/h) must be completely untouched by floor
    rail_res = math_service.predict_scenario(TransportMode.RAILWAY, nominal_input)
    r1 = next(r for r in rail_res.routes if r.route_id == "R1")
    assert r1.predicted_demand > 2000.0


def test_predict_scenario_determinism_and_mode_isolation(
    math_service: MathEngineService,
) -> None:
    """Verify that predictions remain deterministic and strictly isolated across transport modes."""
    nominal_input = PredictionInput(
        date="2026-09-06",
        hour=18,
        rainfall=0.0,
        temperature=25.0,
        demand_multiplier=1.0,
    )
    rail1 = math_service.predict_scenario(TransportMode.RAILWAY, nominal_input)
    bus1 = math_service.predict_scenario(TransportMode.BUS, nominal_input)
    rail2 = math_service.predict_scenario(TransportMode.RAILWAY, nominal_input)
    bus2 = math_service.predict_scenario(TransportMode.BUS, nominal_input)

    assert [r.predicted_demand for r in rail1.routes] == [r.predicted_demand for r in rail2.routes]
    assert [r.predicted_demand for r in bus1.routes] == [r.predicted_demand for r in bus2.routes]
    assert rail1.model == rail2.model
    assert bus1.model == bus2.model



