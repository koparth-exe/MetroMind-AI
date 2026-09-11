"""Unit tests for Pearson and Spearman correlation analysis."""

import math
import numpy as np
import pandas as pd
import pytest
from scipy import stats

from app.mathematics.analysis.correlation import (
    calculate_pearson,
    calculate_spearman,
    compute_feature_target_correlations,
)


def test_pearson_perfect_positive_and_negative_correlation() -> None:
    x = [1.0, 2.0, 3.0, 4.0, 5.0]
    y_pos = [2.0, 4.0, 6.0, 8.0, 10.0]
    y_neg = [10.0, 8.0, 6.0, 4.0, 2.0]

    res_pos = calculate_pearson(x, y_pos)
    assert res_pos.is_defined
    assert math.isclose(res_pos.coefficient, 1.0, abs_tol=1e-5)
    assert res_pos.sample_size == 5

    res_neg = calculate_pearson(x, y_neg)
    assert res_neg.is_defined
    assert math.isclose(res_neg.coefficient, -1.0, abs_tol=1e-5)


def test_spearman_handles_tied_ranks_correctly() -> None:
    # Tied values at indices 1 and 2
    x = [1.0, 2.0, 2.0, 4.0, 5.0]
    y = [10.0, 20.0, 20.0, 40.0, 50.0]

    res = calculate_spearman(x, y)
    assert res.is_defined
    # Perfectly monotonic with identical ties -> rho = 1.0
    assert math.isclose(res.coefficient, 1.0, abs_tol=1e-5)

    # Partial ties verification against scipy
    x_part = [1.0, 2.0, 2.0, 3.0, 5.0]
    y_part = [5.0, 2.0, 3.0, 1.0, 0.0]
    res_part = calculate_spearman(x_part, y_part)
    expected_rho, _ = stats.spearmanr(x_part, y_part)
    assert pytest.approx(res_part.coefficient, abs=1e-4) == float(expected_rho)


def test_constant_input_returns_explicitly_undefined_result() -> None:
    # Constant x has zero variance -> Pearson/Spearman are mathematically undefined
    x_const = [42.0, 42.0, 42.0, 42.0]
    y = [1.0, 2.0, 3.0, 4.0]

    p_res = calculate_pearson(x_const, y)
    assert not p_res.is_defined
    assert p_res.coefficient is None
    assert "undefined" in p_res.notes.lower()

    s_res = calculate_spearman(x_const, y)
    assert not s_res.is_defined
    assert s_res.coefficient is None
    assert "undefined" in s_res.notes.lower()


def test_correlation_sample_size_error_handling() -> None:
    with pytest.raises(ValueError, match="at least 2"):
        calculate_pearson([1.0], [2.0])

    with pytest.raises(ValueError, match="at least 2"):
        calculate_spearman([1.0], [2.0])


def test_compute_feature_target_correlations_dataframe() -> None:
    df = pd.DataFrame({
        "temp": [25.0, 26.0, 27.0, 28.0, 29.0],
        "rain": [0.0, 0.0, 0.0, 0.0, 0.0],  # Constant feature
    })
    y = np.array([100.0, 120.0, 140.0, 160.0, 180.0])

    corrs = compute_feature_target_correlations(df, y)
    assert "temp" in corrs
    assert "rain" in corrs

    # temp has perfect positive linear correlation
    assert corrs["temp"]["pearson"].is_defined
    assert math.isclose(corrs["temp"]["pearson"].coefficient, 1.0, abs_tol=1e-5)

    # rain is constant, so undefined
    assert not corrs["rain"]["pearson"].is_defined
    assert corrs["rain"]["pearson"].coefficient is None
