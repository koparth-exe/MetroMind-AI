"""Unit tests for multi-model comparison service."""

from datetime import datetime, timedelta, timezone
import pytest

from app.domain.data.models import DemandRecord
from app.domain.transport.enums import TransportMode
from app.mathematics.evaluation.comparison import compare_models
from app.mathematics.evaluation.split import temporal_train_test_split
from app.mathematics.features.engineering import FeaturePipeline


def _create_sample_split():
    base_time = datetime(2026, 8, 1, 0, 0, 0, tzinfo=timezone.utc)
    records = []
    for h in range(60):
        dt = base_time + timedelta(hours=h)
        dow = (dt.weekday() + 1) % 7
        # Deterministic demand with slight non-linearity
        count = int(1000 + 200 * ((h % 24) / 24.0) ** 2)
        records.append(
            DemandRecord(
                timestamp=dt,
                route_id="R1",
                station_id="ST1",
                passenger_count=count,
                day_of_week=dow,
                is_weekend=dow in (0, 6),
                is_holiday=False,
                temperature=25.0 + (h % 5),
                rainfall=0.0,
                special_event=False,
                mode=TransportMode.RAILWAY,
            )
        )

    pipeline = FeaturePipeline(include_route_dummies=False)
    features = pipeline.transform(records)
    return temporal_train_test_split(features, split_ratio=0.8)


def test_model_comparison_runs_on_identical_split_and_selects_lowest_rmse() -> None:
    split = _create_sample_split()
    comparison = compare_models(split)

    # All 3 canonical models must be present
    assert set(comparison.evaluations.keys()) == {
        "Linear Regression",
        "Random Forest",
        "Gradient Boosting",
    }

    assert comparison.training_count == split.train_count
    assert comparison.test_count == split.test_count
    assert comparison.train_end_timestamp == split.train_end_time
    assert comparison.test_start_timestamp == split.test_start_time

    # Verify best model selection is strictly by lowest RMSE
    all_rmses = {
        name: rec.rmse for name, rec in comparison.evaluations.items()
    }
    min_rmse_model = min(all_rmses, key=all_rmses.get)
    assert comparison.best_model_name == min_rmse_model
    assert comparison.selection_criterion == "lowest_rmse"

    # Verify each model evaluated properly on the test set
    for name, rec in comparison.evaluations.items():
        assert rec.model_name == name
        assert len(rec.predictions) == split.test_count
        assert rec.residuals.sample_size == split.test_count
        assert rec.mae >= 0.0
        assert rec.rmse >= 0.0
        assert rec.model_info["is_fitted"] is True
