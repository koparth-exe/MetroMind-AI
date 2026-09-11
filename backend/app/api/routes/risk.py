"""FastAPI endpoints for the MetroMind AI Phase 5 Risk Engine.

Endpoints
---------
GET /api/risk/{mode}
    Detailed per-observation risk results for all routes of the given mode.
    Returns one record per (route, test-timestamp) pair.

GET /api/risk/{mode}/summary
    Aggregated risk statistics for the given mode.
    Returns fleet-level summary without per-observation detail.

Mode Isolation
--------------
RAILWAY and BUS are strictly isolated:
    - /api/risk/RAILWAY uses only Railway data, routes, and capacity.
    - /api/risk/BUS uses only Bus data, routes, and capacity.
    - Cross-mode fallback is not permitted under any circumstance.

Error Handling
--------------
- Invalid mode → HTTP 422 with a descriptive error message.
- Insufficient data or calculation failures → HTTP 422.
- Internal errors → HTTP 500 (implementation details not exposed).

The existing FastAPI exception handlers in app.core.exceptions handle the
last category. ValueError from the service layer is caught and re-raised
as HTTP 422 here.
"""

from fastapi import APIRouter, HTTPException, status

from app.domain.transport.enums import TransportMode
from app.domain.transport.registry import transport_registry
from app.models.math import DynamicRiskInput, DynamicRiskResult
from app.models.risk import (
    LevelCountsResponse,
    RiskAssessmentResponse,
    RiskSummaryResponse,
    RouteRiskRecordResponse,
)
from app.services.math_service import math_engine_service
from app.services.risk_service import risk_engine_service

router = APIRouter(prefix="/risk", tags=["risk"])


def _resolve_mode_or_422(mode: str) -> TransportMode:
    """Normalize mode string or raise HTTP 422 for unsupported values."""
    try:
        return transport_registry.require_mode(mode)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc


@router.get("/{mode}", response_model=RiskAssessmentResponse)
def get_risk_assessment(mode: str) -> RiskAssessmentResponse:
    """Compute and return per-observation crowding risk for all routes.

    Returns one record per (route_id, test-partition timestamp) pair,
    sorted by (route_id, timestamp).

    The predicted demand comes from the Phase 4 best-performing regressor
    (selected by lowest held-out RMSE). Uncertainty is estimated from the
    standard deviation of held-out test-set residuals.

    NOTE: Results are derived from synthetic demonstration data and must not
    be treated as real operational safety assessments.
    """
    resolved_mode = _resolve_mode_or_422(mode)
    try:
        mode_result = risk_engine_service.compute_mode_risk(mode=resolved_mode)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc

    results = [
        RouteRiskRecordResponse(
            route_id=r.route_id,
            timestamp=r.timestamp.isoformat(),
            predicted_demand_raw=r.predicted_demand_raw,
            effective_demand=r.effective_demand,
            capacity=r.capacity,
            utilization_ratio=r.utilization_ratio,
            utilization_percentage=r.utilization_percentage,
            utilization_label=r.utilization_label,
            uncertainty_sigma=r.uncertainty_sigma,
            overload_probability=r.overload_probability,
            risk_score=r.risk_score,
            risk_level=r.risk_level.value,
            level_elevated=r.level_elevated,
            sigma_source=r.sigma_source,
            model_name=r.model_name,
        )
        for r in mode_result.route_results
    ]

    return RiskAssessmentResponse(
        mode=mode_result.mode,
        best_model_name=mode_result.best_model_name,
        capacity=mode_result.capacity,
        mode_sigma=mode_result.mode_sigma,
        num_observations=len(results),
        results=results,
    )


@router.get("/{mode}/summary", response_model=RiskSummaryResponse)
def get_risk_summary(mode: str) -> RiskSummaryResponse:
    """Compute and return aggregated risk statistics for a transport mode.

    Provides fleet-level summary without per-observation detail:
    - mode
    - best model name (by lowest held-out RMSE)
    - capacity per vehicle
    - number of routes analyzed
    - highest-risk route (by average risk score)
    - average and maximum risk scores
    - maximum overload probability
    - count of observations at each risk level

    NOTE: Results are derived from synthetic demonstration data and must not
    be treated as real operational safety assessments.
    """
    resolved_mode = _resolve_mode_or_422(mode)
    try:
        summary = risk_engine_service.compute_mode_risk_summary(mode=resolved_mode)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc

    level_counts_raw = summary["level_counts"]
    level_counts = LevelCountsResponse(
        LOW=level_counts_raw.get("LOW", 0),
        MEDIUM=level_counts_raw.get("MEDIUM", 0),
        HIGH=level_counts_raw.get("HIGH", 0),
        CRITICAL=level_counts_raw.get("CRITICAL", 0),
    )

    return RiskSummaryResponse(
        mode=summary["mode"],
        best_model_name=summary["best_model_name"],
        capacity=summary["capacity"],
        mode_sigma=summary["mode_sigma"],
        num_routes_analyzed=summary["num_routes_analyzed"],
        num_observations=summary["num_observations"],
        highest_risk_route=summary["highest_risk_route"],
        average_risk_score=summary["average_risk_score"],
        max_risk_score=summary["max_risk_score"],
        max_overload_probability=summary["max_overload_probability"],
        level_counts=level_counts,
    )


@router.post("/{mode}/calculate", response_model=DynamicRiskResult)
def calculate_dynamic_risk_by_mode(
    mode: str, input_data: DynamicRiskInput
) -> DynamicRiskResult:
    """Calculate interactive exceedance probabilities and risk levels from residual uncertainty."""
    resolved_mode = _resolve_mode_or_422(mode)
    try:
        return math_engine_service.calculate_dynamic_risk(resolved_mode, input_data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc

