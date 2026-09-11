"""Unit tests for chronological temporal train/test splitting."""

from datetime import datetime, timedelta, timezone
import pytest

from app.domain.data.models import DemandRecord
from app.domain.transport.enums import TransportMode
from app.mathematics.evaluation.split import temporal_train_test_split
from app.mathematics.features.engineering import FeaturePipeline


def _generate_synthetic_hourly_records(n_hours: int = 100) -> list[DemandRecord]:
    base_time = datetime(2026, 8, 1, 0, 0, 0, tzinfo=timezone.utc)
    records = []
    for h in range(n_hours):
        dt = base_time + timedelta(hours=h)
        dow = (dt.weekday() + 1) % 7
        records.append(
            DemandRecord(
                timestamp=dt,
                route_id="R1",
                station_id="ST1",
                passenger_count=1000 + h,
                day_of_week=dow,
                is_weekend=dow in (0, 6),
                is_holiday=False,
                temperature=28.0,
                rainfall=0.0,
                special_event=False,
                mode=TransportMode.RAILWAY,
            )
        )
    return records


def test_temporal_split_is_strictly_chronological_without_shuffle() -> None:
    records = _generate_synthetic_hourly_records(100)
    pipeline = FeaturePipeline(include_route_dummies=False)
    features = pipeline.transform(records)

    split = temporal_train_test_split(features, split_ratio=0.8)

    # Invariants
    assert split.train_count > 0
    assert split.test_count > 0
    assert split.train_count + split.test_count == 100

    # Approximately 80/20
    assert split.train_count == 80
    assert split.test_count == 20

    # Train must strictly precede test in time
    assert split.train_end_time < split.test_start_time

    # Training timestamps are sorted and strictly less than split boundary
    assert split.train_timestamps == sorted(split.train_timestamps)
    assert split.test_timestamps == sorted(split.test_timestamps)
    assert max(split.train_timestamps) < min(split.test_timestamps)

    # Targets verify chronological progression without shuffle
    # First 80 records have passenger_count = 1000 to 1079
    # Last 20 records have passenger_count = 1080 to 1099
    assert split.y_train[0] == 1000.0
    assert split.y_train[-1] == 1079.0
    assert split.y_test[0] == 1080.0
    assert split.y_test[-1] == 1099.0


def test_temporal_split_ratio_validation() -> None:
    records = _generate_synthetic_hourly_records(20)

    with pytest.raises(ValueError, match="Split ratio must be between 0.0 and 1.0"):
        temporal_train_test_split(records, split_ratio=0.0)

    with pytest.raises(ValueError, match="Split ratio must be between 0.0 and 1.0"):
        temporal_train_test_split(records, split_ratio=1.0)

    with pytest.raises(ValueError, match="Split ratio must be between 0.0 and 1.0"):
        temporal_train_test_split(records, split_ratio=-0.2)


def test_temporal_split_rejects_insufficient_samples() -> None:
    # Fewer than 5 records
    records = _generate_synthetic_hourly_records(3)
    with pytest.raises(ValueError, match="Insufficient samples"):
        temporal_train_test_split(records, split_ratio=0.8)
