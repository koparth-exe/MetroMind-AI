"""Exploratory Fourier / FFT seasonality analysis for transit demand time series.

Identifies underlying cyclical periodicities (diurnal commute cycles, weekly patterns)
using Fast Fourier Transform (FFT).

CRITICAL BUG PREVENTION:
When sorting spectral components by amplitude/power to extract dominant frequencies,
each HarmonicComponent strictly retains its original FFT frequency and harmonic index (k).
The sorted position is NEVER substituted for the original harmonic index.

NOTE:
This module provides exploratory spectral analysis to discover periodic cycles in the data.
It is NOT an operational forecasting model.
"""

from collections.abc import Sequence
from dataclasses import asdict, dataclass
import math
import numpy as np


@dataclass(frozen=True)
class HarmonicComponent:
    """Individual Fourier spectral component representing a periodic cycle."""

    harmonic_index: int  # Original FFT bin index k in rfft output
    frequency: float  # Cycles per hour (or unit time)
    period_hours: float  # Cycle duration in hours (1 / frequency)
    amplitude: float  # Peak amplitude in original demand units (2 * |X[k]| / N)
    power: float  # Spectral power (amplitude squared)
    phase_radians: float  # Phase offset angle in radians

    def to_dict(self) -> dict:
        """Convert component to dictionary representation."""
        return asdict(self)


@dataclass(frozen=True)
class SeasonalityAnalysisResult:
    """Comprehensive result of exploratory Fourier seasonality decomposition."""

    total_samples: int
    sampling_interval_hours: float
    fundamental_frequency: float
    mean_demand: float
    variance: float
    dominant_harmonics: list[HarmonicComponent]
    reconstruction_r2: float | None

    def to_dict(self) -> dict:
        """Convert result to dictionary representation."""
        return {
            "total_samples": self.total_samples,
            "sampling_interval_hours": self.sampling_interval_hours,
            "fundamental_frequency": self.fundamental_frequency,
            "mean_demand": self.mean_demand,
            "variance": self.variance,
            "dominant_harmonics": [h.to_dict() for h in self.dominant_harmonics],
            "reconstruction_r2": self.reconstruction_r2,
        }


def perform_fourier_analysis(
    series: Sequence[float] | np.ndarray,
    sampling_interval_hours: float = 1.0,
    top_k: int = 5,
) -> SeasonalityAnalysisResult:
    """Perform real Fast Fourier Transform (rfft) to discover dominant periodicities.

    Args:
        series: Chronologically ordered 1D sequence of numerical demand observations.
        sampling_interval_hours: Uniform duration between consecutive observations (default 1.0 hr).
        top_k: Number of highest-amplitude cyclical components to return (excluding DC).

    Returns:
        SeasonalityAnalysisResult containing spectral peaks with preserved harmonic indices.

    Raises:
        ValueError: If input is empty, has non-finite values, or has fewer than 4 observations.
    """
    arr = np.asarray(series, dtype=float)

    if arr.size == 0:
        raise ValueError("Cannot perform Fourier analysis on an empty series.")
    if arr.size < 4:
        raise ValueError(
            f"Fourier analysis requires at least 4 observations, got {arr.size}."
        )
    if not np.all(np.isfinite(arr)):
        raise ValueError("Series contains non-finite values (NaN or Inf).")

    n = int(arr.size)
    dt = float(sampling_interval_hours)
    if dt <= 0.0:
        raise ValueError(f"Sampling interval must be positive, got {dt}.")

    # 1D Real Fast Fourier Transform
    fft_vals = np.fft.rfft(arr)
    freqs = np.fft.rfftfreq(n, d=dt)

    mean_val = float(np.abs(fft_vals[0]) / n)
    variance_val = float(np.var(arr))
    fundamental_freq = float(1.0 / (n * dt))

    components: list[HarmonicComponent] = []

    # Iterate over non-DC bins (k = 1 to len(freqs)-1)
    for k in range(1, len(freqs)):
        freq = float(freqs[k])
        if freq <= 0.0:
            continue

        period = float(1.0 / freq)
        # Scaled amplitude: single-sided spectrum doubles AC components
        amp = float(2.0 * np.abs(fft_vals[k]) / n)
        power = float(amp ** 2)
        phase = float(np.angle(fft_vals[k]))

        components.append(
            HarmonicComponent(
                harmonic_index=k,  # PRESERVED: Original integer frequency bin k
                frequency=round(freq, 6),
                period_hours=round(period, 4),
                amplitude=round(amp, 4),
                power=round(power, 4),
                phase_radians=round(phase, 4),
            )
        )

    # Sort components by amplitude descending while retaining original harmonic_index
    sorted_by_amp = sorted(components, key=lambda comp: comp.amplitude, reverse=True)
    dominant_harmonics = sorted_by_amp[: max(1, top_k)]

    # Compute reconstruction R² using the selected dominant harmonics
    t_steps = np.arange(n) * dt
    reconstructed = np.full(n, mean_val, dtype=float)

    for h in dominant_harmonics:
        # Reconstruct: y_h(t) = A * cos(2 * pi * f * t + phase)
        reconstructed += h.amplitude * np.cos(
            2.0 * np.pi * h.frequency * t_steps + h.phase_radians
        )

    sse = float(np.sum((arr - reconstructed) ** 2))
    sst = float(np.sum((arr - mean_val) ** 2))

    if math.isclose(sst, 0.0, abs_tol=1e-12):
        recon_r2 = None
    else:
        recon_r2 = round(float(1.0 - (sse / sst)), 4)

    return SeasonalityAnalysisResult(
        total_samples=n,
        sampling_interval_hours=round(dt, 4),
        fundamental_frequency=round(fundamental_freq, 6),
        mean_demand=round(mean_val, 4),
        variance=round(variance_val, 4),
        dominant_harmonics=dominant_harmonics,
        reconstruction_r2=recon_r2,
    )
