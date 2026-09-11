"""Unit tests for held-out residual analysis."""

import math
import numpy as np
import pytest

from app.mathematics.evaluation.residuals import calculate_residuals


def test_residuals_formula_and_hand_calculated_summary() -> None:
    # y_true: [100.0, 150.0, 200.0, 250.0]
    # y_pred: [90.0, 160.0, 195.0, 260.0]
    # residuals = y_true - y_pred = [10.0, -10.0, 5.0, -10.0]
    y_true = [100.0, 150.0, 200.0, 250.0]
    y_pred = [90.0, 160.0, 195.0, 260.0]

    res = calculate_residuals(y_true, y_pred)

    assert res.residuals == [10.0, -10.0, 5.0, -10.0]
    assert res.sample_size == 4

    # mean residual = (10 - 10 + 5 - 10) / 4 = -5 / 4 = -1.25
    assert res.mean_residual == -1.25

    # MAE = (|10| + |-10| + |5| + |-10|) / 4 = 35 / 4 = 8.75
    assert res.mae == 8.75

    # MSE = (100 + 100 + 25 + 100) / 4 = 325 / 4 = 81.25 -> RMSE = sqrt(81.25) ~ 9.013878
    assert math.isclose(res.rmse, math.sqrt(81.25), abs_tol=1e-3)

    assert res.min_residual == -10.0
    assert res.max_residual == 10.0


def test_residuals_error_on_mismatch_or_empty() -> None:
    with pytest.raises(ValueError, match="empty"):
        calculate_residuals([], [])

    with pytest.raises(ValueError, match="Shape mismatch"):
        calculate_residuals([1.0, 2.0], [1.0])
