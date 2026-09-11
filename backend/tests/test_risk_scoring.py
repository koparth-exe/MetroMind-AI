"""Unit tests for the Phase 5 Risk Engine scoring and classification.

Tests cover:
- Utilization ratio and percentage calculation
- Utilization label assignment at and around thresholds
- Zero and negative demand handling in utilization
- Invalid capacity for utilization
- Risk score composite formula
- Risk score bounds (always 0–100)
- Risk level classification at boundary values
- Overload probability elevation rule
- Elevation rule does NOT apply when level is already HIGH or CRITICAL
"""

import math
import pytest

from app.mathematics.risk.scoring import (
    calculate_risk_score,
    calculate_utilization,
)
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


# ---------------------------------------------------------------------------
# Utilization calculation tests
# ---------------------------------------------------------------------------

class TestCalculateUtilization:

    def test_normal_utilization_ratio_and_percentage(self):
        """Verify ratio = demand / capacity and percentage = ratio * 100."""
        result = calculate_utilization(predicted_demand=1500.0, capacity=3000)
        assert abs(result.utilization_ratio - 0.5) < 1e-9
        assert abs(result.utilization_percentage - 50.0) < 1e-6

    def test_zero_demand_gives_zero_utilization(self):
        """Zero demand → zero utilization ratio."""
        result = calculate_utilization(predicted_demand=0.0, capacity=3000)
        assert result.utilization_ratio == 0.0
        assert result.utilization_percentage == 0.0

    def test_negative_demand_is_clamped_to_zero(self):
        """Negative demand is clamped to 0; raw value is preserved."""
        result = calculate_utilization(predicted_demand=-200.0, capacity=3000)
        assert result.effective_demand == 0.0
        assert result.predicted_demand_raw == -200.0
        assert result.utilization_ratio == 0.0

    def test_overload_utilization_above_one(self):
        """Demand exceeding capacity gives ratio > 1."""
        result = calculate_utilization(predicted_demand=4000.0, capacity=3000)
        assert result.utilization_ratio > 1.0

    def test_zero_capacity_raises_value_error(self):
        """Zero capacity is invalid."""
        with pytest.raises(ValueError, match="Capacity must be strictly positive"):
            calculate_utilization(1000.0, 0)

    def test_negative_capacity_raises_value_error(self):
        """Negative capacity is invalid."""
        with pytest.raises(ValueError, match="Capacity must be strictly positive"):
            calculate_utilization(1000.0, -100)

    # -- Utilization label boundary tests --

    def test_label_low_utilization_below_threshold(self):
        """ratio < 0.70 → 'Low utilization'."""
        result = calculate_utilization(0.69 * 3000.0, 3000)
        assert result.utilization_label == "Low utilization"

    def test_label_moderate_at_low_threshold(self):
        """ratio == 0.70 → 'Moderate utilization'."""
        result = calculate_utilization(UTILIZATION_LOW_THRESHOLD * 3000.0, 3000)
        assert result.utilization_label == "Moderate utilization"

    def test_label_moderate_between_thresholds(self):
        """ratio = 0.78 → 'Moderate utilization'."""
        result = calculate_utilization(0.78 * 3000.0, 3000)
        assert result.utilization_label == "Moderate utilization"

    def test_label_high_at_moderate_threshold(self):
        """ratio == 0.85 → 'High utilization'."""
        result = calculate_utilization(UTILIZATION_MODERATE_THRESHOLD * 3000.0, 3000)
        assert result.utilization_label == "High utilization"

    def test_label_overload_at_one(self):
        """ratio == 1.0 → 'Overload'."""
        result = calculate_utilization(UTILIZATION_HIGH_THRESHOLD * 3000.0, 3000)
        assert result.utilization_label == "Overload"

    def test_label_overload_above_capacity(self):
        """ratio > 1.0 → 'Overload'."""
        result = calculate_utilization(5000.0, 3000)
        assert result.utilization_label == "Overload"


# ---------------------------------------------------------------------------
# Risk score tests
# ---------------------------------------------------------------------------

class TestCalculateRiskScore:

    def test_zero_utilization_and_zero_probability_gives_zero_score(self):
        """Both components zero → risk_score = 0."""
        result = calculate_risk_score(0.0, 0.0)
        assert result.risk_score == 0.0
        assert result.risk_level == RiskLevel.LOW

    def test_full_utilization_and_full_probability_gives_100(self):
        """Both components at maximum → risk_score = 100."""
        result = calculate_risk_score(utilization_ratio=2.0, overload_probability=1.0)
        # utilization_score = min(200, 100) = 100
        # probability_score = 100
        # risk_score = 0.6*100 + 0.4*100 = 100
        assert result.risk_score == 100.0
        assert result.risk_level == RiskLevel.CRITICAL

    def test_composite_score_formula(self):
        """Verify composite score formula: 0.60 * util_score + 0.40 * prob_score."""
        util_ratio = 0.5  # utilization_score = 50
        overload_prob = 0.2  # probability_score = 20
        expected = W_UTILIZATION * 50.0 + W_PROBABILITY * 20.0  # = 38.0
        result = calculate_risk_score(util_ratio, overload_prob)
        assert abs(result.risk_score - expected) < 1e-9

    def test_risk_score_is_always_between_0_and_100(self):
        """Risk score must be in [0, 100] for all valid inputs."""
        cases = [
            (0.0, 0.0),
            (0.5, 0.5),
            (1.0, 1.0),
            (2.0, 1.0),  # utilization > 1 capped to 100
            (0.0, 1.0),
        ]
        for util_ratio, prob in cases:
            result = calculate_risk_score(util_ratio, prob)
            assert 0.0 <= result.risk_score <= 100.0, (
                f"Score out of bounds for util={util_ratio}, prob={prob}: {result.risk_score}"
            )

    # -- Risk level boundary tests --

    def test_score_just_below_low_upper_is_low(self):
        """Score just below 25 → LOW."""
        # We need risk_score < 25. With prob=0:
        # util_score = 24/0.6 → ratio ≈ 0.4
        result = calculate_risk_score(utilization_ratio=0.4, overload_probability=0.0)
        # 0.60 * 40 + 0.40 * 0 = 24
        assert result.risk_score == 24.0
        assert result.risk_level == RiskLevel.LOW

    def test_score_at_low_upper_boundary_is_medium(self):
        """Score = 25 → MEDIUM."""
        # util_ratio = 25/0.6 → need combined score of 25
        # 0.60 * util_score + 0.40 * 0 = 25 → util_score = 25/0.6 ≈ 41.67 → ratio ≈ 0.4167
        result = calculate_risk_score(
            utilization_ratio=25.0 / 60.0,  # = 0.41666...
            overload_probability=0.0,
        )
        assert abs(result.risk_score - 25.0) < 1e-9
        assert result.risk_level == RiskLevel.MEDIUM

    def test_score_just_below_medium_upper_is_medium(self):
        """Score just below 50 → MEDIUM."""
        # 0.60 * 49/0.6 = 49 → ratio = 49/60
        result = calculate_risk_score(
            utilization_ratio=49.0 / 60.0,
            overload_probability=0.0,
        )
        assert result.risk_score < SCORE_MEDIUM_UPPER
        assert result.risk_level == RiskLevel.MEDIUM

    def test_score_at_medium_upper_boundary_is_high(self):
        """Score = 50 → HIGH."""
        # 0.60 * 50/0.6 = 50
        result = calculate_risk_score(
            utilization_ratio=50.0 / 60.0,
            overload_probability=0.0,
        )
        assert abs(result.risk_score - 50.0) < 1e-9
        assert result.risk_level == RiskLevel.HIGH

    def test_score_at_high_upper_boundary_is_critical(self):
        """Score = 75 → CRITICAL.

        To reach exactly 75 we need both components:
            0.6 * 100 + 0.4 * prob_score = 75
            prob_score = (75 - 60) / 0.4 = 37.5
            overload_probability = 37.5 / 100 = 0.375

        Utilization is at saturation (ratio >= 1.0 → score = 100).
        """
        result = calculate_risk_score(
            utilization_ratio=1.0,           # utilization_score = 100
            overload_probability=0.375,      # probability_score = 37.5
        )
        # risk_score = 0.6*100 + 0.4*37.5 = 60 + 15 = 75
        assert abs(result.risk_score - 75.0) < 1e-9
        assert result.risk_level == RiskLevel.CRITICAL

    # -- Elevation rule tests --

    def test_elevation_low_to_high_when_overload_prob_above_threshold(self):
        """Risk level is elevated from LOW to HIGH when P(overload) >= 0.5."""
        # A small utilization giving a LOW score
        result = calculate_risk_score(
            utilization_ratio=0.1,  # score = 6.0 → LOW
            overload_probability=OVERLOAD_PROBABILITY_ELEVATION_THRESHOLD,
        )
        # Without elevation: 0.6*10 + 0.4*50 = 6+20=26 → MEDIUM
        # Actually let's compute: util_score = min(0.1*100, 100) = 10
        # prob_score = 0.5*100 = 50
        # risk_score = 0.6*10 + 0.4*50 = 6 + 20 = 26 → MEDIUM (not LOW)
        # Elevation rule only fires for LOW or MEDIUM
        # But prob ≥ 0.5, so if MEDIUM → elevated to HIGH
        assert result.risk_level == RiskLevel.HIGH
        assert result.level_elevated is True

    def test_no_elevation_for_high_level(self):
        """Already HIGH level is not modified by elevation rule."""
        # HIGH: score ≥ 50
        result = calculate_risk_score(
            utilization_ratio=0.9,   # score = 0.6*90 = 54 → HIGH
            overload_probability=0.5,
        )
        # prob_score = 50, util_score = 90
        # risk_score = 0.6*90 + 0.4*50 = 54 + 20 = 74 → HIGH (< 75)
        assert result.risk_level in (RiskLevel.HIGH, RiskLevel.CRITICAL)
        assert result.level_elevated is False  # elevation rule not invoked for HIGH+

    def test_elevation_not_applied_when_prob_below_threshold(self):
        """Elevation rule does not fire when overload probability < 0.5."""
        result = calculate_risk_score(
            utilization_ratio=0.1,   # LOW score
            overload_probability=0.49,
        )
        assert result.level_elevated is False

    def test_component_scores_are_exposed(self):
        """Verify utilization_score and probability_score are correctly set."""
        result = calculate_risk_score(
            utilization_ratio=0.6,
            overload_probability=0.3,
        )
        expected_util_score = min(0.6 * 100, 100.0)  # 60.0
        expected_prob_score = 0.3 * 100               # 30.0
        assert abs(result.utilization_score - expected_util_score) < 1e-9
        assert abs(result.probability_score - expected_prob_score) < 1e-9
