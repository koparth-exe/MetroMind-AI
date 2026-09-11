"""Integration tests for mathematical FastAPI endpoints."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_get_models_endpoint_for_railway_and_bus() -> None:
    # Railway
    res_rail = client.get("/api/math/models/railway")
    assert res_rail.status_code == 200
    data_rail = res_rail.json()
    assert data_rail["mode"] == "RAILWAY"
    assert data_rail["best_model"] in ("Random Forest", "Gradient Boosting")
    assert data_rail["selection_criterion"] == "lowest_rmse"
    assert "Linear Regression" in data_rail["models"]
    assert "Random Forest" in data_rail["models"]
    assert "Gradient Boosting" in data_rail["models"]
    assert data_rail["training_count"] > 0
    assert data_rail["test_count"] > 0

    # Bus
    res_bus = client.get("/api/math/models/bus")
    assert res_bus.status_code == 200
    data_bus = res_bus.json()
    assert data_bus["mode"] == "BUS"
    assert "Linear Regression" in data_bus["models"]


def test_get_models_endpoint_with_route_filter() -> None:
    res = client.get("/api/math/models/railway?route_id=R1")
    assert res.status_code == 200
    data = res.json()
    assert data["route_id"] == "R1"
    assert data["training_count"] > 0


def test_get_models_endpoint_rejects_invalid_mode_and_cross_mode_route() -> None:
    # Invalid mode
    res_inv = client.get("/api/math/models/monorail")
    assert res_inv.status_code == 422
    assert "Unsupported transport mode" in res_inv.json()["error"]

    # Cross-mode route mismatch: B1 does not exist in RAILWAY
    res_mismatch = client.get("/api/math/models/railway?route_id=B1")
    assert res_mismatch.status_code == 422
    assert "does not exist for mode 'RAILWAY'" in res_mismatch.json()["error"]


def test_get_residuals_endpoint() -> None:
    res = client.get("/api/math/residuals/railway")
    assert res.status_code == 200
    data = res.json()
    assert data["mode"] == "RAILWAY"
    assert "Linear Regression" in data["models"]
    lr_res = data["models"]["Linear Regression"]
    assert "mean_residual" in lr_res
    assert "mae" in lr_res
    assert "rmse" in lr_res


def test_get_correlations_endpoint() -> None:
    res = client.get("/api/math/correlations/bus")
    assert res.status_code == 200
    data = res.json()
    assert data["mode"] == "BUS"
    assert "hour" in data["feature_correlations"]
    assert data["feature_correlations"]["hour"]["pearson"]["is_defined"] is True


def test_get_seasonality_endpoint() -> None:
    res = client.get("/api/math/seasonality/railway?top_k=4")
    assert res.status_code == 200
    data = res.json()
    assert data["mode"] == "RAILWAY"
    assert data["total_samples"] > 0
    assert len(data["dominant_harmonics"]) == 4
    first_harmonic = data["dominant_harmonics"][0]
    assert first_harmonic["harmonic_index"] > 0
    assert first_harmonic["frequency"] > 0.0
    assert first_harmonic["period_hours"] > 0.0
