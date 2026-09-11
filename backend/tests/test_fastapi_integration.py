"""Integration tests for canonical FastAPI mode-aware endpoints."""

import pytest
from fastapi import status
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_dashboard_railway_and_bus_isolation(client: TestClient) -> None:
    """Test that dashboard returns mode-isolated routes and values."""
    res_rail = client.get("/api/data/dashboard/RAILWAY")
    assert res_rail.status_code == status.HTTP_200_OK
    d_rail = res_rail.json()
    assert d_rail["mode"] == "RAILWAY"
    assert len(d_rail["routes"]) == 4
    rail_ids = {r["routeId"] for r in d_rail["routes"]}
    assert rail_ids == {"R1", "R2", "R3", "R4"}
    assert d_rail["availableBuses"] == 4

    res_bus = client.get("/api/data/dashboard/BUS")
    assert res_bus.status_code == status.HTTP_200_OK
    d_bus = res_bus.json()
    assert d_bus["mode"] == "BUS"
    assert len(d_bus["routes"]) == 4
    bus_ids = {r["routeId"] for r in d_bus["routes"]}
    assert bus_ids == {"B1", "B2", "B3", "B4"}
    assert d_bus["availableBuses"] == 4

    assert rail_ids.isdisjoint(bus_ids)
    assert d_rail["totalPredictedDemand"] > d_bus["totalPredictedDemand"]


def test_route_insights_endpoint(client: TestClient) -> None:
    """Test corridor insights with stations and coordinates."""
    res = client.get("/api/data/route-insights/RAILWAY")
    assert res.status_code == status.HTTP_200_OK
    routes = res.json()
    assert len(routes) == 4
    assert routes[0]["routeId"] == "R1"
    assert len(routes[0]["stations"]) >= 3
    assert len(routes[0]["coordinates"]) >= 3


def test_analysis_endpoint(client: TestClient) -> None:
    """Test mathematical analysis endpoint."""
    res = client.get("/api/math/analysis/RAILWAY")
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert "correlations" in data
    assert "regression" in data
    assert "fourier" in data
    assert len(data["correlations"]) >= 4
    assert "equation" in data["regression"]


def test_models_summary_endpoint(client: TestClient) -> None:
    """Test model comparison holdout summary endpoint."""
    res = client.get("/api/math/models-summary/RAILWAY")
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert "metrics" in data
    assert "selectedModel" in data
    assert len(data["metrics"]) >= 3
    best_models = [m for m in data["metrics"] if m["isBest"]]
    assert len(best_models) == 1
    assert best_models[0]["model"] == data["selectedModel"]


def test_predict_endpoint(client: TestClient) -> None:
    """Test scenario prediction endpoint."""
    payload = {
        "date": "2026-09-06",
        "hour": 18,
        "rainfall": 2.5,
        "temperature": 26.0,
        "demandMultiplier": 1.0,
        "isHoliday": False,
        "specialEvent": False,
    }
    res = client.post("/api/math/predict/RAILWAY", json=payload)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert len(data["routes"]) == 4
    assert data["routes"][0]["predictedDemand"] > 0
    assert data["routes"][0]["lowerBound"] <= data["routes"][0]["predictedDemand"]
    assert data["routes"][0]["upperBound"] >= data["routes"][0]["predictedDemand"]


def test_predict_endpoint_operational_demand_floor(client: TestClient) -> None:
    """Verify that the API enforces the operational floor of 10.0 pax/h when demand is suppressed."""
    low_payload = {
        "date": "2026-09-06",
        "hour": 3,
        "rainfall": 20.0,
        "temperature": 15.0,
        "demandMultiplier": 0.05,
        "isHoliday": True,
        "specialEvent": False,
    }
    res = client.post("/api/math/predict/BUS", json=low_payload)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert len(data["routes"]) == 4
    for r in data["routes"]:
        assert r["predictedDemand"] == 10.0
        assert r["lowerBound"] <= 10.0
        assert r["upperBound"] >= 10.0
        assert r["lowerBound"] >= 0.0

    # Verify nominal Bus predictions are unfloored (> 10.0)
    nominal_payload = {
        "date": "2026-09-06",
        "hour": 18,
        "rainfall": 0.0,
        "temperature": 25.0,
        "demandMultiplier": 1.0,
    }
    nominal_res = client.post("/api/math/predict/BUS", json=nominal_payload)
    assert nominal_res.status_code == status.HTTP_200_OK
    nom_data = nominal_res.json()
    assert all(r["predictedDemand"] > 10.0 for r in nom_data["routes"])
    b1 = next(r for r in nom_data["routes"] if r["routeId"] == "B1")
    assert b1["predictedDemand"] == 32.3



def test_dynamic_risk_calculation(client: TestClient) -> None:
    """Test dynamic operator risk calculator endpoint."""
    predict_res = client.post(
        "/api/math/predict/RAILWAY",
        json={"date": "2026-09-06", "hour": 18, "rainfall": 0, "temperature": 25, "demandMultiplier": 1},
    )
    predictions = predict_res.json()["routes"]
    payload = {
        "predictions": predictions,
        "availableBuses": 4,
        "busCapacity": 3000,
    }
    res = client.post("/api/risk/RAILWAY/calculate", json=payload)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert len(data["routes"]) == 4
    assert 0.0 <= data["routes"][0]["probability"] <= 1.0


def test_optimization_endpoint(client: TestClient) -> None:
    """Test integer fleet allocation optimization endpoint."""
    predict_res = client.post(
        "/api/math/predict/RAILWAY",
        json={"date": "2026-09-06", "hour": 18, "rainfall": 0, "temperature": 25, "demandMultiplier": 1},
    )
    predictions = predict_res.json()["routes"]
    payload = {
        "predictions": predictions,
        "availableBuses": 6,
        "busCapacity": 3000,
        "minBusesPerRoute": 1,
        "maxBusesPerRoute": 4,
    }
    res = client.post("/api/math/optimize/RAILWAY", json=payload)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["totalBuses"] == 6
    assert len(data["routes"]) == 4
    assert data["totalCapacity"] == 6 * 3000
    assert data["totalDemand"] > 0
    coverage_percent = (data["totalCapacity"] / data["totalDemand"]) * 100.0
    assert coverage_percent != 1200000.0

    # Verify Bus optimization contract and capacity coverage
    bus_predict_res = client.post(
        "/api/math/predict/BUS",
        json={"date": "2026-09-06", "hour": 18, "rainfall": 0, "temperature": 25, "demandMultiplier": 1},
    )
    assert bus_predict_res.status_code == status.HTTP_200_OK
    bus_predictions = bus_predict_res.json()["routes"]
    bus_payload = {
        "predictions": bus_predictions,
        "availableBuses": 4,
        "busCapacity": 70,
        "minBusesPerRoute": 1,
        "maxBusesPerRoute": 4,
    }
    bus_res = client.post("/api/math/optimize/BUS", json=bus_payload)
    assert bus_res.status_code == status.HTTP_200_OK
    bus_data = bus_res.json()
    assert bus_data["totalBuses"] == 4
    assert bus_data["totalCapacity"] == 4 * 70  # 280
    assert bus_data["totalDemand"] > 0
    bus_coverage = (bus_data["totalCapacity"] / bus_data["totalDemand"]) * 100.0
    assert bus_coverage != 1200000.0
    assert 100.0 <= bus_coverage <= 500.0


def test_optimization_endpoint_rejects_infeasible_fleet(client: TestClient) -> None:
    """Verify that HTTP POST /api/math/optimize/{mode} returns 422 for infeasible fleet allocations."""
    # Predict routes for Railway
    rail_pred = client.post(
        "/api/math/predict/RAILWAY",
        json={"date": "2026-09-06", "hour": 18, "rainfall": 0, "temperature": 25, "demandMultiplier": 1},
    ).json()["routes"]

    # 4 routes, min=1, avail=2 -> required=4 -> infeasible
    infeasible_rail = {
        "predictions": rail_pred,
        "availableBuses": 2,
        "busCapacity": 3000,
        "minBusesPerRoute": 1,
        "maxBusesPerRoute": 4,
    }
    res_rail = client.post("/api/math/optimize/RAILWAY", json=infeasible_rail)
    assert res_rail.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    assert "Optimization infeasible" in res_rail.json()["error"]
    assert "available fleet (2) is smaller than minimum fleet required (4)" in res_rail.json()["error"]

    # Zero fleet with min=1 -> required=4 -> infeasible
    zero_fleet_payload = {
        "predictions": rail_pred,
        "availableBuses": 0,
        "busCapacity": 3000,
        "minBusesPerRoute": 1,
        "maxBusesPerRoute": 4,
    }
    res_zero = client.post("/api/math/optimize/RAILWAY", json=zero_fleet_payload)
    assert res_zero.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    assert "Optimization infeasible" in res_zero.json()["error"]

    # Bus mode infeasible check
    bus_pred = client.post(
        "/api/math/predict/BUS",
        json={"date": "2026-09-06", "hour": 18, "rainfall": 0, "temperature": 25, "demandMultiplier": 1},
    ).json()["routes"]
    infeasible_bus = {
        "predictions": bus_pred,
        "availableBuses": 2,
        "busCapacity": 70,
        "minBusesPerRoute": 1,
        "maxBusesPerRoute": 4,
    }
    res_bus = client.post("/api/math/optimize/BUS", json=infeasible_bus)
    assert res_bus.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    assert "Optimization infeasible" in res_bus.json()["error"]


def test_optimization_endpoint_exactly_feasible_minimum(client: TestClient) -> None:
    """Verify that HTTP POST /api/math/optimize/{mode} succeeds when fleet exactly equals minimum required."""
    rail_pred = client.post(
        "/api/math/predict/RAILWAY",
        json={"date": "2026-09-06", "hour": 18, "rainfall": 0, "temperature": 25, "demandMultiplier": 1},
    ).json()["routes"]

    payload = {
        "predictions": rail_pred,
        "availableBuses": 4,
        "busCapacity": 3000,
        "minBusesPerRoute": 1,
        "maxBusesPerRoute": 4,
    }
    res = client.post("/api/math/optimize/RAILWAY", json=payload)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["totalBuses"] == 4
    total_allocated = sum(r["buses"] for r in data["routes"])
    assert total_allocated == 4
    assert total_allocated <= payload["availableBuses"]


def test_optimization_cross_mode_isolation_and_invalid_bounds(client: TestClient) -> None:
    """Verify that infeasibility is isolated between transport modes, and inverted bounds return 422."""
    rail_pred = client.post(
        "/api/math/predict/RAILWAY",
        json={"date": "2026-09-06", "hour": 18, "rainfall": 0, "temperature": 25, "demandMultiplier": 1},
    ).json()["routes"]
    bus_pred = client.post(
        "/api/math/predict/BUS",
        json={"date": "2026-09-06", "hour": 18, "rainfall": 0, "temperature": 25, "demandMultiplier": 1},
    ).json()["routes"]

    # Inverted bounds check
    bad_bounds = {
        "predictions": rail_pred,
        "availableBuses": 6,
        "busCapacity": 3000,
        "minBusesPerRoute": 3,
        "maxBusesPerRoute": 2,
    }
    res_bounds = client.post("/api/math/optimize/RAILWAY", json=bad_bounds)
    assert res_bounds.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    assert "cannot exceed maximum allocation" in res_bounds.json()["error"]

    # Sequence: RAILWAY(infeasible) -> BUS(feasible) -> RAILWAY(feasible) -> BUS(infeasible) -> RAILWAY(feasible)
    # 1. Infeasible Railway
    r1 = client.post("/api/math/optimize/RAILWAY", json={
        "predictions": rail_pred, "availableBuses": 2, "busCapacity": 3000, "minBusesPerRoute": 1, "maxBusesPerRoute": 4,
    })
    assert r1.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT

    # 2. Feasible Bus
    b1 = client.post("/api/math/optimize/BUS", json={
        "predictions": bus_pred, "availableBuses": 4, "busCapacity": 70, "minBusesPerRoute": 1, "maxBusesPerRoute": 4,
    })
    assert b1.status_code == status.HTTP_200_OK
    assert b1.json()["totalBuses"] == 4

    # 3. Feasible Railway
    r2 = client.post("/api/math/optimize/RAILWAY", json={
        "predictions": rail_pred, "availableBuses": 6, "busCapacity": 3000, "minBusesPerRoute": 1, "maxBusesPerRoute": 4,
    })
    assert r2.status_code == status.HTTP_200_OK
    assert r2.json()["totalBuses"] == 6

    # 4. Infeasible Bus
    b2 = client.post("/api/math/optimize/BUS", json={
        "predictions": bus_pred, "availableBuses": 1, "busCapacity": 70, "minBusesPerRoute": 1, "maxBusesPerRoute": 4,
    })
    assert b2.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT

    # 5. Feasible Railway
    r3 = client.post("/api/math/optimize/RAILWAY", json={
        "predictions": rail_pred, "availableBuses": 6, "busCapacity": 3000, "minBusesPerRoute": 1, "maxBusesPerRoute": 4,
    })
    assert r3.status_code == status.HTTP_200_OK
    assert r3.json()["totalBuses"] == 6



def test_simulation_endpoint(client: TestClient) -> None:
    """Test stress-testing simulation endpoint."""
    payload = {
        "availableBuses": 4,
        "rainfall": 15.0,
        "temperature": 18.0,
        "demandMultiplier": 1.2,
        "isHoliday": False,
        "specialEvent": True,
    }
    res = client.post("/api/math/simulate/RAILWAY", json=payload)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["scenario"]["demand"] > data["baseline"]["demand"]


def test_explain_endpoint(client: TestClient) -> None:
    """Test evidence explanation synthesis endpoint."""
    payload = {
        "topic": "Central Line peak pressure",
        "evidence": "Predicted demand 2437 exceeds baseline train capacity 3000 by 81% utilization.",
    }
    res = client.post("/api/math/explain/RAILWAY", json=payload)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert "explanation" in data
    assert len(data["explanation"]) > 0
    assert "Central Line" in data["explanation"] or "Railway" in data["explanation"]
    assert "configured" in data


def test_explain_endpoint_fallback_when_key_missing(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify endpoint falls back safely to deterministic review when API key is missing."""
    from pydantic import SecretStr
    from app.core.config import Settings
    import app.services.math_service as math_service_module

    fake_settings = Settings(
        _env_file=None,
        gemini_api_key=None,
    )
    monkeypatch.setattr(math_service_module, "get_settings", lambda: fake_settings)

    payload = {
        "topic": "Central Line peak pressure",
        "evidence": "Predicted demand 2437 exceeds baseline train capacity 3000 by 81% utilization.",
    }
    res = client.post("/api/math/explain/RAILWAY", json=payload)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["configured"] is False
    assert "Operational Review for Railway Network" in data["explanation"]
    assert data["evidence"] == payload["evidence"]


def test_explain_endpoint_fallback_on_provider_error(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify endpoint gracefully falls back when Gemini provider encounters an error."""
    import httpx
    import app.services.math_service as math_service_module
    from pydantic import SecretStr
    from app.core.config import Settings

    fake_settings = Settings(
        _env_file=None,
        gemini_api_key=SecretStr("mock-key"),
    )
    monkeypatch.setattr(math_service_module, "get_settings", lambda: fake_settings)

    real_post = httpx.Client.post

    def mock_post(self, url, *args, **kwargs):
        if "generativelanguage.googleapis.com" in str(url):
            raise httpx.ConnectError("Network unreachable")
        return real_post(self, url, *args, **kwargs)

    monkeypatch.setattr(httpx.Client, "post", mock_post)

    payload = {
        "topic": "Route B1 congestion",
        "evidence": "Peak passenger load reaches 142%.",
    }
    res = client.post("/api/math/explain/BUS", json=payload)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["configured"] is False
    assert "Operational Review for Bus Network" in data["explanation"]


def test_explain_endpoint_fallback_iteration_to_working_model(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify explain endpoint fails over from overloaded/timed-out primary to working fallback model."""
    import httpx
    import app.services.math_service as math_service_module
    from pydantic import SecretStr
    from app.core.config import Settings

    fake_settings = Settings(
        _env_file=None,
        gemini_api_key=SecretStr("mock-key"),
        gemini_model="gemini-3.8-flash",
    )
    monkeypatch.setattr(math_service_module, "get_settings", lambda: fake_settings)

    attempted_urls = []

    real_post = httpx.Client.post

    def mock_post(self, url, *args, **kwargs):
        if "generativelanguage.googleapis.com" in str(url):
            attempted_urls.append(str(url))
            if "gemini-3.8-flash" in str(url):
                return httpx.Response(
                    status_code=503,
                    json={"error": {"code": 503, "status": "UNAVAILABLE", "message": "High demand"}},
                    request=httpx.Request("POST", url),
                )
            elif "gemini-3.6-flash" in str(url):
                return httpx.Response(
                    status_code=200,
                    json={
                        "candidates": [{
                            "content": {
                                "parts": [{"text": "Synthetic failover note: Railway fleet operations stable."}]
                            }
                        }]
                    },
                    request=httpx.Request("POST", url),
                )
            return httpx.Response(status_code=404, request=httpx.Request("POST", url))
        return real_post(self, url, *args, **kwargs)

    monkeypatch.setattr(httpx.Client, "post", mock_post)

    payload = {
        "topic": "Central Line peak pressure",
        "evidence": "Predicted demand 2437 exceeds baseline train capacity 3000 by 81% utilization.",
    }
    res = client.post("/api/math/explain/RAILWAY", json=payload)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["configured"] is True
    assert "Synthetic failover note" in data["explanation"]
    assert any("gemini-3.8-flash" in u for u in attempted_urls)
    assert any("gemini-3.6-flash" in u for u in attempted_urls)

