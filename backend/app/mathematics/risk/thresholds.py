"""Centralized risk threshold constants for the MetroMind AI Risk Engine.

All numeric boundaries for utilization, risk scoring, and risk-level
classification are defined here. Centralizing them ensures that changing a
threshold requires editing only this file.

IMPORTANT — Modeling Assumptions
---------------------------------
These thresholds are initial project modeling choices, NOT empirically
calibrated values derived from real Mumbai transport data. The dataset is
synthetic demonstration data. Thresholds should be reviewed and adjusted
against real-world operational data before any operational deployment.

Why centralized?
    Scattered magic numbers make auditing, testing, and future calibration
    difficult. A single module makes the entire threshold surface visible.
"""

from enum import Enum


class RiskLevel(str, Enum):
    """Categorical risk classification for a transport route observation.

    Values represent progressive severity from safe operating conditions
    through complete overload.
    """

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


# ---------------------------------------------------------------------------
# Utilization Ratio Interpretation Thresholds
# ---------------------------------------------------------------------------
# These boundary values classify a raw utilization_ratio (demand / capacity)
# into descriptive operating bands. They are project-defined starting points.

#: Below this ratio → LOW utilization (comfortable headroom)
UTILIZATION_LOW_THRESHOLD: float = 0.70

#: Between LOW_THRESHOLD and this → MODERATE utilization
UTILIZATION_MODERATE_THRESHOLD: float = 0.85

#: Between MODERATE and this → HIGH utilization (approaching capacity)
UTILIZATION_HIGH_THRESHOLD: float = 1.00

#: Above HIGH_THRESHOLD → OVERLOAD (demand exceeds nominal capacity)
# (implicit: utilization_ratio > UTILIZATION_HIGH_THRESHOLD)


# ---------------------------------------------------------------------------
# Risk Score Thresholds  (0–100 composite score)
# ---------------------------------------------------------------------------
# These boundaries map a continuous composite risk_score to a RiskLevel.

#: risk_score in [0, SCORE_LOW_UPPER) → RiskLevel.LOW
SCORE_LOW_UPPER: float = 25.0

#: risk_score in [SCORE_LOW_UPPER, SCORE_MEDIUM_UPPER) → RiskLevel.MEDIUM
SCORE_MEDIUM_UPPER: float = 50.0

#: risk_score in [SCORE_MEDIUM_UPPER, SCORE_HIGH_UPPER) → RiskLevel.HIGH
SCORE_HIGH_UPPER: float = 75.0

#: risk_score in [SCORE_HIGH_UPPER, 100] → RiskLevel.CRITICAL


# ---------------------------------------------------------------------------
# Overload Probability Elevation Threshold
# ---------------------------------------------------------------------------
# If the probability of overload meets or exceeds this value, the risk level
# is elevated to at least HIGH regardless of the composite score. Rationale:
# a 50% probability of exceeding capacity is operationally significant and
# must not be classified as LOW or MEDIUM.

#: Minimum P(demand > capacity) that forces risk level >= HIGH
OVERLOAD_PROBABILITY_ELEVATION_THRESHOLD: float = 0.50


# ---------------------------------------------------------------------------
# Risk Score Composition Weights
# ---------------------------------------------------------------------------
# The composite risk score is a weighted combination of two components:
#
#   utilization_score = min(utilization_ratio * 100, 100)
#   probability_score = overload_probability * 100
#   risk_score        = W_UTILIZATION * utilization_score
#                     + W_PROBABILITY * probability_score
#
# Rationale for 0.60 / 0.40 split:
#   - Utilization ratio is a *direct observable* (predicted demand / capacity)
#     and should carry more weight in the overall assessment.
#   - Overload probability captures *demand uncertainty* and modifies the
#     assessment to account for prediction error.
# These weights are documented project choices, not empirically calibrated.

#: Weight applied to the utilization component of the risk score.
W_UTILIZATION: float = 0.60

#: Weight applied to the overload probability component of the risk score.
W_PROBABILITY: float = 0.40

# Assertion: weights must sum to 1.0
assert abs(W_UTILIZATION + W_PROBABILITY - 1.0) < 1e-9, (
    "Risk score weights must sum to 1.0"
)


# ---------------------------------------------------------------------------
# Numerical Stability
# ---------------------------------------------------------------------------
#: Minimum absolute sigma value treated as meaningful; below this, sigma
#: is considered degenerate and overload_probability is assigned directly.
SIGMA_DEGENERACY_THRESHOLD: float = 1e-6
