"""Rigorous multi-model evaluation and comparison for transit demand forecasting.

Evaluates Linear Regression (OLS), Random Forest, and Gradient Boosting estimators
on identical chronological train/test splits. Model selection is based deterministically
on lowest held-out RMSE.
"""

from collections.abc import Sequence
from dataclasses import asdict, dataclass
from datetime import datetime
from typing import Any

from app.mathematics.evaluation.residuals import (
    ResidualAnalysisResult,
    calculate_residuals,
)
from app.mathematics.evaluation.split import TemporalSplitResult
from app.mathematics.metrics.regression import (
    calculate_mae,
    calculate_r2,
    calculate_rmse,
)
from app.mathematics.models.base import BaseDemandModel
from app.mathematics.models.regressors import (
    GradientBoostingModel,
    LinearRegressionModel,
    RandomForestModel,
)


@dataclass(frozen=True)
class ModelEvaluationRecord:
    """Evaluation metrics and held-out performance for a single demand estimator."""

    model_name: str
    mae: float
    rmse: float
    r2: float
    predictions: list[float]
    model_info: dict[str, Any]
    residuals: ResidualAnalysisResult

    def to_dict(self) -> dict[str, Any]:
        """Convert record to dictionary."""
        d = asdict(self)
        d["residuals"] = self.residuals.to_dict()
        return d


@dataclass(frozen=True)
class ModelComparisonResult:
    """Side-by-side comparative evaluation of demand regression models."""

    evaluations: dict[str, ModelEvaluationRecord]
    best_model_name: str
    selection_criterion: str
    training_count: int
    test_count: int
    train_end_timestamp: datetime
    test_start_timestamp: datetime
    feature_names: list[str]

    def to_dict(self) -> dict[str, Any]:
        """Convert result to dictionary representation."""
        return {
            "evaluations": {
                name: rec.to_dict() for name, rec in self.evaluations.items()
            },
            "best_model_name": self.best_model_name,
            "selection_criterion": self.selection_criterion,
            "training_count": self.training_count,
            "test_count": self.test_count,
            "train_end_timestamp": self.train_end_timestamp.isoformat(),
            "test_start_timestamp": self.test_start_timestamp.isoformat(),
            "feature_names": self.feature_names,
        }


class ModelComparisonService:
    """Compares multiple regressors on a common temporal partition."""

    DEFAULT_MODELS = (
        LinearRegressionModel,
        RandomForestModel,
        GradientBoostingModel,
    )

    @classmethod
    def compare(
        cls,
        split: TemporalSplitResult,
        models: Sequence[BaseDemandModel] | None = None,
    ) -> ModelComparisonResult:
        """Fit each model on the training set and evaluate on the test set.

        Args:
            split: Chronologically partitioned training and test data.
            models: Optional sequence of instantiated BaseDemandModel estimators.
                Defaults to [LinearRegressionModel(), RandomForestModel(), GradientBoostingModel()].

        Returns:
            ModelComparisonResult containing metrics, predictions, and the selected best model.

        Raises:
            ValueError: If split has empty partitions or no models provided.
        """
        if split.train_count == 0 or split.test_count == 0:
            raise ValueError("Cannot compare models on empty train or test partition.")

        if models is None:
            models_to_evaluate: list[BaseDemandModel] = [
                LinearRegressionModel(),
                RandomForestModel(random_state=42),
                GradientBoostingModel(random_state=42),
            ]
        else:
            if not models:
                raise ValueError("At least one model must be provided for comparison.")
            models_to_evaluate = list(models)

        evaluations: dict[str, ModelEvaluationRecord] = {}

        for estimator in models_to_evaluate:
            # Fit strictly on training partition
            estimator.fit(split.X_train, split.y_train)

            # Predict strictly on unseen held-out test partition
            y_pred = estimator.predict(split.X_test)

            # Compute canonical regression metrics
            mae = calculate_mae(split.y_test, y_pred)
            rmse = calculate_rmse(split.y_test, y_pred)
            r2 = calculate_r2(split.y_test, y_pred)

            # Compute residual distribution
            residual_summary = calculate_residuals(split.y_test, y_pred)
            model_info = estimator.get_model_info()

            evaluations[estimator.name] = ModelEvaluationRecord(
                model_name=estimator.name,
                mae=round(mae, 4),
                rmse=round(rmse, 4),
                r2=round(r2, 4),
                predictions=[round(float(p), 2) for p in y_pred],
                model_info=model_info,
                residuals=residual_summary,
            )

        # Select best model strictly by lowest held-out RMSE
        best_model_name = min(
            evaluations.values(),
            key=lambda rec: rec.rmse,
        ).model_name

        feature_names = list(split.X_train.columns)

        return ModelComparisonResult(
            evaluations=evaluations,
            best_model_name=best_model_name,
            selection_criterion="lowest_rmse",
            training_count=split.train_count,
            test_count=split.test_count,
            train_end_timestamp=split.train_end_time,
            test_start_timestamp=split.test_start_time,
            feature_names=feature_names,
        )


def compare_models(
    split: TemporalSplitResult,
    models: Sequence[BaseDemandModel] | None = None,
) -> ModelComparisonResult:
    """Convenience function for ModelComparisonService.compare."""
    return ModelComparisonService.compare(split=split, models=models)
