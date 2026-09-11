"""MetroMind AI Mathematical Engine and Machine Learning Evaluation Package."""

from app.mathematics.analysis import (
    CorrelationResult,
    HarmonicComponent,
    SeasonalityAnalysisResult,
    calculate_pearson,
    calculate_spearman,
    compute_feature_target_correlations,
    perform_fourier_analysis,
)
from app.mathematics.evaluation import (
    ModelComparisonResult,
    ModelComparisonService,
    ModelEvaluationRecord,
    ResidualAnalysisResult,
    TemporalSplitResult,
    calculate_residuals,
    compare_models,
    temporal_train_test_split,
)
from app.mathematics.features import (
    EngineeredFeatures,
    FeaturePipeline,
)
from app.mathematics.metrics import (
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

__all__ = [
    "BaseDemandModel",
    "CorrelationResult",
    "EngineeredFeatures",
    "FeaturePipeline",
    "GradientBoostingModel",
    "HarmonicComponent",
    "LinearRegressionModel",
    "ModelComparisonResult",
    "ModelComparisonService",
    "ModelEvaluationRecord",
    "RandomForestModel",
    "ResidualAnalysisResult",
    "SeasonalityAnalysisResult",
    "TemporalSplitResult",
    "calculate_mae",
    "calculate_pearson",
    "calculate_r2",
    "calculate_residuals",
    "calculate_rmse",
    "calculate_spearman",
    "compare_models",
    "compute_feature_target_correlations",
    "perform_fourier_analysis",
    "temporal_train_test_split",
]
