"""API integration tests for the Phase 5 Risk Engine endpoints.

Tests cover:
- GET /api/risk/{mode} for RAILWAY and BUS
- GET /api/risk/{mode}/summary for RAILWAY and BUS
- Invalid mode returns HTTP 422
- Response schema validation
- Mode isolation via response mode field
- Results list is non-empty
- Summary level counts
- Backward compatibility of all existing Phase 1–4 endpoints
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="module")
def client() -> TestClient:
    return TestClient(app)


# ---------------------------------------------------------------------------
# GET /api/risk/{mode} — Detailed assessment
# ---------------------------------------------------------------------------

class TestRiskAssessmentEndpoint:

    def test_railway_risk_returns_200(self, client: TestClient):
        """GET /api/risk/RAILWAY must return HTTP 200."""
        response = client.get("/api/risk/RAILWAY")
        assert response.status_code == 200, response.text

    def test_bus_risk_returns_200(self, client: TestClient):
        """GET /api/risk/BUS must return HTTP 200."""
        response = client.get("/api/risk/BUS")
        assert response.status_code == 200, response.text

    def test_railway_mode_field_in_response(self, client: TestClient):
        """RAILWAY response must have mode='RAILWAY'."""
        response = client.get("/api/risk/RAILWAY")
        data = response.json()
        assert data["mode"] == "RAILWAY"

    def test_bus_mode_field_in_response(self, client: TestClient):
        """BUS response must have mode='BUS'."""
        response = client.get("/api/risk/BUS")
        data = response.json()
        assert data["mode"] == "BUS"

    def test_railway_response_has_results_list(self, client: TestClient):
        """RAILWAY response must contain a non-empty results list."""
        response = client.get("/api/risk/RAILWAY")
        data = response.json()
        assert "results" in data
        assert len(data["results"]) > 0

    def test_bus_response_has_results_list(self, client: TestClient):
        """BUS response must contain a non-empty results list."""
        response = client.get("/api/risk/BUS")
        data = response.json()
        assert "results" in data
        assert len(data["results"]) > 0

    def test_railway_results_schema_fields(self, client: TestClient):
        """Each result record must contain all required schema fields."""
        response = client.get("/api/risk/RAILWAY")
        data = response.json()
        required_fields = {
            "route_id", "timestamp", "predicted_demand_raw", "effective_demand",
            "capacity", "utilization_ratio", "utilization_percentage",
            "utilization_label", "uncertainty_sigma", "overload_probability",
            "risk_score", "risk_level", "level_elevated", "sigma_source",
            "model_name",
        }
        for record in data["results"]:
            missing = required_fields - set(record.keys())
            assert not missing, f"Missing fields: {missing}"

    def test_railway_capacity_is_3000(self, client: TestClient):
        """Railway capacity field must be 3000."""
        response = client.get("/api/risk/RAILWAY")
        data = response.json()
        assert data["capacity"] == 3000

    def test_bus_capacity_is_70(self, client: TestClient):
        """Bus capacity field must be 70."""
        response = client.get("/api/risk/BUS")
        data = response.json()
        assert data["capacity"] == 70

    def test_all_risk_scores_in_0_to_100(self, client: TestClient):
        """All risk scores must be between 0 and 100."""
        response = client.get("/api/risk/RAILWAY")
        data = response.json()
        for r in data["results"]:
            assert 0.0 <= r["risk_score"] <= 100.0, (
                f"Risk score {r['risk_score']} out of bounds for route {r['route_id']}"
            )

    def test_all_overload_probabilities_in_0_to_1(self, client: TestClient):
        """All overload probabilities must be in [0, 1]."""
        response = client.get("/api/risk/BUS")
        data = response.json()
        for r in data["results"]:
            assert 0.0 <= r["overload_probability"] <= 1.0, (
                f"Probability {r['overload_probability']} out of bounds for route {r['route_id']}"
            )

    def test_all_risk_levels_are_valid(self, client: TestClient):
        """All risk_level values must be one of LOW/MEDIUM/HIGH/CRITICAL."""
        response = client.get("/api/risk/RAILWAY")
        data = response.json()
        valid_levels = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
        for r in data["results"]:
            assert r["risk_level"] in valid_levels, (
                f"Invalid risk_level '{r['risk_level']}' for route {r['route_id']}"
            )

    def test_railway_routes_are_only_railway(self, client: TestClient):
        """RAILWAY results must only contain R-prefixed routes."""
        response = client.get("/api/risk/RAILWAY")
        data = response.json()
        for r in data["results"]:
            assert r["route_id"].startswith("R"), (
                f"Non-railway route '{r['route_id']}' in RAILWAY response"
            )

    def test_bus_routes_are_only_bus(self, client: TestClient):
        """BUS results must only contain B-prefixed routes."""
        response = client.get("/api/risk/BUS")
        data = response.json()
        for r in data["results"]:
            assert r["route_id"].startswith("B"), (
                f"Non-bus route '{r['route_id']}' in BUS response"
            )

    def test_invalid_mode_returns_422(self, client: TestClient):
        """Unsupported mode string must return HTTP 422."""
        response = client.get("/api/risk/TRAM")
        assert response.status_code == 422

    def test_case_insensitive_mode_railway(self, client: TestClient):
        """Lowercase mode 'railway' should be accepted (canonical normalization)."""
        response = client.get("/api/risk/railway")
        assert response.status_code == 200
        assert response.json()["mode"] == "RAILWAY"

    def test_num_observations_matches_results_length(self, client: TestClient):
        """num_observations in response must equal len(results)."""
        response = client.get("/api/risk/RAILWAY")
        data = response.json()
        assert data["num_observations"] == len(data["results"])


# ---------------------------------------------------------------------------
# GET /api/risk/{mode}/summary — Aggregated summary
# ---------------------------------------------------------------------------

class TestRiskSummaryEndpoint:

    def test_railway_summary_returns_200(self, client: TestClient):
        """GET /api/risk/RAILWAY/summary must return HTTP 200."""
        response = client.get("/api/risk/RAILWAY/summary")
        assert response.status_code == 200, response.text

    def test_bus_summary_returns_200(self, client: TestClient):
        """GET /api/risk/BUS/summary must return HTTP 200."""
        response = client.get("/api/risk/BUS/summary")
        assert response.status_code == 200, response.text

    def test_railway_summary_mode_field(self, client: TestClient):
        """RAILWAY summary must have mode='RAILWAY'."""
        response = client.get("/api/risk/RAILWAY/summary")
        assert response.json()["mode"] == "RAILWAY"

    def test_bus_summary_mode_field(self, client: TestClient):
        """BUS summary must have mode='BUS'."""
        response = client.get("/api/risk/BUS/summary")
        assert response.json()["mode"] == "BUS"

    def test_summary_schema_fields(self, client: TestClient):
        """Summary response must contain all required schema fields."""
        response = client.get("/api/risk/RAILWAY/summary")
        data = response.json()
        required_fields = {
            "mode", "best_model_name", "capacity", "mode_sigma",
            "num_routes_analyzed", "num_observations", "highest_risk_route",
            "average_risk_score", "max_risk_score", "max_overload_probability",
            "level_counts",
        }
        missing = required_fields - set(data.keys())
        assert not missing, f"Missing fields: {missing}"

    def test_summary_level_counts_schema(self, client: TestClient):
        """level_counts must contain LOW, MEDIUM, HIGH, CRITICAL."""
        response = client.get("/api/risk/RAILWAY/summary")
        level_counts = response.json()["level_counts"]
        assert set(level_counts.keys()) == {"LOW", "MEDIUM", "HIGH", "CRITICAL"}

    def test_summary_level_counts_sum_to_observations(self, client: TestClient):
        """Sum of level counts must equal num_observations."""
        response = client.get("/api/risk/RAILWAY/summary")
        data = response.json()
        total = sum(data["level_counts"].values())
        assert total == data["num_observations"]

    def test_summary_invalid_mode_returns_422(self, client: TestClient):
        """Invalid mode in summary endpoint returns HTTP 422."""
        response = client.get("/api/risk/METRO/summary")
        assert response.status_code == 422

    def test_summary_highest_risk_route_is_valid_route(self, client: TestClient):
        """highest_risk_route must be a valid R-prefixed route for RAILWAY."""
        response = client.get("/api/risk/RAILWAY/summary")
        data = response.json()
        assert data["highest_risk_route"].startswith("R"), (
            f"Unexpected highest_risk_route: {data['highest_risk_route']}"
        )

    def test_summary_bus_highest_risk_route_is_b_prefixed(self, client: TestClient):
        """highest_risk_route for BUS must be B-prefixed."""
        response = client.get("/api/risk/BUS/summary")
        data = response.json()
        assert data["highest_risk_route"].startswith("B"), (
            f"Unexpected highest_risk_route: {data['highest_risk_route']}"
        )


# ---------------------------------------------------------------------------
# Backward compatibility — existing Phase 1–4 endpoints must still work
# ---------------------------------------------------------------------------

class TestBackwardCompatibility:

    def test_health_endpoint(self, client: TestClient):
        """GET /api/healthz must still return 200."""
        response = client.get("/api/healthz")
        assert response.status_code == 200

    def test_transport_modes_endpoint(self, client: TestClient):
        """GET /api/transport/modes must still return 200."""
        response = client.get("/api/transport/modes")
        assert response.status_code == 200

    def test_transport_railway_endpoint(self, client: TestClient):
        """GET /api/transport/modes/RAILWAY must still return 200."""
        response = client.get("/api/transport/modes/RAILWAY")
        assert response.status_code == 200

    def test_data_routes_railway(self, client: TestClient):
        """GET /api/data/routes/RAILWAY must still return 200."""
        response = client.get("/api/data/routes/RAILWAY")
        assert response.status_code == 200

    def test_data_demo_bus(self, client: TestClient):
        """GET /api/data/demo/BUS must still return 200."""
        response = client.get("/api/data/demo/BUS")
        assert response.status_code == 200

    def test_math_models_railway(self, client: TestClient):
        """GET /api/math/models/RAILWAY must still return 200."""
        response = client.get("/api/math/models/RAILWAY")
        assert response.status_code == 200

    def test_math_residuals_bus(self, client: TestClient):
        """GET /api/math/residuals/BUS must still return 200."""
        response = client.get("/api/math/residuals/BUS")
        assert response.status_code == 200

    def test_math_correlations_railway(self, client: TestClient):
        """GET /api/math/correlations/RAILWAY must still return 200."""
        response = client.get("/api/math/correlations/RAILWAY")
        assert response.status_code == 200

    def test_math_seasonality_bus(self, client: TestClient):
        """GET /api/math/seasonality/BUS must still return 200."""
        response = client.get("/api/math/seasonality/BUS")
        assert response.status_code == 200
