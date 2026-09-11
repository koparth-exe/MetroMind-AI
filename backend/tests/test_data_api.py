"""Tests for the read-only FastAPI data endpoints."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_get_routes_endpoint_for_railway_and_bus() -> None:
    # Railway routes
    res_rail = client.get("/api/data/routes/railway")
    assert res_rail.status_code == 200
    rail_data = res_rail.json()
    assert len(rail_data) == 4
    assert [r["route_id"] for r in rail_data] == ["R1", "R2", "R3", "R4"]
    assert all(r["mode"] == "RAILWAY" for r in rail_data)

    # Bus routes
    res_bus = client.get("/api/data/routes/bus")
    assert res_bus.status_code == 200
    bus_data = res_bus.json()
    assert len(bus_data) == 4
    assert [r["route_id"] for r in bus_data] == ["B1", "B2", "B3", "B4"]
    assert all(r["mode"] == "BUS" for r in bus_data)


def test_get_routes_endpoint_rejects_invalid_mode() -> None:
    res = client.get("/api/data/routes/train")
    assert res.status_code == 422
    assert "Unsupported transport mode 'train'" in res.json()["error"]


def test_get_fleet_endpoint() -> None:
    res_rail = client.get("/api/data/fleet/railway")
    assert res_rail.status_code == 200
    assert res_rail.json()["vehicle_capacity"] == 3000
    assert res_rail.json()["fleet_size"] == 4
    assert res_rail.json()["vehicle_type_name"] == "Train"

    res_bus = client.get("/api/data/fleet/bus")
    assert res_bus.status_code == 200
    assert res_bus.json()["vehicle_capacity"] == 70
    assert res_bus.json()["fleet_size"] == 4
    assert res_bus.json()["vehicle_type_name"] == "Bus"

    res_invalid = client.get("/api/data/fleet/monorail")
    assert res_invalid.status_code == 422


def test_get_demo_endpoint_isolation() -> None:
    res_rail = client.get("/api/data/demo/railway")
    assert res_rail.status_code == 200
    rail_payload = res_rail.json()
    assert rail_payload["metadata"]["mode"] == "RAILWAY"
    assert rail_payload["metadata"]["record_count"] == 2688
    assert len(rail_payload["records"]) == 2688
    assert all(r["mode"] == "RAILWAY" for r in rail_payload["records"])

    res_bus = client.get("/api/data/demo/bus")
    assert res_bus.status_code == 200
    bus_payload = res_bus.json()
    assert bus_payload["metadata"]["mode"] == "BUS"
    assert bus_payload["metadata"]["record_count"] == 2688
    assert len(bus_payload["records"]) == 2688
    assert all(r["mode"] == "BUS" for r in bus_payload["records"])

    res_invalid = client.get("/api/data/demo/rail")
    assert res_invalid.status_code == 422


def test_get_summary_endpoint() -> None:
    res_rail = client.get("/api/data/summary/railway")
    assert res_rail.status_code == 200
    rail_summary = res_rail.json()
    assert rail_summary["mode"] == "RAILWAY"
    assert rail_summary["records"] == 2688
    assert rail_summary["routes"] == 4
    assert rail_summary["quality"] == "Excellent"

    res_bus = client.get("/api/data/summary/bus")
    assert res_bus.status_code == 200
    bus_summary = res_bus.json()
    assert bus_summary["mode"] == "BUS"
    assert bus_summary["records"] == 2688
    assert bus_summary["routes"] == 4
    assert bus_summary["quality"] == "Excellent"

    res_invalid = client.get("/api/data/summary/metro")
    assert res_invalid.status_code == 422


def test_demo_csv_download() -> None:
    # Railway CSV
    res_rail = client.get("/api/data/demo/railway/csv")
    assert res_rail.status_code == 200
    assert res_rail.headers["content-type"] == "text/csv; charset=utf-8"
    assert "MMR_TRANSIT_2026.csv" in res_rail.headers["content-disposition"]
    
    content_rail = res_rail.text
    assert "timestamp,route_id,station_id,passenger_count,day_of_week,is_weekend,is_holiday,temperature,rainfall,special_event" in content_rail
    assert "R1,Thane" in content_rail

    # Bus CSV
    res_bus = client.get("/api/data/demo/bus/csv")
    assert res_bus.status_code == 200
    assert res_bus.headers["content-type"] == "text/csv; charset=utf-8"
    assert "BEST_TRANSIT_2026.csv" in res_bus.headers["content-disposition"]
    
    content_bus = res_bus.text
    assert "timestamp,route_id,station_id,passenger_count,day_of_week,is_weekend,is_holiday,temperature,rainfall,special_event" in content_bus
    assert "B1," in content_bus
