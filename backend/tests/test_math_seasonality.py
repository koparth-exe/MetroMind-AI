"""Unit tests for Fourier / FFT seasonality and harmonic analysis."""

import math
import numpy as np
import pytest

from app.mathematics.analysis.seasonality import perform_fourier_analysis


def test_fourier_detects_known_diurnal_24_hour_period() -> None:
    # Construct a deterministic synthetic signal with an exact 24-hour period
    # Duration: 10 days = 240 hours
    # Period T = 24.0 hours -> Frequency f = 1/24 cycles/hour
    # Bin index k = f * N * dt = (1/24) * 240 * 1 = 10
    n_hours = 240
    t = np.arange(n_hours, dtype=float)

    mean_baseline = 500.0
    diurnal_amp = 150.0

    # Signal: 500 + 150 * cos(2 * pi * t / 24)
    signal = mean_baseline + diurnal_amp * np.cos(2.0 * np.pi * t / 24.0)

    result = perform_fourier_analysis(signal, sampling_interval_hours=1.0, top_k=3)

    assert result.total_samples == 240
    assert math.isclose(result.mean_demand, mean_baseline, abs_tol=1e-3)

    # Top harmonic must be the 24-hour cycle
    top_harmonic = result.dominant_harmonics[0]

    assert top_harmonic.harmonic_index == 10
    assert pytest.approx(top_harmonic.frequency, abs=1e-5) == 1.0 / 24.0
    assert pytest.approx(top_harmonic.period_hours, abs=1e-3) == 24.0
    assert pytest.approx(top_harmonic.amplitude, abs=1e-3) == 150.0


def test_anti_regression_harmonic_index_not_confused_with_sorted_position() -> None:
    """CRITICAL REGRESSION TEST:

    Verifies that when FFT components are sorted by amplitude, the 'harmonic_index'
    strictly retains its original frequency bin index k, and is NOT replaced by
    'sorted_position + 1'.
    """
    # 240 samples. Construct a signal with:
    # 1. Very small component at k=1 (period = 240 hours, amplitude = 5.0)
    # 2. Large dominant component at k=8 (period = 30 hours, amplitude = 200.0)
    # 3. Medium component at k=20 (period = 12 hours, amplitude = 80.0)
    n = 240
    t = np.arange(n, dtype=float)

    # k=1: freq = 1/240
    # k=8: freq = 8/240 = 1/30
    # k=20: freq = 20/240 = 1/12
    signal = (
        300.0
        + 5.0 * np.cos(2.0 * np.pi * (1.0 / 240.0) * t)
        + 200.0 * np.cos(2.0 * np.pi * (8.0 / 240.0) * t)
        + 80.0 * np.cos(2.0 * np.pi * (20.0 / 240.0) * t)
    )

    result = perform_fourier_analysis(signal, sampling_interval_hours=1.0, top_k=3)
    harmonics = result.dominant_harmonics

    # Sorted by amplitude:
    # 1st: k=8 (amp ~ 200)
    # 2nd: k=20 (amp ~ 80)
    # 3rd: k=1 (amp ~ 5)
    assert harmonics[0].harmonic_index == 8
    assert pytest.approx(harmonics[0].amplitude, abs=1e-2) == 200.0
    assert pytest.approx(harmonics[0].period_hours, abs=1e-2) == 30.0

    assert harmonics[1].harmonic_index == 20
    assert pytest.approx(harmonics[1].amplitude, abs=1e-2) == 80.0
    assert pytest.approx(harmonics[1].period_hours, abs=1e-2) == 12.0

    assert harmonics[2].harmonic_index == 1
    assert pytest.approx(harmonics[2].amplitude, abs=1e-2) == 5.0
    assert pytest.approx(harmonics[2].period_hours, abs=1e-2) == 240.0

    # Old bug check: If sorted position was used, harmonic_index would have been 1, 2, 3!
    assert [h.harmonic_index for h in harmonics] != [1, 2, 3]


def test_fourier_rejects_insufficient_or_invalid_inputs() -> None:
    with pytest.raises(ValueError, match="empty"):
        perform_fourier_analysis([])

    with pytest.raises(ValueError, match="at least 4"):
        perform_fourier_analysis([1.0, 2.0, 3.0])

    with pytest.raises(ValueError, match="non-finite"):
        perform_fourier_analysis([1.0, float("nan"), 3.0, 4.0])
