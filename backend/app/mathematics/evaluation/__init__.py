"""Model evaluation and validation package."""

from app.mathematics.evaluation.comparison import (
    ModelComparisonResult,
    ModelComparisonService,
    ModelEvaluationRecord,
    compare_models,
)
from app.mathematics.evaluation.residuals import (
    ResidualAnalysisResult,
    calculate_residuals,
)
from app.mathematics.evaluation.split import (
    TemporalSplitResult,
    temporal_train_test_split,
)

__all__ = [
    "ModelComparisonResult",
    "ModelComparisonService",
    "ModelEvaluationRecord",
    "ResidualAnalysisResult",
    "TemporalSplitResult",
    "calculate_residuals",
    "compare_models",
    "temporal_train_test_split",
]
