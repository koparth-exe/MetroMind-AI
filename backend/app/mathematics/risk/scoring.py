"""Risk score computation and level classification for the MetroMind AI Risk Engine.

Risk Score Formula
------------------
The composite risk score (0–100) is a weighted combination of two components:

    1. Utilization Score:
       utilization_score = min(utilization_ratio * 100, 100.0)

       Maps capacity utilization (0 → ∞) to [0, 100], capped at 100.
       Utilization ratio = max(0, predicted_demand) / capacity.

    2. Probability Score:
       probability_score = overload_probability * 100

       Maps P(demand > capacity) ∈ [0, 1] to [0, 100].

    Composite:
       risk_score = W_UTILIZATION * utilization_score
                  + W_PROBABILITY * probability_score

    where W_UTILIZATION = 0.60 and W_PROBABILITY = 0.40 (see thresholds.py).

Risk Level Classification
--------------------------
    risk_score ∈ [0, 25)   → LOW
    risk_score ∈ [25, 50)  → MEDIUM
    risk_score ∈ [50, 75)  → HIGH
    risk_score ∈ [75, 100] → CRITICAL

    Elevation Rule:
    If overload_probability >= OVERLOAD_PROBABILITY_ELEVATION_THRESHOLD (0.50)
    AND the score-based level is LOW or MEDIUM, the level is elevated to HIGH.
    Rationale: a ≥50% probability of exceeding capacity is operationally
    significant and must not be dismissed as low or medium risk.

Utilization Interpretation
--------------------------
    utilization_ratio < 0.70  → "Low utilization"
    0.70 ≤ ratio < 0.85       → "Moderate utilization"
    0.85 ≤ ratio < 1.00       → "High utilization"
    ratio ≥ 1.00              → "Overload"

All thresholds and weights are defined in `thresholds.py`.
"""

from dataclasses import dataclass

from app.mathematics.risk.thresholds import (
    OVERLOAD_PROBABILITY_ELEVATION_THRESHOLD,
    SCORE_HIGH_UPPER,
    SCORE_LOW_UPPER,
    SCORE_MEDIUM_UPPER,
    UTILIZATION_HIGH_THRESHOLD,
    UTILIZATION_LOW_THRESHOLD,
    UTILIZATION_MODERATE_THRESHOLD,
    W_PROBABILITY,
    W_UTILIZATION,
    RiskLevel,
)


@dataclass(frozen=True)
class UtilizationResult:
    """Capacity utilization metrics for a single demand observation."""

    predicted_demand_raw: float
    """Raw predicted demand value from the ML model (may be negative)."""

    effective_demand: float
    """Non-negative demand used for risk calculations (max(0, predicted_demand_raw))."""

    capacity: float
    """Nominal route vehicle capacity."""

    utilization_ratio: float
    """effective_demand / capacity (can exceed 1.0 in overload)."""

    utilization_percentage: float
    """utilization_ratio * 100."""

    utilization_label: str
    """Descriptive utilization band (e.g. 'Low utilization', 'Overload')."""


@dataclass(frozen=True)
class RiskScoreResult:
    """Composite risk score and classified risk level."""

    utilization_score: float
    """Utilization component contribution (0–100)."""

    probability_score: float
    """Overload-probability component contribution (0–100)."""

    risk_score: float
    """Weighted composite score in [0.0, 100.0]."""

    risk_level: RiskLevel
    """Categorical risk classification after elevation rule applied."""

    level_elevated: bool
    """True if risk level was elevated by the overload probability rule."""


def calculate_utilization(
    predicted_demand: float,
    capacity: float,
) -> UtilizationResult:
    """Compute capacity utilization metrics for a single demand observation.

    Args:
        predicted_demand: Raw ML-predicted demand (may be negative).
        capacity: Positive nominal route vehicle capacity.

    Returns:
        UtilizationResult with ratio, percentage, and descriptive label.

    Raises:
        ValueError: If capacity is not strictly positive.
    """
    if capacity <= 0.0:
        raise ValueError(
            f"Capacity must be strictly positive for utilization calculation, "
            f"got {capacity}."
        )

    effective_demand = max(0.0, predicted_demand)
    ratio = effective_demand / capacity
    percentage = ratio * 100.0

    # Assign interpretive utilization band
    if ratio < UTILIZATION_LOW_THRESHOLD:
        label = "Low utilization"
    elif ratio < UTILIZATION_MODERATE_THRESHOLD:
        label = "Moderate utilization"
    elif ratio < UTILIZATION_HIGH_THRESHOLD:
        label = "High utilization"
    else:
        label = "Overload"

    return UtilizationResult(
        predicted_demand_raw=predicted_demand,
        effective_demand=round(effective_demand, 4),
        capacity=capacity,
        utilization_ratio=round(ratio, 6),
        utilization_percentage=round(percentage, 4),
        utilization_label=label,
    )


def calculate_risk_score(
    utilization_ratio: float,
    overload_probability: float,
) -> RiskScoreResult:
    """Compute composite risk score (0–100) and classify into a RiskLevel.

    Formula:
        utilization_score = min(utilization_ratio * 100, 100.0)
        probability_score = overload_probability * 100
        risk_score = W_UTILIZATION * utilization_score
                   + W_PROBABILITY * probability_score

    Risk Level Classification:
        [0, 25)   → LOW
        [25, 50)  → MEDIUM
        [50, 75)  → HIGH
        [75, 100] → CRITICAL

    Elevation Rule:
        If overload_probability >= 0.50 and score-based level is LOW or
        MEDIUM, elevate to HIGH.

    Args:
        utilization_ratio: Capacity utilization ratio (effective_demand / capacity).
            Values > 1.0 indicate overload and are clamped to 100 in scoring.
        overload_probability: P(demand > capacity) in [0.0, 1.0].

    Returns:
        RiskScoreResult with component scores, composite score, and level.
    """
    # Clamp to [0, 1] to defend against floating-point noise
    overload_probability = max(0.0, min(1.0, overload_probability))
    utilization_ratio = max(0.0, utilization_ratio)

    utilization_score = min(utilization_ratio * 100.0, 100.0)
    probability_score = overload_probability * 100.0

    risk_score = W_UTILIZATION * utilization_score + W_PROBABILITY * probability_score
    risk_score = max(0.0, min(100.0, risk_score))

    # Classify by score boundaries
    if risk_score < SCORE_LOW_UPPER:
        base_level = RiskLevel.LOW
    elif risk_score < SCORE_MEDIUM_UPPER:
        base_level = RiskLevel.MEDIUM
    elif risk_score < SCORE_HIGH_UPPER:
        base_level = RiskLevel.HIGH
    else:
        base_level = RiskLevel.CRITICAL

    # Apply elevation rule: high overload probability must not be LOW/MEDIUM
    elevated = False
    if (
        overload_probability >= OVERLOAD_PROBABILITY_ELEVATION_THRESHOLD
        and base_level in (RiskLevel.LOW, RiskLevel.MEDIUM)
    ):
        final_level = RiskLevel.HIGH
        elevated = True
    else:
        final_level = base_level

    return RiskScoreResult(
        utilization_score=round(utilization_score, 4),
        probability_score=round(probability_score, 4),
        risk_score=round(risk_score, 4),
        risk_level=final_level,
        level_elevated=elevated,
    )
