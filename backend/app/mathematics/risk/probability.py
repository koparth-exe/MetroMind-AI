"""Analytical overload probability calculation for the MetroMind AI Risk Engine.

Mathematical Model
------------------
To account for the uncertainty in ML demand predictions, we model the
predicted demand as a normally distributed random variable:

    X ~ Normal(mu, sigma²)

where:
    mu    = predicted demand (from the best-performing Phase 4 regressor)
    sigma = standard deviation of held-out test-set residuals
            (i.e., std(y_true - y_pred) on the chronological test partition)

IMPORTANT — Why held-out residuals?
    Using training-set residuals would underestimate the true prediction
    uncertainty due to in-sample overfitting. The held-out test partition,
    which is strictly chronologically later than training data, provides an
    unbiased estimate of out-of-sample prediction error.

IMPORTANT — Modeling Assumption:
    The Gaussian approximation of demand prediction errors is a modeling
    assumption for this project. Real-world demand distributions may be
    skewed, bounded, or multimodal. This assumption is used for tractability
    and should be validated against real data before operational deployment.

Overload Probability
--------------------
P(demand > capacity) = P(X > capacity)
                     = 1 - Phi((capacity - mu) / sigma)

where Phi is the standard normal CDF. We use `scipy.stats.norm.sf`
(survival function = 1 - CDF) for numerical stability at extreme z-values.

Edge Cases
----------
- sigma <= SIGMA_DEGENERACY_THRESHOLD: The distribution collapses to a point
  mass. P(demand > capacity) = 1.0 if mu >= capacity, else 0.0.
- capacity <= 0: Physically invalid; raises ValueError immediately.
- negative predicted_demand: For probability purposes, demand is clamped to
  max(0, predicted_demand). The raw prediction is not hidden.
- Extreme z-values are handled naturally by scipy.stats.norm.sf.
"""

import math

from scipy.stats import norm

from app.mathematics.risk.thresholds import SIGMA_DEGENERACY_THRESHOLD


def calculate_overload_probability(
    predicted_demand: float,
    capacity: float,
    sigma: float,
) -> float:
    """Compute P(demand > capacity) under a Normal(predicted_demand, sigma²) model.

    The predicted demand is first clamped to max(0.0, predicted_demand) before
    computing the probability. Negative predictions are preserved in the raw
    output but treated as zero demand for probability purposes, because
    passenger demand cannot be physically negative.

    Args:
        predicted_demand: Point-estimate predicted passenger demand. May be
            negative (from linear regression extrapolation); clamped to 0.
        capacity: Nominal passenger capacity of the route (vehicle capacity).
            Must be strictly positive.
        sigma: Standard deviation of held-out prediction residuals (sigma ≥ 0).
            If sigma <= SIGMA_DEGENERACY_THRESHOLD, the distribution is
            degenerate and probability is assigned deterministically.

    Returns:
        Probability in [0.0, 1.0] that actual demand exceeds capacity.

    Raises:
        ValueError: If capacity is <= 0, or if sigma is negative.
    """
    if capacity <= 0.0:
        raise ValueError(
            f"Capacity must be strictly positive for overload probability calculation, "
            f"got {capacity}."
        )
    if sigma < 0.0:
        raise ValueError(
            f"Sigma (residual std) cannot be negative, got {sigma}."
        )
    if not math.isfinite(predicted_demand):
        raise ValueError(
            f"predicted_demand must be a finite number, got {predicted_demand}."
        )
    if not math.isfinite(capacity):
        raise ValueError(
            f"capacity must be a finite number, got {capacity}."
        )
    if not math.isfinite(sigma):
        raise ValueError(
            f"sigma must be a finite number, got {sigma}."
        )

    # Clamp demand to non-negative for physical interpretability.
    # Logically, a route cannot serve a negative number of passengers.
    effective_demand = max(0.0, predicted_demand)

    # Degenerate case: sigma is effectively zero — no prediction uncertainty.
    if sigma <= SIGMA_DEGENERACY_THRESHOLD:
        # Point mass at effective_demand: overload iff demand reaches capacity.
        return 1.0 if effective_demand >= capacity else 0.0

    # Compute the standardized z-score.
    # z = (capacity - mu) / sigma
    # P(X > capacity) = 1 - Phi(z) = norm.sf(z)
    z = (capacity - effective_demand) / sigma

    # scipy.stats.norm.sf handles extreme z-values gracefully (no overflow).
    probability = float(norm.sf(z))

    # Clamp to [0, 1] as a defensive guard against floating-point noise.
    return max(0.0, min(1.0, probability))


def estimate_sigma_from_residuals(residuals: list[float]) -> float:
    """Estimate the prediction uncertainty sigma from held-out residual values.

    Computes the population standard deviation of the residual list.
    This is used when the ResidualAnalysisResult.std_residual is not directly
    available and the raw residual list is provided instead.

    Args:
        residuals: List of held-out residuals (y_true - y_pred).

    Returns:
        Population standard deviation of the residuals. Returns 0.0 for
        empty or length-1 lists.
    """
    n = len(residuals)
    if n < 2:
        return 0.0
    mean = sum(residuals) / n
    variance = sum((r - mean) ** 2 for r in residuals) / n
    return math.sqrt(variance)
