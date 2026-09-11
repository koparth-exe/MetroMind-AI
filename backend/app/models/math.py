"""Pydantic schemas for the mathematical engine and ML evaluation API."""

from typing import Any
from pydantic import BaseModel, Field


class ModelMetricsResponse(BaseModel):
    """Evaluation summary metrics for a single demand estimator."""

    model_name: str
    mae: float
    rmse: float
    r2: float
    model_info: dict[str, Any]


class ModelComparisonResponse(BaseModel):
    """Side-by-side comparison of genuine regression estimators on test data."""

    mode: str
    route_id: str | None = None
    best_model: str
    selection_criterion: str
    training_count: int
    test_count: int
    train_end_timestamp: str
    test_start_timestamp: str
    models: dict[str, ModelMetricsResponse]


class ResidualsSummaryResponse(BaseModel):
    """Distribution statistics for model prediction residuals."""

    mean_residual: float
    mae: float
    rmse: float
    min_residual: float
    max_residual: float
    std_residual: float
    sample_size: int


class ResidualAnalysisEndpointResponse(BaseModel):
    """Endpoint response for out-of-sample residual error analysis."""

    mode: str
    route_id: str | None = None
    best_model: str | None = None
    models: dict[str, ResidualsSummaryResponse]


class CorrelationDetailResponse(BaseModel):
    """Statistical output of a bivariate correlation test."""

    metric: str
    coefficient: float | None = None
    p_value: float | None = None
    sample_size: int
    is_defined: bool
    notes: str | None = None


class CorrelationsEndpointResponse(BaseModel):
    """Endpoint response for feature-to-demand correlation analysis."""

    mode: str
    route_id: str | None = None
    sample_size: int
    feature_correlations: dict[str, dict[str, CorrelationDetailResponse]]


class HarmonicResponse(BaseModel):
    """Fourier spectral component representing a periodic frequency cycle."""

    harmonic_index: int = Field(
        description="Original FFT frequency bin index k (preserved across sorting)."
    )
    frequency: float = Field(description="Frequency in cycles per hour.")
    period_hours: float = Field(description="Period duration in hours (1 / frequency).")
    amplitude: float = Field(description="Physical peak amplitude in passenger demand units.")
    power: float = Field(description="Spectral power (amplitude squared).")
    phase_radians: float = Field(description="Phase offset in radians.")


class SeasonalityEndpointResponse(BaseModel):
    """Endpoint response for Fourier / FFT cyclical seasonality decomposition."""

    mode: str
    route_id: str | None = None
    total_samples: int
    fundamental_frequency: float
    mean_demand: float
    variance: float
    dominant_harmonics: list[HarmonicResponse]
    reconstruction_r2: float | None = None


# ---------------------------------------------------------------------------
# Frontend-Compatible Mode-Aware Schemas (with camelCase serialization)
# ---------------------------------------------------------------------------

from pydantic import ConfigDict
from pydantic.alias_generators import to_camel
from app.models.dashboard import RouteInsightResponse


class CamelModel(BaseModel):
    """Base model with automatic camelCase serialization for frontend compatibility."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class ModelMetric(CamelModel):
    """Single model metrics representation for the models comparison view."""

    model: str
    mae: float
    rmse: float
    r2: float
    is_best: bool


class ModelComparisonSummaryResponse(CamelModel):
    """Clean model comparison payload expected by the frontend Models page."""

    metrics: list[ModelMetric]
    selected_model: str
    methodology: str


class PredictionInput(CamelModel):
    """Scenario conditions vector for route-level passenger demand prediction."""

    date: str
    hour: int
    rainfall: float = 0.0
    temperature: float = 20.0
    demand_multiplier: float = 1.0
    is_holiday: bool = False
    special_event: bool = False
    model: str | None = None


class PredictionRoute(CamelModel):
    """Single route predicted passenger demand with uncertainty interval."""

    route_id: str
    predicted_demand: float = Field(
        description="Forecast passenger demand in pax/h. Enforces an intentional operational floor of 10.0 pax/h.",
    )
    historical_average: float
    difference: float
    percent_difference: float
    lower_bound: float
    upper_bound: float


class PredictionResult(CamelModel):
    """Complete prediction output containing route forecasts, active model, and metrics."""

    routes: list[PredictionRoute]
    model: str
    metrics: ModelMetric
    conditions: str


class DynamicRiskInput(CamelModel):
    """Interactive risk recalculation scenario parameters."""

    predictions: list[PredictionRoute]
    available_buses: int
    bus_capacity: int


class DynamicRiskRoute(CamelModel):
    """Interactive risk evaluation for a single corridor."""

    route_id: str
    predicted_demand: float
    capacity: float
    utilization: float
    probability: float
    risk: str


class DynamicRiskResult(CamelModel):
    """Interactive risk calculation output."""

    routes: list[DynamicRiskRoute]
    assumption: str


class OptimizationInput(CamelModel):
    """Parameters for integer vehicle allocation optimization."""

    predictions: list[PredictionRoute]
    available_buses: int
    bus_capacity: int
    min_buses_per_route: int = 1
    max_buses_per_route: int = 4


class OptimizationRoute(CamelModel):
    """Allocated vehicle sizing and resulting capacity coverage for a route."""

    route_id: str
    buses: int
    capacity: int
    predicted_demand: float
    utilization: float
    overcrowding: float
    unused_capacity: float


class OptimizationResult(CamelModel):
    """Output of integer vehicle allocation solver."""

    routes: list[OptimizationRoute]
    objective_value: float
    total_buses: int
    total_capacity: int
    total_demand: float
    formulation: str


class SimulationInput(CamelModel):
    """What-if stress-testing scenario conditions."""

    available_buses: int = 4
    rainfall: float = 0.0
    temperature: float = 20.0
    demand_multiplier: float = 1.0
    is_holiday: bool = False
    special_event: bool = False
    unavailable_route: str | None = None
    model: str | None = None


class SimulationScenarioSummary(CamelModel):
    """High-level summary of baseline vs scenario metrics."""

    demand: float
    risk: float
    buses: int
    objective_value: float


class SimulationResult(CamelModel):
    """Comparison of baseline versus stressed operational scenario."""

    baseline: SimulationScenarioSummary
    scenario: SimulationScenarioSummary
    routes: list[RouteInsightResponse]
    label: str


class CorrelationRow(CamelModel):
    """Correlation summary row for the analysis matrix."""

    variable: str
    pearson: float
    spearman: float
    strength: str
    interpretation: str


class RegressionCoefficient(CamelModel):
    """Single regressor coefficient."""

    variable: str
    coefficient: float


class RegressionSummary(CamelModel):
    """Ordinary least squares regression fit summary."""

    equation: str
    r2: float
    coefficients: list[RegressionCoefficient]


class FourierSpectrumItem(CamelModel):
    """Single discrete frequency component."""

    period: int
    amplitude: float


class FourierActualItem(CamelModel):
    """Weekly/daily diurnal demand point vs fitted periodic pattern."""

    label: str
    demand: float
    pattern: float


class FourierSummary(CamelModel):
    """Fourier cyclical periodicity analysis."""

    dominant_period: float
    peak_strength: float
    pattern: str
    spectrum: list[FourierSpectrumItem]
    actual: list[FourierActualItem]


class AnalysisResponse(CamelModel):
    """Comprehensive mathematical analysis response for the Analysis page."""

    correlations: list[CorrelationRow]
    regression: RegressionSummary
    fourier: FourierSummary
    formulae: list[str]


class ExplanationInput(CamelModel):
    """Input parameters for AI explanation."""

    topic: str
    evidence: str


class ExplanationResponse(CamelModel):
    """Explanation response from Gemini or structured deterministic fallback."""

    configured: bool
    explanation: str
    evidence: str

