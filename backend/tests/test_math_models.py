"""Unit tests for genuine regression model estimators."""

import numpy as np
import pandas as pd
import pytest

from app.mathematics.models.regressors import (
    GradientBoostingModel,
    LinearRegressionModel,
    RandomForestModel,
)


@pytest.fixture
def synthetic_training_data() -> tuple[pd.DataFrame, np.ndarray, pd.DataFrame]:
    rng = np.random.default_rng(42)
    # y = 3 * x1 - 2 * x2 + 50
    X_train = pd.DataFrame({
        "x1": rng.uniform(1.0, 20.0, 50),
        "x2": rng.uniform(5.0, 10.0, 50),
    })
    y_train = 3.0 * X_train["x1"] - 2.0 * X_train["x2"] + 50.0

    X_test = pd.DataFrame({
        "x1": np.array([25.0, 30.0]),
        "x2": np.array([12.0, 15.0]),
    })
    return X_train, y_train.to_numpy(), X_test


def test_linear_regression_learns_exact_coefficients(
    synthetic_training_data: tuple[pd.DataFrame, np.ndarray, pd.DataFrame]
) -> None:
    X_train, y_train, X_test = synthetic_training_data

    lr = LinearRegressionModel()
    assert not lr.is_fitted

    with pytest.raises(RuntimeError, match="must be fitted"):
        lr.predict(X_test)

    lr.fit(X_train, y_train)
    assert lr.is_fitted

    info = lr.get_model_info()
    assert info["is_fitted"]
    # y = 3*x1 - 2*x2 + 50
    assert pytest.approx(info["coefficients"]["x1"], abs=1e-3) == 3.0
    assert pytest.approx(info["coefficients"]["x2"], abs=1e-3) == -2.0
    assert pytest.approx(info["intercept"], abs=1e-3) == 50.0

    preds = lr.predict(X_test)
    assert preds.shape == (2,)
    # For x1=25, x2=12: y = 3*25 - 2*12 + 50 = 75 - 24 + 50 = 101.0
    assert pytest.approx(preds[0], abs=1e-3) == 101.0


def test_random_forest_is_deterministic_and_fitted(
    synthetic_training_data: tuple[pd.DataFrame, np.ndarray, pd.DataFrame]
) -> None:
    X_train, y_train, X_test = synthetic_training_data

    rf1 = RandomForestModel(n_estimators=30, random_state=42)
    rf1.fit(X_train, y_train)
    pred1 = rf1.predict(X_test)

    rf2 = RandomForestModel(n_estimators=30, random_state=42)
    rf2.fit(X_train, y_train)
    pred2 = rf2.predict(X_test)

    # Identical predictions across separate instances due to random_state=42
    np.testing.assert_allclose(pred1, pred2)

    info = rf1.get_model_info()
    assert info["is_fitted"]
    assert "feature_importances" in info
    assert set(info["feature_importances"].keys()) == {"x1", "x2"}
    total_importance = sum(info["feature_importances"].values())
    assert pytest.approx(total_importance, abs=1e-2) == 1.0


def test_gradient_boosting_is_deterministic_and_fitted(
    synthetic_training_data: tuple[pd.DataFrame, np.ndarray, pd.DataFrame]
) -> None:
    X_train, y_train, X_test = synthetic_training_data

    gb1 = GradientBoostingModel(n_estimators=30, random_state=42)
    gb1.fit(X_train, y_train)
    pred1 = gb1.predict(X_test)

    gb2 = GradientBoostingModel(n_estimators=30, random_state=42)
    gb2.fit(X_train, y_train)
    pred2 = gb2.predict(X_test)

    # Identical predictions across separate instances
    np.testing.assert_allclose(pred1, pred2)

    info = gb1.get_model_info()
    assert info["is_fitted"]
    assert "feature_importances" in info
