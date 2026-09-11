"""Startup and health-check tests."""

from fastapi.testclient import TestClient

from app.main import app, create_app


def test_application_starts() -> None:
    application = create_app()
    assert application.title
    paths = application.openapi()["paths"]
    assert "/api/healthz" in paths
    assert "get" in paths["/api/healthz"]


def test_healthz_returns_ok() -> None:
    client = TestClient(app)
    response = client.get("/api/healthz")
    assert response.status_code == 200
    body = response.json()
    assert body == {"status": "ok", "service": "metromind-fastapi"}
