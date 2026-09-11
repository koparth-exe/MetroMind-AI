"""Mathematically rigorous regression evaluation metrics: MAE, RMSE, and R².

Formulations:
- MAE:  (1 / n) * sum(|y_i - y_hat_i|)
- RMSE: sqrt((1 / n) * sum((y_i - y_hat_i)^2))
- R²:   1 - (SSE / SST) = 1 - (sum((y_i - y_hat_i)^2) / sum((y_i - y_bar)^2))

R² is calculated directly from sum of squared errors and total sum of squares;
it is never substituted with or calculated from Pearson correlation.
"""

from collections.abc import Sequence
import math
import numpy as np


def calculate_mae(
    y_true: Sequence[float] | np.ndarray,
    y_pred: Sequence[float] | np.ndarray,
) -> float:
    """Compute Mean Absolute Error (MAE).

    Raises:
        ValueError: If inputs are empty or lengths do not match.
    """
    y_t = np.asarray(y_true, dtype=float)
    y_p = np.asarray(y_pred, dtype=float)

    if y_t.size == 0 or y_p.size == 0:
        raise ValueError("Cannot calculate MAE on empty arrays.")
    if y_t.shape != y_p.shape:
        raise ValueError(
            f"Shape mismatch: y_true shape {y_t.shape} != y_pred shape {y_p.shape}."
        )

    return float(np.mean(np.abs(y_t - y_p)))


def calculate_rmse(
    y_true: Sequence[float] | np.ndarray,
    y_pred: Sequence[float] | np.ndarray,
) -> float:
    """Compute Root Mean Squared Error (RMSE).

    Raises:
        ValueError: If inputs are empty or lengths do not match.
    """
    y_t = np.asarray(y_true, dtype=float)
    y_p = np.asarray(y_pred, dtype=float)

    if y_t.size == 0 or y_p.size == 0:
        raise ValueError("Cannot calculate RMSE on empty arrays.")
    if y_t.shape != y_p.shape:
        raise ValueError(
            f"Shape mismatch: y_true shape {y_t.shape} != y_pred shape {y_p.shape}."
        )

    return float(np.sqrt(np.mean((y_t - y_p) ** 2)))


def calculate_r2(
    y_true: Sequence[float] | np.ndarray,
    y_pred: Sequence[float] | np.ndarray,
) -> float:
    """Compute Coefficient of Determination (R²) using the canonical formula:
        R² = 1 - (SSE / SST)
    where:
        SSE = sum((y_i - y_hat_i)^2)
        SST = sum((y_i - y_bar)^2)

    Unlike Pearson correlation squared, this definition can properly yield negative
    values when a model performs worse than predicting the horizontal mean baseline.

    Raises:
        ValueError: If inputs are empty, lengths mismatch, or target is constant (SST == 0).
    """
    y_t = np.asarray(y_true, dtype=float)
    y_p = np.asarray(y_pred, dtype=float)

    if y_t.size == 0 or y_p.size == 0:
        raise ValueError("Cannot calculate R² on empty arrays.")
    if y_t.shape != y_p.shape:
        raise ValueError(
            f"Shape mismatch: y_true shape {y_t.shape} != y_pred shape {y_p.shape}."
        )

    sse = float(np.sum((y_t - y_p) ** 2))
    sst = float(np.sum((y_t - np.mean(y_t)) ** 2))

    if math.isclose(sst, 0.0, abs_tol=1e-12):
        raise ValueError(
            "R² is mathematically undefined when target variable is constant (SST = 0)."
        )

    return float(1.0 - (sse / sst))
