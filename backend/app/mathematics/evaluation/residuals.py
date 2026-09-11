"""Held-out test set residual analysis for demand regression models.

Residual formulation:
    residual_i = y_true_i - y_pred_i

All evaluation statistics are computed strictly on out-of-sample held-out
predictions from the chronological test set.
"""

from collections.abc import Sequence
from dataclasses import asdict, dataclass
import numpy as np

from app.mathematics.metrics.regression import calculate_mae, calculate_rmse


@dataclass(frozen=True)
class ResidualAnalysisResult:
    """Summary of residual errors for a model on test observations."""

    residuals: list[float]
    sample_size: int
    mean_residual: float
    mae: float
    rmse: float
    min_residual: float
    max_residual: float
    std_residual: float

    def to_dict(self) -> dict:
        """Convert result to dictionary."""
        return asdict(self)


def calculate_residuals(
    y_true: Sequence[float] | np.ndarray,
    y_pred: Sequence[float] | np.ndarray,
) -> ResidualAnalysisResult:
    """Calculate point-wise residuals and summary statistics.

    Args:
        y_true: True observed demand values.
        y_pred: Predicted demand values from held-out evaluation.

    Returns:
        ResidualAnalysisResult containing distribution statistics.

    Raises:
        ValueError: If arrays are empty or lengths mismatch.
    """
    y_t = np.asarray(y_true, dtype=float)
    y_p = np.asarray(y_pred, dtype=float)

    if y_t.size == 0 or y_p.size == 0:
        raise ValueError("Cannot calculate residuals on empty target/prediction arrays.")
    if y_t.shape != y_p.shape:
        raise ValueError(
            f"Shape mismatch: y_true shape {y_t.shape} != y_pred shape {y_p.shape}."
        )

    res_arr = y_t - y_p
    n = int(res_arr.size)

    mae = calculate_mae(y_t, y_p)
    rmse = calculate_rmse(y_t, y_p)
    mean_res = float(np.mean(res_arr))
    min_res = float(np.min(res_arr))
    max_res = float(np.max(res_arr))
    std_res = float(np.std(res_arr))

    return ResidualAnalysisResult(
        residuals=[round(float(r), 4) for r in res_arr],
        sample_size=n,
        mean_residual=round(mean_res, 4),
        mae=round(mae, 4),
        rmse=round(rmse, 4),
        min_residual=round(min_res, 4),
        max_residual=round(max_res, 4),
        std_residual=round(std_res, 4),
    )
