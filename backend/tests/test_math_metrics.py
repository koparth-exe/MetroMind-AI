"""Unit tests for canonical regression evaluation metrics: MAE, RMSE, and R²."""

import math
import numpy as np
import pytest

from app.mathematics.metrics.regression import (
    calculate_mae,
    calculate_r2,
    calculate_rmse,
)


def test_perfect_prediction_yields_zero_error_and_unit_r2() -> None:
    y_true = [10.0, 20.0, 30.0, 40.0]
    y_pred = [10.0, 20.0, 30.0, 40.0]

    assert calculate_mae(y_true, y_pred) == 0.0
    assert calculate_rmse(y_true, y_pred) == 0.0
    assert calculate_r2(y_true, y_pred) == 1.0


def test_hand_calculated_metrics() -> None:
    # True target: mean = 25.0, SST = 225 + 25 + 25 + 225 = 500.0
    y_true = [10.0, 20.0, 30.0, 40.0]
    # Predictions: errors = [-2, +2, -3, +2]
    # Absolute errors = [2, 2, 3, 2] -> sum = 9 -> MAE = 9/4 = 2.25
    # Squared errors = [4, 4, 9, 4] -> sum = 21 -> MSE = 5.25 -> RMSE = sqrt(5.25)
    # SSE = 21.0 -> R² = 1 - 21/500 = 1 - 0.042 = 0.958
    y_pred = [12.0, 18.0, 33.0, 38.0]

    mae = calculate_mae(y_true, y_pred)
    rmse = calculate_rmse(y_true, y_pred)
    r2 = calculate_r2(y_true, y_pred)

    assert math.isclose(mae, 2.25, abs_tol=1e-9)
    assert math.isclose(rmse, math.sqrt(5.25), abs_tol=1e-9)
    assert math.isclose(r2, 0.958, abs_tol=1e-9)


def test_negative_r2_for_sub_mean_baseline_predictions() -> None:
    # Model predicting wildly inaccurate constant value 100
    y_true = [10.0, 20.0, 30.0, 40.0]
    y_pred = [100.0, 100.0, 100.0, 100.0]

    # SST = 500.0, SSE = 90^2 + 80^2 + 70^2 + 60^2 = 8100 + 6400 + 4900 + 3600 = 23000
    # R² = 1 - 23000/500 = 1 - 46 = -45.0
    r2 = calculate_r2(y_true, y_pred)
    assert r2 == -45.0
    assert r2 < 0.0


def test_constant_target_raises_value_error_for_r2() -> None:
    y_true = [50.0, 50.0, 50.0, 50.0]
    y_pred = [50.0, 51.0, 49.0, 50.0]

    with pytest.raises(ValueError, match="R² is mathematically undefined"):
        calculate_r2(y_true, y_pred)


def test_empty_or_shape_mismatched_inputs_raise_value_error() -> None:
    with pytest.raises(ValueError, match="empty"):
        calculate_mae([], [])

    with pytest.raises(ValueError, match="empty"):
        calculate_rmse(np.array([]), np.array([]))

    with pytest.raises(ValueError, match="Shape mismatch"):
        calculate_mae([1.0, 2.0], [1.0])

    with pytest.raises(ValueError, match="Shape mismatch"):
        calculate_r2([1.0, 2.0], [1.0, 2.0, 3.0])
