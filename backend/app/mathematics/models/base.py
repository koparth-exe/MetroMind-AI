"""Abstract base class for genuine regression models in MetroMind AI."""

from abc import ABC, abstractmethod
from typing import Any

import numpy as np
import pandas as pd


class BaseDemandModel(ABC):
    """Uniform contract for demand regression estimators."""

    name: str

    @abstractmethod
    def fit(self, X: pd.DataFrame | np.ndarray, y: np.ndarray) -> "BaseDemandModel":
        """Fit estimator parameters on training features X and targets y."""
        ...

    @abstractmethod
    def predict(self, X: pd.DataFrame | np.ndarray) -> np.ndarray:
        """Generate point demand predictions for given feature matrix."""
        ...

    @abstractmethod
    def get_model_info(self) -> dict[str, Any]:
        """Return model metadata, parameter estimates, or feature importances."""
        ...
