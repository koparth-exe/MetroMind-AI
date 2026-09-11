"""Pydantic response schemas for the MetroMind AI Phase 5 Risk Engine API.

These models define the JSON structure returned by:
    GET /api/risk/{mode}
    GET /api/risk/{mode}/summary

Design Principles
-----------------
- All numeric values exposed with sufficient precision for frontend display.
- mode field uses canonical uppercase string (e.g. 'RAILWAY', 'BUS').
- risk_level uses the RiskLevel enum string value ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').
- Raw and effective demand both exposed for transparency.
- sigma_source describes which uncertainty estimate was used.
"""

from pydantic import BaseModel, Field

from app.mathematics.risk.thresholds import RiskLevel


class RouteRiskRecordResponse(BaseModel):
    """Risk assessment result for a single (route, timestamp) observation.

    Exposes all risk dimensions so that frontend components can explain
    exactly how the risk_score was computed.
    """

    route_id: str = Field(description="Transit route identifier (e.g. 'R1', 'B2').")
    timestamp: str = Field(description="ISO 8601 observation timestamp from the test partition.")
    predicted_demand_raw: float = Field(
        description=(
            "Unmodified ML model prediction. May be negative for low-demand "
            "periods under linear regression. Preserved for transparency."
        )
    )
    effective_demand: float = Field(
        description="max(0, predicted_demand_raw) used for utilization and probability calculations."
    )
    capacity: int = Field(description="Nominal per-vehicle passenger capacity for this mode.")
    utilization_ratio: float = Field(
        description="effective_demand / capacity. Values > 1.0 indicate predicted overload."
    )
    utilization_percentage: float = Field(
        description="utilization_ratio * 100 (for display)."
    )
    utilization_label: str = Field(
        description=(
            "Descriptive utilization band: 'Low utilization', 'Moderate utilization', "
            "'High utilization', or 'Overload'."
        )
    )
    uncertainty_sigma: float = Field(
        description=(
            "Estimated prediction uncertainty: standard deviation of held-out "
            "test-set residuals (y_true - y_pred). Used as sigma in the "
            "Normal(demand, sigma²) uncertainty model."
        )
    )
    overload_probability: float = Field(
        description=(
            "P(demand > capacity) under Normal(effective_demand, sigma²) model. "
            "Value in [0.0, 1.0]. 0.5 means the model expects equal chance of "
            "demand being above or below capacity."
        )
    )
    risk_score: float = Field(
        description=(
            "Composite risk score in [0.0, 100.0]. "
            "= 0.60 * min(utilization_ratio * 100, 100) "
            "+ 0.40 * overload_probability * 100."
        )
    )
    risk_level: str = Field(
        description=(
            "Categorical risk classification: LOW (0–24), MEDIUM (25–49), "
            "HIGH (50–74), CRITICAL (75–100). May be elevated to HIGH if "
            "overload_probability >= 0.50 regardless of score."
        )
    )
    level_elevated: bool = Field(
        description=(
            "True if risk_level was elevated from LOW or MEDIUM to HIGH "
            "because overload_probability >= 0.50."
        )
    )
    sigma_source: str = Field(
        description=(
            "'route-level' if sigma was estimated from a per-route model evaluation; "
            "'mode-wide-fallback' if the mode-wide sigma was used instead."
        )
    )
    model_name: str = Field(
        description="Phase 4 model whose predictions were used (selected by lowest held-out RMSE)."
    )


class RiskAssessmentResponse(BaseModel):
    """Full route-level risk assessment response for a transport mode.

    Contains one RouteRiskRecordResponse per (route, test-timestamp) pair,
    sorted by (route_id, timestamp). Use this endpoint when you need
    per-observation detail.
    """

    mode: str = Field(description="Canonical transport mode ('RAILWAY' or 'BUS').")
    best_model_name: str = Field(description="Phase 4 model selected by lowest held-out RMSE.")
    capacity: int = Field(description="Per-vehicle passenger capacity for this mode.")
    mode_sigma: float = Field(
        description="Mode-wide uncertainty sigma from the multi-route model evaluation."
    )
    num_observations: int = Field(description="Total number of risk observations across all routes.")
    results: list[RouteRiskRecordResponse] = Field(
        description="Per-observation risk records sorted by (route_id, timestamp)."
    )


class LevelCountsResponse(BaseModel):
    """Count of observations at each risk level."""

    LOW: int
    MEDIUM: int
    HIGH: int
    CRITICAL: int


class RiskSummaryResponse(BaseModel):
    """Aggregated risk summary for a transport mode.

    Provides fleet-level statistics without per-observation detail.
    Use this endpoint for dashboard cards and high-level reporting.

    NOTE: All values are derived from the same synthetic demonstration dataset
    as the detailed endpoint. These are not real operational statistics.
    """

    mode: str = Field(description="Canonical transport mode ('RAILWAY' or 'BUS').")
    best_model_name: str = Field(description="Phase 4 model selected by lowest held-out RMSE.")
    capacity: int = Field(description="Per-vehicle passenger capacity for this mode.")
    mode_sigma: float = Field(description="Mode-wide uncertainty sigma.")
    num_routes_analyzed: int = Field(description="Number of distinct routes assessed.")
    num_observations: int = Field(
        description="Total test-partition observations across all routes."
    )
    highest_risk_route: str = Field(
        description="Route ID with the highest average risk score."
    )
    average_risk_score: float = Field(
        description="Mean risk score across all route observations (0–100)."
    )
    max_risk_score: float = Field(
        description="Maximum risk score across all route observations."
    )
    max_overload_probability: float = Field(
        description="Maximum P(demand > capacity) across all route observations."
    )
    level_counts: LevelCountsResponse = Field(
        description="Count of observations classified at each risk level."
    )
