"""FastAPI endpoints for mathematical demand modeling, evaluation, and time series analysis."""

from fastapi import APIRouter, HTTPException, Query, status

from app.domain.transport.enums import TransportMode
from app.domain.transport.registry import transport_registry
from app.models.math import (
    AnalysisResponse,
    CorrelationDetailResponse,
    CorrelationsEndpointResponse,
    ExplanationInput,
    ExplanationResponse,
    HarmonicResponse,
    ModelComparisonResponse,
    ModelComparisonSummaryResponse,
    ModelMetricsResponse,
    OptimizationInput,
    OptimizationResult,
    PredictionInput,
    PredictionResult,
    ResidualAnalysisEndpointResponse,
    ResidualsSummaryResponse,
    SeasonalityEndpointResponse,
    SimulationInput,
    SimulationResult,
)
from app.services.math_service import math_engine_service

router = APIRouter(prefix="/math", tags=["mathematics"])


def _resolve_mode_or_422(mode: str) -> TransportMode:
    """Normalize mode or raise HTTP 422 if unsupported."""
    try:
        return transport_registry.require_mode(mode)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc


@router.get("/models/{mode}", response_model=ModelComparisonResponse)
def evaluate_models(
    mode: str,
    route_id: str | None = Query(default=None, description="Optional route filter (e.g. 'R1', 'B2')."),
) -> ModelComparisonResponse:
    """Evaluate and compare Linear Regression, Random Forest, and Gradient Boosting estimators."""
    resolved_mode = _resolve_mode_or_422(mode)
    try:
        comparison = math_engine_service.evaluate_demand_models(
            mode=resolved_mode, route_id=route_id
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc

    models_payload = {
        name: ModelMetricsResponse(
            model_name=rec.model_name,
            mae=rec.mae,
            rmse=rec.rmse,
            r2=rec.r2,
            model_info=rec.model_info,
        )
        for name, rec in comparison.evaluations.items()
    }

    return ModelComparisonResponse(
        mode=resolved_mode.value,
        route_id=route_id.strip().upper() if route_id else None,
        best_model=comparison.best_model_name,
        selection_criterion=comparison.selection_criterion,
        training_count=comparison.training_count,
        test_count=comparison.test_count,
        train_end_timestamp=comparison.train_end_timestamp.isoformat(),
        test_start_timestamp=comparison.test_start_timestamp.isoformat(),
        models=models_payload,
    )


@router.get("/residuals/{mode}", response_model=ResidualAnalysisEndpointResponse)
def get_residuals(
    mode: str,
    route_id: str | None = Query(default=None, description="Optional route filter."),
    model_name: str | None = Query(default=None, description="Optional single model name filter."),
) -> ResidualAnalysisEndpointResponse:
    """Retrieve held-out test residual distribution statistics."""
    resolved_mode = _resolve_mode_or_422(mode)
    try:
        raw_residuals = math_engine_service.get_residual_analysis(
            mode=resolved_mode, model_name=model_name, route_id=route_id
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc

    if "residual_analysis" in raw_residuals:
        # Single model response format
        res_data = raw_residuals["residual_analysis"]
        models_dict = {
            raw_residuals["model_name"]: ResidualsSummaryResponse(
                mean_residual=res_data["mean_residual"],
                mae=res_data["mae"],
                rmse=res_data["rmse"],
                min_residual=res_data["min_residual"],
                max_residual=res_data["max_residual"],
                std_residual=res_data["std_residual"],
                sample_size=res_data["sample_size"],
            )
        }
        best_model = raw_residuals["model_name"]
    else:
        # Multi-model response format
        models_dict = {
            m_name: ResidualsSummaryResponse(
                mean_residual=m_data["mean_residual"],
                mae=m_data["mae"],
                rmse=m_data["rmse"],
                min_residual=m_data["min_residual"],
                max_residual=m_data["max_residual"],
                std_residual=m_data["std_residual"],
                sample_size=m_data["sample_size"],
            )
            for m_name, m_data in raw_residuals["models"].items()
        }
        best_model = raw_residuals.get("best_model")

    return ResidualAnalysisEndpointResponse(
        mode=resolved_mode.value,
        route_id=route_id.strip().upper() if route_id else None,
        best_model=best_model,
        models=models_dict,
    )


@router.get("/correlations/{mode}", response_model=CorrelationsEndpointResponse)
def get_correlations(
    mode: str,
    route_id: str | None = Query(default=None, description="Optional route filter."),
) -> CorrelationsEndpointResponse:
    """Retrieve Pearson and Spearman feature-target correlation coefficients."""
    resolved_mode = _resolve_mode_or_422(mode)
    try:
        raw_corrs = math_engine_service.get_feature_correlations(
            mode=resolved_mode, route_id=route_id
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc

    formatted_features: dict[str, dict[str, CorrelationDetailResponse]] = {}
    for feat_name, pair in raw_corrs["feature_correlations"].items():
        formatted_features[feat_name] = {
            "pearson": CorrelationDetailResponse(**pair["pearson"]),
            "spearman": CorrelationDetailResponse(**pair["spearman"]),
        }

    return CorrelationsEndpointResponse(
        mode=resolved_mode.value,
        route_id=route_id.strip().upper() if route_id else None,
        sample_size=raw_corrs["sample_size"],
        feature_correlations=formatted_features,
    )


@router.get("/seasonality/{mode}", response_model=SeasonalityEndpointResponse)
def get_seasonality(
    mode: str,
    route_id: str | None = Query(default=None, description="Optional route filter."),
    top_k: int = Query(default=5, ge=1, le=20, description="Number of dominant harmonics to extract."),
) -> SeasonalityEndpointResponse:
    """Analyze cyclical diurnal and seasonal periodicities using Fast Fourier Transform."""
    resolved_mode = _resolve_mode_or_422(mode)
    try:
        result = math_engine_service.get_seasonality_analysis(
            mode=resolved_mode, route_id=route_id, top_k=top_k
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc

    dominant_harmonics = [
        HarmonicResponse(
            harmonic_index=h.harmonic_index,
            frequency=h.frequency,
            period_hours=h.period_hours,
            amplitude=h.amplitude,
            power=h.power,
            phase_radians=h.phase_radians,
        )
        for h in result.dominant_harmonics
    ]

    return SeasonalityEndpointResponse(
        mode=resolved_mode.value,
        route_id=route_id.strip().upper() if route_id else None,
        total_samples=result.total_samples,
        fundamental_frequency=result.fundamental_frequency,
        mean_demand=result.mean_demand,
        variance=result.variance,
        dominant_harmonics=dominant_harmonics,
        reconstruction_r2=result.reconstruction_r2,
    )


@router.get("/analysis/{mode}", response_model=AnalysisResponse)
def get_analysis_by_mode(mode: str) -> AnalysisResponse:
    """Retrieve statistical correlation, regression fit, and Fourier seasonality for a transport mode."""
    resolved_mode = _resolve_mode_or_422(mode)
    try:
        return math_engine_service.get_mathematical_analysis(resolved_mode)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc


@router.get("/models-summary/{mode}", response_model=ModelComparisonSummaryResponse)
def get_models_summary_by_mode(mode: str) -> ModelComparisonSummaryResponse:
    """Retrieve side-by-side holdout metrics and best model selection for the frontend Models page."""
    resolved_mode = _resolve_mode_or_422(mode)
    try:
        return math_engine_service.get_model_comparison_summary(resolved_mode)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc


@router.post("/predict/{mode}", response_model=PredictionResult)
def predict_by_mode(mode: str, input_data: PredictionInput) -> PredictionResult:
    """Forecast route-level passenger demand under customizable scenario conditions.

    Predicted demand enforces an intentional operational floor of 10.0 pax/h.
    """
    resolved_mode = _resolve_mode_or_422(mode)
    try:
        return math_engine_service.predict_scenario(resolved_mode, input_data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc


@router.post("/optimize/{mode}", response_model=OptimizationResult)
def optimize_by_mode(mode: str, input_data: OptimizationInput) -> OptimizationResult:
    """Allocate available fleet across routes to minimize residual overcrowding."""
    resolved_mode = _resolve_mode_or_422(mode)
    try:
        return math_engine_service.solve_optimization(resolved_mode, input_data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc


@router.post("/simulate/{mode}", response_model=SimulationResult)
def simulate_by_mode(mode: str, input_data: SimulationInput) -> SimulationResult:
    """Stress-test network conditions and evaluate baseline vs scenario metrics."""
    resolved_mode = _resolve_mode_or_422(mode)
    try:
        return math_engine_service.run_simulation(resolved_mode, input_data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc


@router.post("/explain/{mode}", response_model=ExplanationResponse)
def explain_by_mode(mode: str, input_data: ExplanationInput) -> ExplanationResponse:
    """Generate operational review synthesis from mathematical evidence."""
    resolved_mode = _resolve_mode_or_422(mode)
    try:
        return math_engine_service.explain_insights(
            resolved_mode, input_data.topic, input_data.evidence
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc

