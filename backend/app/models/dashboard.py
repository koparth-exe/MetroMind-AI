"""Pydantic schemas for the MetroMind AI mode-aware operational dashboard."""

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Base model with automatic camelCase serialization for frontend compatibility."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class RouteInsightResponse(CamelModel):
    """Corridor-level insight combining route definition, demand forecast, and risk."""

    route_id: str = Field(description="Transit route identifier (e.g. 'R1', 'B1').")
    name: str = Field(description="Human-readable corridor name.")
    color: str = Field(description="Brand/line hexadecimal color code.")
    predicted_demand: float = Field(description="Forecast passenger demand for the service window.")
    historical_average: float = Field(description="Historical average demand for the corridor.")
    capacity: int = Field(description="Nominal baseline capacity (baseline buses * vehicle capacity).")
    utilization: float = Field(description="Utilization ratio (predicted demand / capacity).")
    overcrowding_probability: float = Field(description="Probability of demand exceeding capacity.")
    risk: str = Field(description="Categorical risk band: 'Low', 'Medium', 'High', or 'Critical'.")
    recommended_buses: int = Field(description="Optimized vehicle allocation.")
    baseline_buses: int = Field(description="Standard baseline vehicle allocation.")
    stations: list[str] = Field(description="Ordered list of station names along the corridor.")
    coordinates: list[list[float]] = Field(description="List of [latitude, longitude] route points.")


class HourlyTrendResponse(CamelModel):
    """Hourly passenger demand trend point."""

    label: str = Field(description="Hour label (e.g. '08:00').")
    demand: float = Field(description="Average demand for this hour.")
    baseline: float = Field(description="Baseline demand for comparison.")


class RiskDistributionItem(CamelModel):
    """Count of routes within a categorical risk band."""

    name: str = Field(description="Risk band name: 'Low', 'Medium', 'High', or 'Critical'.")
    value: int = Field(description="Number of routes in this risk band.")


class ActivityItem(CamelModel):
    """Operational activity or model refresh event."""

    title: str
    detail: str
    time: str


class DashboardResponse(CamelModel):
    """Complete operational control room summary for the specified transport mode."""

    mode: str = Field(description="Canonical transport mode ('RAILWAY' or 'BUS').")
    total_predicted_demand: float = Field(description="Sum of predicted demand across all mode routes.")
    high_risk_routes: int = Field(description="Number of routes currently categorized as HIGH or CRITICAL.")
    average_risk: float = Field(description="Mean overcrowding exceedance probability across routes.")
    available_buses: int = Field(description="Total active fleet size for this mode.")
    total_required_capacity: int = Field(description="Total passenger capacity required to meet demand.")
    recommended_additional_buses: int = Field(description="Additional vehicles recommended by optimization.")
    routes: list[RouteInsightResponse] = Field(description="Corridor-level insights and map geometry.")
    trend: list[HourlyTrendResponse] = Field(description="24-hour network demand profile.")
    risk_distribution: list[RiskDistributionItem] = Field(description="Route count breakdown across risk bands.")
    activity: list[ActivityItem] = Field(description="Recent operational activity log.")
