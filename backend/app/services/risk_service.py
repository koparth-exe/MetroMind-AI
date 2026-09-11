"""Mode-aware Risk Engine service for MetroMind AI Phase 5.

Orchestration Pipeline
----------------------

    TransportDataService (Phase 3 demo data)
         ↓
    MathEngineService.evaluate_demand_models()  (Phase 4)
         ↓  Best model selected by lowest held-out RMSE
    Per-route predictions + held-out residual sigma
         ↓
    RiskEngine.assess_route_risk()  (Phase 5)
         ↓  utilization + overload probability + composite score
    ModeRiskResult (structured risk output)

Mode Isolation
--------------
RAILWAY and BUS are strictly isolated throughout this service.
- Separate evaluate_demand_models() calls per mode.
- Capacity from fleet.py is mode-specific (Railway=3000, Bus=70).
- Routes from routes.py are mode-specific.
- No cross-mode fallback under any circumstance.

Prediction Selection Strategy
------------------------------
The Phase 4 model comparison selects the best model by lowest held-out RMSE.
We use the predictions from this best model for risk assessment.

Sigma Selection Strategy
-------------------------
1. Try per-route evaluation → use route-level sigma if > SIGMA_DEGENERACY_THRESHOLD.
2. Fall back to mode-wide sigma from the full-network evaluation.
This approach ensures we use the most specific sigma available while avoiding
degenerate near-zero estimates from routes with very few test samples.

Data Provenance
---------------
The dataset is synthetic demonstration data (see data_service.py / domain/data/demo.py).
Risk estimates derived from this data must not be treated as real operational
safety assessments.
"""

from datetime import datetime

from app.domain.transport.enums import TransportMode
from app.domain.transport.fleet import capacity_for, get_fleet_config
from app.domain.transport.registry import transport_registry
from app.domain.transport.routes import get_routes_for_mode
from app.mathematics.evaluation.comparison import ModelComparisonResult
from app.mathematics.risk.engine import (
    ModeRiskResult,
    RouteRiskResult,
    assess_route_risk,
    select_sigma,
)
from app.mathematics.risk.thresholds import RiskLevel
from app.services.data_service import transport_data_service
from app.services.math_service import MathEngineService, math_engine_service


def _extract_mode_sigma(comparison: ModelComparisonResult) -> float:
    """Extract the held-out residual sigma from the best model's evaluation.

    Returns:
        std_residual from ResidualAnalysisResult of the best model.
        Returns 0.0 if the best model is not found (defensive fallback).
    """
    best = comparison.evaluations.get(comparison.best_model_name)
    if best is None:
        return 0.0
    return float(best.residuals.std_residual)


class RiskEngineService:
    """Mode-aware service orchestrating Phase 4 → Phase 5 risk assessment.

    This service does NOT train ML models. It consumes the outputs of
    MathEngineService (Phase 4) and passes them through the mathematical
    risk calculation layer.
    """

    def __init__(self, math_service: MathEngineService | None = None) -> None:
        self._math_service = math_service or math_engine_service

    def _resolve_mode(self, mode: TransportMode | str) -> TransportMode:
        """Resolve and validate transport mode through the canonical registry."""
        return transport_registry.require_mode(mode)

    def _get_route_predictions_and_sigma(
        self,
        mode: TransportMode,
        route_id: str,
        mode_comparison: ModelComparisonResult,
    ) -> tuple[list[float], list[datetime], float, str, str]:
        """Obtain predictions, timestamps, and sigma for a single route.

        Strategy:
        1. Run per-route model evaluation to get route-specific predictions
           and route-specific sigma.
        2. If route-level sigma is degenerate, fall back to mode_sigma.
        3. Return (predictions, timestamps, sigma, sigma_source, model_name).

        The timestamps come from the route-level test partition.

        Args:
            mode: Validated transport mode.
            route_id: Route identifier (e.g. 'R1', 'B2').
            mode_comparison: Mode-wide model comparison result (for sigma fallback).

        Returns:
            Tuple of (predictions, test_timestamps, sigma, sigma_source, model_name).
        """
        mode_sigma = _extract_mode_sigma(mode_comparison)
        mode_best_name = mode_comparison.best_model_name

        try:
            route_comparison = self._math_service.evaluate_demand_models(
                mode=mode,
                route_id=route_id,
            )
            route_best = route_comparison.evaluations.get(route_comparison.best_model_name)
            if route_best is None:
                raise ValueError(f"Best model '{route_comparison.best_model_name}' not found in route evaluation.")

            route_sigma = float(route_best.residuals.std_residual)
            route_predictions = [float(p) for p in route_best.predictions]

            # The test timestamps come from the route-level split
            # We reconstruct them from the route comparison's test_start_timestamp
            # and test_count. Since we don't have per-prediction timestamps directly,
            # we use the route comparison's test split metadata.
            # NOTE: We cannot recover exact per-prediction timestamps from the
            # comparison result alone; we use the mode-level records to recover them.
            route_timestamps = self._get_test_timestamps_for_route(
                mode=mode,
                route_id=route_id,
                test_count=route_comparison.test_count,
                test_start=route_comparison.test_start_timestamp,
            )

            sigma, sigma_source = select_sigma(route_sigma, mode_sigma)
            model_name = route_comparison.best_model_name

        except (ValueError, RuntimeError):
            # Route-level evaluation failed (e.g., too few samples).
            # Fall back to mode-wide predictions for this route only.
            # Filter mode-wide predictions by route using mode-level test timestamps.
            route_predictions = []
            route_timestamps = []
            sigma = mode_sigma
            sigma_source = "mode-wide-fallback"
            model_name = mode_best_name

        if not route_predictions or not route_timestamps:
            route_predictions, route_timestamps = self._get_mode_predictions_for_route(
                mode=mode,
                route_id=route_id,
                mode_comparison=mode_comparison,
            )
            sigma, sigma_source = select_sigma(0.0, mode_sigma)
            model_name = mode_best_name

        # Align lengths defensively
        min_len = min(len(route_predictions), len(route_timestamps))
        route_predictions = route_predictions[:min_len]
        route_timestamps = route_timestamps[:min_len]

        return route_predictions, route_timestamps, sigma, sigma_source, model_name

    def _get_test_timestamps_for_route(
        self,
        mode: TransportMode,
        route_id: str,
        test_count: int,
        test_start: datetime,
    ) -> list[datetime]:
        """Recover the chronological test timestamps for a route.

        Uses the actual demo dataset records filtered to the route,
        sorted by timestamp, and selects the last `test_count` timestamps
        (matching the chronological test partition behaviour of Phase 4 split).

        Args:
            mode: Transport mode.
            route_id: Route identifier.
            test_count: Number of test observations from the route evaluation.
            test_start: Test partition start timestamp from the route comparison.

        Returns:
            List of test partition timestamps, length <= test_count.
        """
        records = transport_data_service.get_demo_dataset(mode)
        route_records = sorted(
            (r for r in records if r.route_id == route_id),
            key=lambda r: r.timestamp,
        )
        # The test partition is chronologically the last test_count observations
        # from the route records with timestamp >= test_start.
        test_records = [r for r in route_records if r.timestamp >= test_start]
        timestamps = [r.timestamp for r in test_records[:test_count]]
        return timestamps

    def _get_mode_predictions_for_route(
        self,
        mode: TransportMode,
        route_id: str,
        mode_comparison: ModelComparisonResult,
    ) -> tuple[list[float], list[datetime]]:
        """Fallback: extract mode-wide best-model test predictions for a given route.

        The mode-wide evaluation operates over all routes together. We cannot
        recover per-route predictions from the mode-wide test set without
        re-running the evaluation with the test timestamps. Instead, this
        fallback runs a fresh per-route evaluation with no minimum sample guard.

        Returns empty lists if no valid predictions are available.
        """
        records = transport_data_service.get_demo_dataset(mode)
        route_records = [r for r in records if r.route_id == route_id]

        if len(route_records) < 5:
            return [], []

        try:
            route_comparison = self._math_service.evaluate_demand_models(
                mode=mode,
                route_id=route_id,
            )
            best = route_comparison.evaluations.get(route_comparison.best_model_name)
            if best is None:
                return [], []

            predictions = [float(p) for p in best.predictions]
            timestamps = self._get_test_timestamps_for_route(
                mode=mode,
                route_id=route_id,
                test_count=route_comparison.test_count,
                test_start=route_comparison.test_start_timestamp,
            )
            min_len = min(len(predictions), len(timestamps))
            return predictions[:min_len], timestamps[:min_len]
        except (ValueError, RuntimeError):
            return [], []

    def compute_mode_risk(
        self,
        mode: TransportMode | str,
        split_ratio: float = 0.8,
    ) -> ModeRiskResult:
        """Compute route-level risk assessment for all routes of the given mode.

        Args:
            mode: Transport mode (RAILWAY or BUS).
            split_ratio: Chronological train/test split ratio passed to Phase 4.

        Returns:
            ModeRiskResult containing all per-observation risk records.

        Raises:
            ValueError: If mode is invalid, no records available, or capacity is invalid.
        """
        resolved_mode = self._resolve_mode(mode)
        vehicle_capacity = capacity_for(resolved_mode)

        # Step 1: Mode-wide model comparison to get mode sigma + best model name
        mode_comparison = self._math_service.evaluate_demand_models(
            mode=resolved_mode,
            route_id=None,
            split_ratio=split_ratio,
        )
        mode_sigma = _extract_mode_sigma(mode_comparison)

        # Step 2: Per-route risk assessment
        routes = get_routes_for_mode(resolved_mode)
        all_risk_records: list[RouteRiskResult] = []

        for route in routes:
            predictions, timestamps, sigma, sigma_source, model_name = (
                self._get_route_predictions_and_sigma(
                    mode=resolved_mode,
                    route_id=route.route_id,
                    mode_comparison=mode_comparison,
                )
            )

            for pred, ts in zip(predictions, timestamps, strict=False):
                risk_record = assess_route_risk(
                    route_id=route.route_id,
                    timestamp=ts,
                    predicted_demand=float(pred),
                    capacity=vehicle_capacity,
                    sigma=sigma,
                    sigma_source=sigma_source,
                    model_name=model_name,
                )
                all_risk_records.append(risk_record)

        # Sort deterministically by (route_id, timestamp)
        all_risk_records.sort(key=lambda r: (r.route_id, r.timestamp))

        return ModeRiskResult(
            mode=resolved_mode.value,
            route_results=all_risk_records,
            best_model_name=mode_comparison.best_model_name,
            mode_sigma=round(mode_sigma, 4),
            capacity=vehicle_capacity,
        )

    def compute_mode_risk_summary(
        self,
        mode: TransportMode | str,
        split_ratio: float = 0.8,
    ) -> dict:
        """Compute aggregated risk summary statistics for the given mode.

        Args:
            mode: Transport mode (RAILWAY or BUS).
            split_ratio: Train/test split ratio for Phase 4 evaluation.

        Returns:
            Dictionary with mode-level aggregate risk statistics.
        """
        mode_result = self.compute_mode_risk(mode=mode, split_ratio=split_ratio)
        records = mode_result.route_results

        if not records:
            raise ValueError(
                f"No risk records computed for mode '{mode}'. "
                "Verify that the demo dataset has sufficient records."
            )

        level_counts = mode_result.count_by_level()
        risk_scores = [r.risk_score for r in records]
        overload_probs = [r.overload_probability for r in records]

        # Route-level aggregation: highest risk route by max risk score
        route_scores: dict[str, list[float]] = {}
        for r in records:
            route_scores.setdefault(r.route_id, []).append(r.risk_score)
        route_avg_scores = {
            rid: sum(scores) / len(scores)
            for rid, scores in route_scores.items()
        }
        highest_risk_route = max(route_avg_scores, key=lambda rid: route_avg_scores[rid])

        avg_risk_score = round(sum(risk_scores) / len(risk_scores), 4)
        max_risk_score = round(max(risk_scores), 4)
        max_overload_prob = round(max(overload_probs), 6)
        num_routes = len(route_scores)

        return {
            "mode": mode_result.mode,
            "best_model_name": mode_result.best_model_name,
            "capacity": mode_result.capacity,
            "mode_sigma": mode_result.mode_sigma,
            "num_routes_analyzed": num_routes,
            "num_observations": len(records),
            "highest_risk_route": highest_risk_route,
            "average_risk_score": avg_risk_score,
            "max_risk_score": max_risk_score,
            "max_overload_probability": max_overload_prob,
            "level_counts": level_counts,
        }


# Global singleton service instance
risk_engine_service = RiskEngineService()
