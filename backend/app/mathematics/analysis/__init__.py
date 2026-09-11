"""Statistical and frequency analysis package."""

from app.mathematics.analysis.correlation import (
    CorrelationResult,
    calculate_pearson,
    calculate_spearman,
    compute_feature_target_correlations,
)
from app.mathematics.analysis.seasonality import (
    HarmonicComponent,
    SeasonalityAnalysisResult,
    perform_fourier_analysis,
)

__all__ = [
    "CorrelationResult",
    "HarmonicComponent",
    "SeasonalityAnalysisResult",
    "calculate_pearson",
    "calculate_spearman",
    "compute_feature_target_correlations",
    "perform_fourier_analysis",
]
