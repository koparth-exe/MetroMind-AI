"""Core Risk Engine for MetroMind AI Phase 5.

The RiskEngine combines:
    - Phase 4 ML predictions (from ModelComparisonResult.evaluations)
    - Held-out residual sigma (uncertainty estimate)
    - Capacity (from the domain fleet layer)
    - Route identity and timestamp (for temporal, route-level analysis)

to produce per-observation risk records with:
    - utilization ratio and percentage
    - overload probability
    - composite risk score (0–100)
    - risk level classification (LOW / MEDIUM / HIGH / CRITICAL)

Design
------
This module is a pure mathematical transformer — it does NOT train models,
does NOT access databases, and does NOT make HTTP calls. All inputs are
supplied by the caller (RiskEngineService).

Sigma Selection Strategy
------------------------
We prefer route-level sigma (from a per-route model evaluation) because it
reflects route-specific prediction error. If route-level sigma is below a
useful minimum (due to few test samples) or unavailable, we fall back to the
mode-wide sigma from the full multi-route evaluation. This is documented as
a modeling fallback.

Negative Prediction Handling
-----------------------------
Linear regression can produce negative predictions for low-demand periods.
Demand cannot physically be negative. The risk engine:
    1. Preserves the raw prediction in the output for transparency.
    2. Uses max(0, predicted_demand) for utilization and probability calcs.
    3. Does NOT silently alter or hide the raw ML prediction value.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Any

from app.mathematics.risk.probability import calculate_overload_probability
from app.mathematics.risk.scoring import calculate_risk_score, calculate_utilization
from app.mathematics.risk.thresholds import RiskLevel, SIGMA_DEGENERACY_THRESHOLD


@dataclass(frozen=True)
class RouteRiskResult:
    """Risk assessment for a single (route, timestamp) observation.

    All numeric values are rounded to 4–6 decimal places where appropriate.
    The `predicted_demand_raw` field preserves the unmodified ML prediction.
    """

    route_id: str
    """Transit route identifier (e.g. 'R1', 'B2')."""

    timestamp: datetime
    """Observation timestamp from the Phase 4 test partition."""

    predicted_demand_raw: float
    """Unmodified ML model prediction. May be negative (preserved for transparency)."""

    effective_demand: float
    """max(0, predicted_demand_raw) used for risk calculations."""

    capacity: int
    """Nominal per-vehicle passenger capacity from the domain fleet layer."""

    utilization_ratio: float
    """effective_demand / capacity. Values > 1.0 indicate overload."""

    utilization_percentage: float
    """utilization_ratio * 100."""

    utilization_label: str
    """Descriptive utilization band ('Low utilization', 'Moderate utilization',
    'High utilization', 'Overload')."""

    uncertainty_sigma: float
    """Estimated prediction uncertainty: std of held-out test residuals."""

    overload_probability: float
    """P(demand > capacity) under Normal(effective_demand, sigma²) model."""

    risk_score: float
    """Composite risk score in [0.0, 100.0]."""

    risk_level: RiskLevel
    """Categorical risk classification after elevation rule."""

    level_elevated: bool
    """True if risk level was elevated by the high-overload-probability rule."""

    sigma_source: str
    """Describes which sigma was used: 'route-level' or 'mode-wide-fallback'."""

    model_name: str
    """Name of the Phase 4 model whose predictions were used."""


def assess_route_risk(
    route_id: str,
    timestamp: datetime,
    predicted_demand: float,
    capacity: int,
    sigma: float,
    sigma_source: str,
    model_name: str,
) -> RouteRiskResult:
    """Compute full risk assessment for a single (route, timestamp) observation.

    Args:
        route_id: Route identifier.
        timestamp: Observation datetime from the test partition.
        predicted_demand: Raw ML predicted demand (may be negative).
        capacity: Positive route vehicle capacity.
        sigma: Estimated prediction uncertainty (held-out residual std).
        sigma_source: Description of where sigma came from.
        model_name: Name of the model that produced predicted_demand.

    Returns:
        RouteRiskResult with all risk dimensions populated.

    Raises:
        ValueError: If capacity <= 0 or sigma < 0.
    """
    # Compute utilization (handles negative demand internally)
    util = calculate_utilization(predicted_demand, capacity)

    # Compute overload probability
    overload_prob = calculate_overload_probability(
        predicted_demand=predicted_demand,
        capacity=float(capacity),
        sigma=sigma,
    )

    # Compute composite risk score and level
    score_result = calculate_risk_score(
        utilization_ratio=util.utilization_ratio,
        overload_probability=overload_prob,
    )

    return RouteRiskResult(
        route_id=route_id,
        timestamp=timestamp,
        predicted_demand_raw=round(predicted_demand, 4),
        effective_demand=util.effective_demand,
        capacity=capacity,
        utilization_ratio=util.utilization_ratio,
        utilization_percentage=util.utilization_percentage,
        utilization_label=util.utilization_label,
        uncertainty_sigma=round(sigma, 4),
        overload_probability=round(overload_prob, 6),
        risk_score=score_result.risk_score,
        risk_level=score_result.risk_level,
        level_elevated=score_result.level_elevated,
        sigma_source=sigma_source,
        model_name=model_name,
    )


@dataclass(frozen=True)
class ModeRiskResult:
    """Complete risk assessment result for a single transport mode.

    Contains all per-observation RouteRiskResult entries sorted by
    (route_id, timestamp) for deterministic ordering.
    """

    mode: str
    """Canonical transport mode ('RAILWAY' or 'BUS')."""

    route_results: list[RouteRiskResult]
    """Per-observation risk records sorted by (route_id, timestamp)."""

    best_model_name: str
    """Phase 4 model selected by lowest held-out RMSE."""

    mode_sigma: float
    """Mode-wide uncertainty sigma (from multi-route model evaluation)."""

    capacity: int
    """Per-vehicle capacity for this mode."""

    def count_by_level(self) -> dict[str, int]:
        """Count observations at each risk level."""
        counts: dict[str, int] = {level.value: 0 for level in RiskLevel}
        for r in self.route_results:
            counts[r.risk_level.value] += 1
        return counts


def select_sigma(
    route_sigma: float,
    mode_sigma: float,
    min_useful_sigma: float = SIGMA_DEGENERACY_THRESHOLD,
) -> tuple[float, str]:
    """Select the best available sigma for uncertainty estimation.

    Prefer route-level sigma if it exceeds the degeneracy threshold,
    otherwise fall back to mode-wide sigma. This ensures we never use
    a degenerate (near-zero) route-level sigma when a more informative
    mode-wide estimate is available.

    Args:
        route_sigma: Sigma from per-route model evaluation.
        mode_sigma: Sigma from full mode-wide model evaluation.
        min_useful_sigma: Minimum sigma to be considered non-degenerate.

    Returns:
        (sigma_value, sigma_source_description) tuple.
    """
    if route_sigma > min_useful_sigma:
        return route_sigma, "route-level"
    if mode_sigma > min_useful_sigma:
        return mode_sigma, "mode-wide-fallback"
    # Both are degenerate — use mode_sigma (at least consistent)
    return mode_sigma, "mode-wide-fallback"
