"""Unit tests for the Phase 5 Risk Engine probability calculations.

Tests cover:
- Normal distribution overload probability (known analytical values)
- Edge cases: sigma=0, sigma very small, sigma negative
- Edge cases: capacity <= 0
- Edge cases: negative predicted demand (clamped to 0)
- Non-finite inputs
- Numerical boundary values (z = 0 → P ≈ 0.5)
- Sigma estimation from residuals
"""

import math
import pytest
from scipy.stats import norm

from app.mathematics.risk.probability import (
    calculate_overload_probability,
    estimate_sigma_from_residuals,
)


# ---------------------------------------------------------------------------
# Analytical probability tests
# ---------------------------------------------------------------------------

class TestCalculateOverloadProbability:

    def test_when_demand_equals_capacity_probability_is_approx_0_5(self):
        """P(X > capacity) ≈ 0.5 when predicted_demand == capacity and sigma > 0.

        Under Normal(mu, sigma²), P(X > mu) = 0.5 exactly.
        Here mu = capacity, so z = 0 → P = norm.sf(0) = 0.5.
        """
        p = calculate_overload_probability(
            predicted_demand=1000.0,
            capacity=1000.0,
            sigma=200.0,
        )
        assert abs(p - 0.5) < 1e-6, f"Expected ~0.5 but got {p}"

    def test_demand_well_below_capacity_gives_low_probability(self):
        """When demand is far below capacity, overload probability should be near 0."""
        # z = (3000 - 500) / 100 = 25 → P ≈ 0
        p = calculate_overload_probability(
            predicted_demand=500.0,
            capacity=3000.0,
            sigma=100.0,
        )
        assert p < 1e-6, f"Expected near-zero but got {p}"

    def test_demand_well_above_capacity_gives_high_probability(self):
        """When demand is far above capacity, overload probability should be near 1."""
        # z = (3000 - 6000) / 100 = -30 → P ≈ 1
        p = calculate_overload_probability(
            predicted_demand=6000.0,
            capacity=3000.0,
            sigma=100.0,
        )
        assert p > 1.0 - 1e-6, f"Expected near-1 but got {p}"

    def test_known_z_score_matches_scipy(self):
        """Verify against scipy reference for a known z-value."""
        mu = 800.0
        capacity = 1000.0
        sigma = 100.0
        z = (capacity - mu) / sigma  # z = 2.0
        expected = float(norm.sf(z))  # ≈ 0.02275
        p = calculate_overload_probability(mu, capacity, sigma)
        assert abs(p - expected) < 1e-9, f"Expected {expected} but got {p}"

    def test_negative_predicted_demand_is_clamped_to_zero(self):
        """Negative predictions are clamped to 0 for probability calculation.

        If predicted_demand = -500 and capacity = 3000, effective_demand = 0.
        z = (3000 - 0) / 100 = 30 → P ≈ 0.
        """
        p = calculate_overload_probability(
            predicted_demand=-500.0,
            capacity=3000.0,
            sigma=100.0,
        )
        # Also compute what we'd get with demand clamped to 0
        expected = calculate_overload_probability(0.0, 3000.0, 100.0)
        assert abs(p - expected) < 1e-12, (
            f"Negative demand should produce same result as clamped=0: {p} vs {expected}"
        )

    def test_sigma_zero_overload_if_demand_above_capacity(self):
        """When sigma=0, probability is 1 if demand >= capacity, else 0."""
        p_above = calculate_overload_probability(
            predicted_demand=3500.0,
            capacity=3000.0,
            sigma=0.0,
        )
        assert p_above == 1.0, f"Expected 1.0 but got {p_above}"

    def test_sigma_zero_no_overload_if_demand_below_capacity(self):
        """When sigma=0, probability is 0 if demand < capacity."""
        p_below = calculate_overload_probability(
            predicted_demand=2000.0,
            capacity=3000.0,
            sigma=0.0,
        )
        assert p_below == 0.0, f"Expected 0.0 but got {p_below}"

    def test_sigma_zero_exact_equality_returns_one(self):
        """When sigma=0 and demand exactly equals capacity, probability=1."""
        p = calculate_overload_probability(
            predicted_demand=3000.0,
            capacity=3000.0,
            sigma=0.0,
        )
        assert p == 1.0

    def test_very_small_sigma_high_demand_gives_near_one(self):
        """With tiny sigma, demand slightly above capacity → probability near 1."""
        p = calculate_overload_probability(
            predicted_demand=3001.0,
            capacity=3000.0,
            sigma=1e-3,
        )
        assert p > 0.999, f"Expected near-1 but got {p}"

    def test_very_small_sigma_below_demand_gives_near_zero(self):
        """With tiny sigma, demand slightly below capacity → probability near 0."""
        p = calculate_overload_probability(
            predicted_demand=2999.0,
            capacity=3000.0,
            sigma=1e-3,
        )
        assert p < 0.001, f"Expected near-0 but got {p}"

    def test_probability_is_between_zero_and_one(self):
        """Probability output must always be in [0, 1]."""
        for demand, sigma in [(0, 1), (5000, 100), (-100, 50), (3000, 0.001)]:
            p = calculate_overload_probability(
                predicted_demand=float(demand),
                capacity=3000.0,
                sigma=float(sigma),
            )
            assert 0.0 <= p <= 1.0, f"Out of bounds: demand={demand}, sigma={sigma} → {p}"

    def test_zero_capacity_raises_value_error(self):
        """Capacity = 0 is invalid and must raise ValueError."""
        with pytest.raises(ValueError, match="Capacity must be strictly positive"):
            calculate_overload_probability(1000.0, 0.0, 100.0)

    def test_negative_capacity_raises_value_error(self):
        """Negative capacity is invalid and must raise ValueError."""
        with pytest.raises(ValueError, match="Capacity must be strictly positive"):
            calculate_overload_probability(1000.0, -500.0, 100.0)

    def test_negative_sigma_raises_value_error(self):
        """Negative sigma is not physically meaningful and must raise ValueError."""
        with pytest.raises(ValueError, match="Sigma .* cannot be negative"):
            calculate_overload_probability(1000.0, 3000.0, -1.0)

    def test_nan_demand_raises_value_error(self):
        """Non-finite predicted_demand must raise ValueError."""
        with pytest.raises(ValueError, match="finite number"):
            calculate_overload_probability(float("nan"), 3000.0, 100.0)

    def test_inf_demand_raises_value_error(self):
        """Infinite predicted_demand must raise ValueError."""
        with pytest.raises(ValueError, match="finite number"):
            calculate_overload_probability(float("inf"), 3000.0, 100.0)

    def test_inf_capacity_raises_value_error(self):
        """Infinite capacity must raise ValueError."""
        with pytest.raises(ValueError, match="finite number"):
            calculate_overload_probability(1000.0, float("inf"), 100.0)

    def test_inf_sigma_raises_value_error(self):
        """Infinite sigma must raise ValueError."""
        with pytest.raises(ValueError, match="finite number"):
            calculate_overload_probability(1000.0, 3000.0, float("inf"))


# ---------------------------------------------------------------------------
# Sigma estimation tests
# ---------------------------------------------------------------------------

class TestEstimateSigmaFromResiduals:

    def test_known_population_std(self):
        """Verify sigma estimation against a known population std."""
        residuals = [1.0, -1.0, 1.0, -1.0]
        # mean = 0, variance = (1+1+1+1)/4 = 1, std = 1
        sigma = estimate_sigma_from_residuals(residuals)
        assert abs(sigma - 1.0) < 1e-10

    def test_empty_residuals_returns_zero(self):
        """Empty residual list cannot produce a meaningful sigma → returns 0."""
        assert estimate_sigma_from_residuals([]) == 0.0

    def test_single_residual_returns_zero(self):
        """Single residual has no variance → returns 0."""
        assert estimate_sigma_from_residuals([5.0]) == 0.0

    def test_constant_residuals_returns_zero(self):
        """Constant residuals have zero variance → returns 0."""
        sigma = estimate_sigma_from_residuals([3.0, 3.0, 3.0, 3.0])
        assert sigma < 1e-10

    def test_non_negative_output(self):
        """Sigma must always be non-negative."""
        residuals = [-10.0, 5.0, 3.0, -2.0, 8.0]
        sigma = estimate_sigma_from_residuals(residuals)
        assert sigma >= 0.0
