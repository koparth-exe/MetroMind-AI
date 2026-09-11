"""Unit tests for transit feature engineering pipeline."""

from datetime import datetime, timezone
import math
import pytest

from app.domain.data.models import DemandRecord
from app.domain.transport.enums import TransportMode
from app.mathematics.features.engineering import FeaturePipeline


def _make_record(
    dt: datetime,
    route_id: str = "R1",
    passenger_count: int = 1500,
    temp: float = 28.5,
    rain: float = 2.0,
    mode: TransportMode = TransportMode.RAILWAY,
) -> DemandRecord:
    dow = (dt.weekday() + 1) % 7
    return DemandRecord(
        timestamp=dt,
        route_id=route_id,
        station_id="ST1",
        passenger_count=passenger_count,
        day_of_week=dow,
        is_weekend=dow in (0, 6),
        is_holiday=False,
        temperature=temp,
        rainfall=rain,
        special_event=False,
        mode=mode,
    )


def test_feature_extraction_accuracy_and_cyclical_encodings() -> None:
    # 2026-08-01 06:00:00 (Saturday -> dow=6)
    dt = datetime(2026, 8, 1, 6, 0, 0, tzinfo=timezone.utc)
    rec = _make_record(dt, route_id="R1", passenger_count=1200, temp=30.0, rain=0.0)

    pipeline = FeaturePipeline(include_route_dummies=False)
    feats = pipeline.transform([rec])

    assert len(feats.X) == 1
    row = feats.X.iloc[0]

    assert row["hour"] == 6
    assert row["day_of_month"] == 1
    assert row["month"] == 8
    assert row["temperature"] == 30.0
    assert row["rainfall"] == 0.0

    # At hour=6 (6/24 = 1/4 cycle = pi/2 radians)
    # sin(pi/2) = 1.0, cos(pi/2) = 0.0
    assert math.isclose(row["hour_sin"], 1.0, abs_tol=1e-5)
    assert math.isclose(row["hour_cos"], 0.0, abs_tol=1e-5)

    assert feats.y[0] == 1200.0
    assert feats.feature_names == list(feats.X.columns)


def test_features_preserve_chronological_ordering() -> None:
    # Provide records out of chronological order
    dt1 = datetime(2026, 8, 1, 10, 0, 0, tzinfo=timezone.utc)
    dt2 = datetime(2026, 8, 1, 8, 0, 0, tzinfo=timezone.utc)
    dt3 = datetime(2026, 8, 1, 12, 0, 0, tzinfo=timezone.utc)

    recs = [
        _make_record(dt1, passenger_count=100),
        _make_record(dt2, passenger_count=200),
        _make_record(dt3, passenger_count=300),
    ]

    pipeline = FeaturePipeline()
    feats = pipeline.transform(recs)

    # Should be sorted chronologically: dt2 (8:00), dt1 (10:00), dt3 (12:00)
    assert feats.timestamps == [dt2, dt1, dt3]
    assert list(feats.y) == [200.0, 100.0, 300.0]


def test_route_dummy_variables_generation() -> None:
    dt = datetime(2026, 8, 1, 8, 0, 0, tzinfo=timezone.utc)
    recs = [
        _make_record(dt, route_id="R1"),
        _make_record(dt, route_id="R2"),
    ]

    pipeline = FeaturePipeline(include_route_dummies=True)
    feats = pipeline.transform(recs)

    assert "route_R1" in feats.X.columns
    assert "route_R2" in feats.X.columns

    # R1 record has route_R1=1, route_R2=0
    assert feats.X.iloc[0]["route_R1"] == 1.0
    assert feats.X.iloc[0]["route_R2"] == 0.0
    # R2 record has route_R1=0, route_R2=1
    assert feats.X.iloc[1]["route_R1"] == 0.0
    assert feats.X.iloc[1]["route_R2"] == 1.0


def test_feature_pipeline_rejects_empty_or_mixed_mode_records() -> None:
    pipeline = FeaturePipeline()

    with pytest.raises(ValueError, match="empty"):
        pipeline.transform([])

    dt = datetime(2026, 8, 1, 8, 0, 0, tzinfo=timezone.utc)
    mixed = [
        _make_record(dt, route_id="R1", mode=TransportMode.RAILWAY),
        _make_record(dt, route_id="B1", mode=TransportMode.BUS),
    ]
    with pytest.raises(ValueError, match="cannot mix multiple transport modes"):
        pipeline.transform(mixed)
