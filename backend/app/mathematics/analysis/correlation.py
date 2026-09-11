"""Exploratory correlation analysis for transit demand and feature variables.

Implements Pearson (linear) and Spearman (rank-order monotonic) correlation
using scipy.stats. Handles ties in rank ordering properly and explicitly reports
when correlation is mathematically undefined (e.g., constant series with zero variance).

IMPORTANT:
Correlation evaluates statistical association between paired observations.
It is NOT regression, does not imply causality, does not produce predictive coefficients,
and must never be labeled as "model accuracy" or substituted for R².
"""

from collections.abc import Sequence
from dataclasses import asdict, dataclass
import math
import numpy as np
import pandas as pd
from scipy import stats


@dataclass(frozen=True)
class CorrelationResult:
    """Statistical result of a bivariate correlation test."""

    metric: str
    coefficient: float | None
    p_value: float | None
    sample_size: int
    is_defined: bool
    notes: str | None = None

    def to_dict(self) -> dict:
        """Convert result to dictionary representation."""
        return asdict(self)


def calculate_pearson(
    x: Sequence[float] | np.ndarray,
    y: Sequence[float] | np.ndarray,
) -> CorrelationResult:
    """Calculate Pearson product-moment correlation coefficient (r).

    Measures linear association between two continuous variables:
        r = sum((x_i - x_bar) * (y_i - y_bar)) / (sqrt(sum((x_i - x_bar)^2)) * sqrt(sum((y_i - y_bar)^2)))

    Args:
        x: First sequence of numerical observations.
        y: Second sequence of numerical observations.

    Returns:
        CorrelationResult with r coefficient, two-tailed p-value, and sample size.

    Raises:
        ValueError: If inputs are empty, lengths mismatch, or sample size < 2.
    """
    x_arr = np.asarray(x, dtype=float)
    y_arr = np.asarray(y, dtype=float)

    if x_arr.size == 0 or y_arr.size == 0:
        raise ValueError("Cannot calculate Pearson correlation on empty arrays.")
    if x_arr.shape != y_arr.shape:
        raise ValueError(
            f"Shape mismatch: x shape {x_arr.shape} != y shape {y_arr.shape}."
        )
    n = int(x_arr.size)
    if n < 2:
        raise ValueError(
            f"Pearson correlation requires at least 2 paired observations, got {n}."
        )

    # Check for constant arrays (standard deviation == 0)
    std_x = float(np.std(x_arr))
    std_y = float(np.std(y_arr))

    if math.isclose(std_x, 0.0, abs_tol=1e-12) or math.isclose(std_y, 0.0, abs_tol=1e-12):
        return CorrelationResult(
            metric="pearson",
            coefficient=None,
            p_value=None,
            sample_size=n,
            is_defined=False,
            notes="Mathematically undefined: at least one variable is constant (zero variance).",
        )

    res = stats.pearsonr(x_arr, y_arr)
    coef = float(res.statistic)
    pval = float(res.pvalue)

    if math.isnan(coef):
        return CorrelationResult(
            metric="pearson",
            coefficient=None,
            p_value=None,
            sample_size=n,
            is_defined=False,
            notes="Undefined calculation resulting in NaN.",
        )

    return CorrelationResult(
        metric="pearson",
        coefficient=round(coef, 6),
        p_value=round(pval, 6),
        sample_size=n,
        is_defined=True,
    )


def calculate_spearman(
    x: Sequence[float] | np.ndarray,
    y: Sequence[float] | np.ndarray,
) -> CorrelationResult:
    """Calculate Spearman rank-order correlation coefficient (rho).

    Measures monotonic relationship between two variables using fractional
    midranks for tie resolution via scipy.stats.spearmanr.

    Args:
        x: First sequence of numerical observations.
        y: Second sequence of numerical observations.

    Returns:
        CorrelationResult with rho coefficient, two-tailed p-value, and sample size.

    Raises:
        ValueError: If inputs are empty, lengths mismatch, or sample size < 2.
    """
    x_arr = np.asarray(x, dtype=float)
    y_arr = np.asarray(y, dtype=float)

    if x_arr.size == 0 or y_arr.size == 0:
        raise ValueError("Cannot calculate Spearman correlation on empty arrays.")
    if x_arr.shape != y_arr.shape:
        raise ValueError(
            f"Shape mismatch: x shape {x_arr.shape} != y shape {y_arr.shape}."
        )
    n = int(x_arr.size)
    if n < 2:
        raise ValueError(
            f"Spearman correlation requires at least 2 paired observations, got {n}."
        )

    # Check for constant arrays (all ranks identical)
    std_x = float(np.std(x_arr))
    std_y = float(np.std(y_arr))

    if math.isclose(std_x, 0.0, abs_tol=1e-12) or math.isclose(std_y, 0.0, abs_tol=1e-12):
        return CorrelationResult(
            metric="spearman",
            coefficient=None,
            p_value=None,
            sample_size=n,
            is_defined=False,
            notes="Mathematically undefined: at least one variable is constant (zero rank variance).",
        )

    res = stats.spearmanr(x_arr, y_arr)
    coef = float(res.statistic)
    pval = float(res.pvalue)

    if math.isnan(coef):
        return CorrelationResult(
            metric="spearman",
            coefficient=None,
            p_value=None,
            sample_size=n,
            is_defined=False,
            notes="Undefined calculation resulting in NaN.",
        )

    return CorrelationResult(
        metric="spearman",
        coefficient=round(coef, 6),
        p_value=round(pval, 6),
        sample_size=n,
        is_defined=True,
    )


def compute_feature_target_correlations(
    X: pd.DataFrame,
    y: Sequence[float] | np.ndarray,
) -> dict[str, dict[str, CorrelationResult]]:
    """Compute Pearson and Spearman correlation of every feature column against the target.

    Args:
        X: Feature matrix DataFrame.
        y: Target variable array.

    Returns:
        Mapping of feature_name -> {"pearson": CorrelationResult, "spearman": CorrelationResult}.
    """
    y_arr = np.asarray(y, dtype=float)
    results: dict[str, dict[str, CorrelationResult]] = {}

    for col in X.columns:
        col_values = X[col].to_numpy(dtype=float)
        p_res = calculate_pearson(col_values, y_arr)
        s_res = calculate_spearman(col_values, y_arr)
        results[str(col)] = {
            "pearson": p_res,
            "spearman": s_res,
        }

    return results
