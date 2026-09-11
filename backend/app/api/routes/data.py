"""Data and domain read-only validation API endpoints for MetroMind AI."""

import csv
import io
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.domain.data.models import DataSummary, DatasetMetadata, DemandRecord
from app.domain.transport.enums import TransportMode
from app.domain.transport.fleet import FleetConfig
from app.domain.transport.registry import transport_registry
from app.domain.transport.routes import Route
from app.models.dashboard import DashboardResponse, RouteInsightResponse
from app.services.data_service import transport_data_service

router = APIRouter(prefix="/data", tags=["data"])


class DemoDatasetResponse(BaseModel):
    """Payload returning demo records accompanied by dataset metadata."""

    metadata: DatasetMetadata = Field(description="Summary metadata for the dataset.")
    records: list[DemandRecord] = Field(
        description="Collection of synthetic demand observations."
    )


def _resolve_mode_or_422(mode: str) -> TransportMode:
    """Normalize mode or raise HTTP 422 if unsupported."""
    try:
        return transport_registry.require_mode(mode)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc


@router.get("/routes/{mode}", response_model=list[Route])
def get_routes_by_mode(mode: str) -> list[Route]:
    """Retrieve canonical routes for a specific transport mode."""
    resolved_mode = _resolve_mode_or_422(mode)
    return list(transport_data_service.get_routes(resolved_mode))


@router.get("/fleet/{mode}", response_model=FleetConfig)
def get_fleet_config_by_mode(mode: str) -> FleetConfig:
    """Retrieve demo vehicle capacity and fleet sizing for a specific transport mode."""
    resolved_mode = _resolve_mode_or_422(mode)
    return transport_data_service.get_fleet_config(resolved_mode)


@router.get("/demo/{mode}", response_model=DemoDatasetResponse)
def get_demo_dataset_by_mode(mode: str) -> DemoDatasetResponse:
    """Retrieve the complete synthetic demonstration dataset for a transport mode."""
    resolved_mode = _resolve_mode_or_422(mode)
    metadata = transport_data_service.get_dataset_metadata(resolved_mode)
    records = transport_data_service.get_demo_dataset(resolved_mode)
    return DemoDatasetResponse(metadata=metadata, records=list(records))


@router.get("/demo/{mode}/csv")
def download_demo_dataset_csv(mode: str):
    """Download the complete synthetic demonstration dataset as CSV."""
    resolved_mode = _resolve_mode_or_422(mode)
    records = transport_data_service.get_demo_dataset(resolved_mode)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "timestamp", "route_id", "station_id", "passenger_count", 
        "day_of_week", "is_weekend", "is_holiday", 
        "temperature", "rainfall", "special_event"
    ])
    
    for r in records:
        writer.writerow([
            r.timestamp.strftime("%Y-%m-%dT%H:%M:%SZ"), r.route_id, r.station_id, r.passenger_count,
            r.day_of_week, str(r.is_weekend).lower(), str(r.is_holiday).lower(),
            round(r.temperature, 2), round(r.rainfall, 2), str(r.special_event).lower()
        ])
        
    output.seek(0)
    filename = "MMR_TRANSIT_2026.csv" if resolved_mode == TransportMode.RAILWAY else "BEST_TRANSIT_2026.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/summary/{mode}", response_model=DataSummary)
def get_dataset_summary_by_mode(mode: str) -> DataSummary:
    """Retrieve statistical summary and data quality metrics for a transport mode."""
    resolved_mode = _resolve_mode_or_422(mode)
    return transport_data_service.get_dataset_summary(resolved_mode)


@router.get("/dashboard/{mode}", response_model=DashboardResponse)
def get_dashboard_by_mode(mode: str) -> DashboardResponse:
    """Retrieve operational control room summary for a specific transport mode."""
    resolved_mode = _resolve_mode_or_422(mode)
    try:
        return transport_data_service.get_dashboard(resolved_mode)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc


@router.get("/route-insights/{mode}", response_model=list[RouteInsightResponse])
def get_route_insights_by_mode(mode: str) -> list[RouteInsightResponse]:
    """Retrieve live corridor insights combining routes, forecast demand, and risk."""
    resolved_mode = _resolve_mode_or_422(mode)
    try:
        dash = transport_data_service.get_dashboard(resolved_mode)
        return dash.routes
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc


@router.post("/demo/{mode}", response_model=DataSummary)
def reset_demo_dataset_by_mode(mode: str) -> DataSummary:
    """Reset the specified mode's in-memory dataset to its synthetic demonstration baseline."""
    resolved_mode = _resolve_mode_or_422(mode)
    return transport_data_service.reset_demo(resolved_mode)


class UploadDatasetPayload(BaseModel):
    """Payload containing raw CSV string for dataset intake."""

    data: str = Field(description="Raw CSV text content.")


@router.post("/upload/{mode}", response_model=DataSummary)
def upload_dataset_by_mode(mode: str, payload: UploadDatasetPayload) -> DataSummary:
    """Upload and validate a custom CSV dataset for the specified transport mode."""
    resolved_mode = _resolve_mode_or_422(mode)
    try:
        return transport_data_service.load_custom_dataset(resolved_mode, payload.data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

