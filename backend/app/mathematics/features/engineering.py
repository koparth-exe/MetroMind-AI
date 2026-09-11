"""Deterministic feature engineering pipeline for transit demand modeling.

Derives temporal, cyclical, and environmental feature representations while
strictly preserving the chronological sequence of observations.
"""

from collections.abc import Sequence
from datetime import datetime
import math
from typing import NamedTuple

import numpy as np
import pandas as pd

from app.domain.data.models import DemandRecord
from app.domain.transport.enums import TransportMode


class EngineeredFeatures(NamedTuple):
    """Container holding feature matrix X, target vector y, and tracking metadata."""

    X: pd.DataFrame
    y: np.ndarray
    feature_names: list[str]
    timestamps: list[datetime]
    route_ids: list[str]
    mode: TransportMode


class FeaturePipeline:
    """Extracts machine-learning features from DemandRecord sequences."""

    BASE_FEATURE_NAMES = [
        "hour",
        "day_of_week",
        "day_of_month",
        "month",
        "hour_sin",
        "hour_cos",
        "day_of_week_sin",
        "day_of_week_cos",
        "temperature",
        "rainfall",
        "is_weekend",
        "is_holiday",
        "special_event",
    ]

    def __init__(self, include_route_dummies: bool = True) -> None:
        self.include_route_dummies = include_route_dummies

    def transform(
        self, records: Sequence[DemandRecord]
    ) -> EngineeredFeatures:
        """Transform demand records into feature matrix X and target y.

        Observations are sorted strictly by (timestamp, route_id) to guarantee
        reproducible chronological ordering.

        Target variable:
            y = passenger_count (actual demand)
        """
        if not records:
            raise ValueError("Cannot extract features from empty record sequence.")

        # Ensure uniform transport mode across records
        modes = {r.mode for r in records}
        if len(modes) > 1:
            raise ValueError(
                f"Feature pipeline cannot mix multiple transport modes: {modes}"
            )
        mode = next(iter(modes))

        # Strict chronological sort
        sorted_records = sorted(records, key=lambda r: (r.timestamp, r.route_id))

        # Discover all unique route IDs present in data in deterministic sorted order
        unique_routes = sorted({r.route_id for r in sorted_records})

        rows: list[dict[str, float | int]] = []
        target_values: list[int] = []
        timestamps: list[datetime] = []
        route_ids: list[str] = []

        for rec in sorted_records:
            dt = rec.timestamp
            h = dt.hour
            dow = rec.day_of_week
            dom = dt.day
            month = dt.month

            # Cyclical trigonometric transforms for continuous time representation
            hour_sin = math.sin(2.0 * math.pi * h / 24.0)
            hour_cos = math.cos(2.0 * math.pi * h / 24.0)
            dow_sin = math.sin(2.0 * math.pi * dow / 7.0)
            dow_cos = math.cos(2.0 * math.pi * dow / 7.0)

            row: dict[str, float | int] = {
                "hour": h,
                "day_of_week": dow,
                "day_of_month": dom,
                "month": month,
                "hour_sin": round(hour_sin, 6),
                "hour_cos": round(hour_cos, 6),
                "day_of_week_sin": round(dow_sin, 6),
                "day_of_week_cos": round(dow_cos, 6),
                "temperature": float(rec.temperature),
                "rainfall": float(rec.rainfall),
                "is_weekend": 1.0 if rec.is_weekend else 0.0,
                "is_holiday": 1.0 if rec.is_holiday else 0.0,
                "special_event": 1.0 if rec.special_event else 0.0,
            }

            if self.include_route_dummies and len(unique_routes) > 1:
                for rt in unique_routes:
                    row[f"route_{rt}"] = 1.0 if rec.route_id == rt else 0.0

            rows.append(row)
            target_values.append(rec.passenger_count)
            timestamps.append(dt)
            route_ids.append(rec.route_id)

        df_x = pd.DataFrame(rows)
        feature_names = list(df_x.columns)
        arr_y = np.asarray(target_values, dtype=float)

        return EngineeredFeatures(
            X=df_x,
            y=arr_y,
            feature_names=feature_names,
            timestamps=timestamps,
            route_ids=route_ids,
            mode=mode,
        )
