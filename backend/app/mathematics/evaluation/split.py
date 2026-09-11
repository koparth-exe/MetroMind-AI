"""Chronological temporal train/test split without random shuffling.

Ensures strict temporal separation such that all training observations occur
chronologically before any test observation, eliminating data leakage.
"""

from collections.abc import Sequence
from datetime import datetime
from typing import NamedTuple

import numpy as np
import pandas as pd

from app.domain.data.models import DemandRecord
from app.mathematics.features.engineering import EngineeredFeatures, FeaturePipeline


class TemporalSplitResult(NamedTuple):
    """Container holding partitioned train and test datasets and temporal boundaries."""

    X_train: pd.DataFrame
    X_test: pd.DataFrame
    y_train: np.ndarray
    y_test: np.ndarray
    train_timestamps: list[datetime]
    test_timestamps: list[datetime]
    train_end_time: datetime
    test_start_time: datetime
    train_count: int
    test_count: int


def temporal_train_test_split(
    data: EngineeredFeatures | Sequence[DemandRecord],
    split_ratio: float = 0.8,
) -> TemporalSplitResult:
    """Split dataset chronologically into earliest training and latest test partitions.

    Args:
        data: Either pre-engineered features or raw DemandRecord sequence.
        split_ratio: Fraction of earliest temporal observations allocated to train (default 0.80).

    Returns:
        TemporalSplitResult containing strictly non-overlapping train and test sets.

    Raises:
        ValueError: If split_ratio is invalid or dataset has insufficient observations.
    """
    if not (0.0 < split_ratio < 1.0):
        raise ValueError(
            f"Split ratio must be between 0.0 and 1.0 (exclusive), got {split_ratio}."
        )

    if isinstance(data, EngineeredFeatures):
        features = data
    else:
        if not data:
            raise ValueError("Cannot split empty record sequence.")
        pipeline = FeaturePipeline()
        features = pipeline.transform(data)

    total_samples = len(features.X)
    if total_samples < 5:
        raise ValueError(
            f"Insufficient samples ({total_samples}) to construct a valid temporal train/test split."
        )

    # Group timestamps into unique sorted chronological milestones
    unique_timestamps = sorted(set(features.timestamps))
    if len(unique_timestamps) < 2:
        raise ValueError(
            "Dataset must contain at least 2 distinct timestamps for chronological separation."
        )

    # Determine cutoff timestamp boundary
    time_cutoff_idx = int(round(len(unique_timestamps) * split_ratio))
    # Guarantee at least 1 timestamp in train and at least 1 in test
    time_cutoff_idx = max(1, min(time_cutoff_idx, len(unique_timestamps) - 1))
    split_timestamp = unique_timestamps[time_cutoff_idx]

    # Partition indices based on timestamp boundary
    train_mask = [t < split_timestamp for t in features.timestamps]
    test_mask = [t >= split_timestamp for t in features.timestamps]

    train_indices = [i for i, m in enumerate(train_mask) if m]
    test_indices = [i for i, m in enumerate(test_mask) if m]

    if not train_indices or not test_indices:
        raise ValueError(
            "Temporal split resulted in an empty partition; check timestamp distribution."
        )

    X_train = features.X.iloc[train_indices].reset_index(drop=True)
    X_test = features.X.iloc[test_indices].reset_index(drop=True)
    y_train = features.y[train_indices]
    y_test = features.y[test_indices]

    train_times = [features.timestamps[i] for i in train_indices]
    test_times = [features.timestamps[i] for i in test_indices]

    train_end = max(train_times)
    test_start = min(test_times)

    # Invariant assertion: train must precede test
    if train_end >= test_start:
        raise RuntimeError(
            f"Temporal leakage detected: train end {train_end} >= test start {test_start}."
        )

    return TemporalSplitResult(
        X_train=X_train,
        X_test=X_test,
        y_train=y_train,
        y_test=y_test,
        train_timestamps=train_times,
        test_timestamps=test_times,
        train_end_time=train_end,
        test_start_time=test_start,
        train_count=len(train_indices),
        test_count=len(test_indices),
    )
