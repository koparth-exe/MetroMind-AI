"""Genuine machine learning regressors for passenger transit demand forecasting.

Implements Linear Regression (OLS), Random Forest, and Gradient Boosting estimators
using scikit-learn. All estimators are genuinely fitted on training data, are
free of heuristics, and support deterministic reproducibility.
"""

from typing import Any

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import LinearRegression

from app.mathematics.models.base import BaseDemandModel


class LinearRegressionModel(BaseDemandModel):
    """Ordinary Least Squares Linear Regression."""

    name = "Linear Regression"

    def __init__(self, fit_intercept: bool = True) -> None:
        self.fit_intercept = fit_intercept
        self._model = LinearRegression(fit_intercept=fit_intercept)
        self.feature_names: list[str] = []
        self.is_fitted = False

    def fit(self, X: pd.DataFrame | np.ndarray, y: np.ndarray) -> "LinearRegressionModel":
        if isinstance(X, pd.DataFrame):
            self.feature_names = list(X.columns)
            X_arr = X.to_numpy()
        else:
            X_arr = np.asarray(X)
            self.feature_names = [f"x_{i}" for i in range(X_arr.shape[1])]

        y_arr = np.asarray(y, dtype=float)
        self._model.fit(X_arr, y_arr)
        self.is_fitted = True
        return self

    def predict(self, X: pd.DataFrame | np.ndarray) -> np.ndarray:
        if not self.is_fitted:
            raise RuntimeError(f"{self.name} must be fitted before predicting.")
        X_arr = X.to_numpy() if isinstance(X, pd.DataFrame) else np.asarray(X)
        return self._model.predict(X_arr)

    def get_model_info(self) -> dict[str, Any]:
        if not self.is_fitted:
            return {"is_fitted": False, "model": self.name}
        coeffs = {
            name: round(float(c), 4)
            for name, c in zip(self.feature_names, self._model.coef_)
        }
        return {
            "is_fitted": True,
            "model": self.name,
            "intercept": round(float(self._model.intercept_), 4),
            "coefficients": coeffs,
        }


class RandomForestModel(BaseDemandModel):
    """Ensemble Random Forest Regressor."""

    name = "Random Forest"

    def __init__(
        self,
        n_estimators: int = 100,
        max_depth: int = 12,
        random_state: int = 42,
    ) -> None:
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.random_state = random_state
        self._model = RandomForestRegressor(
            n_estimators=n_estimators,
            max_depth=max_depth,
            random_state=random_state,
            n_jobs=1,
        )
        self.feature_names: list[str] = []
        self.is_fitted = False

    def fit(self, X: pd.DataFrame | np.ndarray, y: np.ndarray) -> "RandomForestModel":
        if isinstance(X, pd.DataFrame):
            self.feature_names = list(X.columns)
            X_arr = X.to_numpy()
        else:
            X_arr = np.asarray(X)
            self.feature_names = [f"x_{i}" for i in range(X_arr.shape[1])]

        y_arr = np.asarray(y, dtype=float)
        self._model.fit(X_arr, y_arr)
        self.is_fitted = True
        return self

    def predict(self, X: pd.DataFrame | np.ndarray) -> np.ndarray:
        if not self.is_fitted:
            raise RuntimeError(f"{self.name} must be fitted before predicting.")
        X_arr = X.to_numpy() if isinstance(X, pd.DataFrame) else np.asarray(X)
        return self._model.predict(X_arr)

    def get_model_info(self) -> dict[str, Any]:
        if not self.is_fitted:
            return {"is_fitted": False, "model": self.name}
        importances = {
            name: round(float(imp), 4)
            for name, imp in zip(self.feature_names, self._model.feature_importances_)
        }
        return {
            "is_fitted": True,
            "model": self.name,
            "n_estimators": self.n_estimators,
            "max_depth": self.max_depth,
            "random_state": self.random_state,
            "feature_importances": importances,
        }


class GradientBoostingModel(BaseDemandModel):
    """Ensemble Gradient Tree Boosting Regressor."""

    name = "Gradient Boosting"

    def __init__(
        self,
        n_estimators: int = 100,
        max_depth: int = 5,
        learning_rate: float = 0.1,
        random_state: int = 42,
    ) -> None:
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.learning_rate = learning_rate
        self.random_state = random_state
        self._model = GradientBoostingRegressor(
            n_estimators=n_estimators,
            max_depth=max_depth,
            learning_rate=learning_rate,
            random_state=random_state,
        )
        self.feature_names: list[str] = []
        self.is_fitted = False

    def fit(self, X: pd.DataFrame | np.ndarray, y: np.ndarray) -> "GradientBoostingModel":
        if isinstance(X, pd.DataFrame):
            self.feature_names = list(X.columns)
            X_arr = X.to_numpy()
        else:
            X_arr = np.asarray(X)
            self.feature_names = [f"x_{i}" for i in range(X_arr.shape[1])]

        y_arr = np.asarray(y, dtype=float)
        self._model.fit(X_arr, y_arr)
        self.is_fitted = True
        return self

    def predict(self, X: pd.DataFrame | np.ndarray) -> np.ndarray:
        if not self.is_fitted:
            raise RuntimeError(f"{self.name} must be fitted before predicting.")
        X_arr = X.to_numpy() if isinstance(X, pd.DataFrame) else np.asarray(X)
        return self._model.predict(X_arr)

    def get_model_info(self) -> dict[str, Any]:
        if not self.is_fitted:
            return {"is_fitted": False, "model": self.name}
        importances = {
            name: round(float(imp), 4)
            for name, imp in zip(self.feature_names, self._model.feature_importances_)
        }
        return {
            "is_fitted": True,
            "model": self.name,
            "n_estimators": self.n_estimators,
            "max_depth": self.max_depth,
            "learning_rate": self.learning_rate,
            "random_state": self.random_state,
            "feature_importances": importances,
        }
