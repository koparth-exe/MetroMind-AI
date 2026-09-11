import { HelpCircle, Info, ShieldAlert, Sparkles } from 'lucide-react';
import type { CorridorDisplayData, CorridorSelection } from './types';

interface PredictionUncertaintyProps {
  predictedDemand: number;
  historicalAverage: number;
  lowerBound: number;
  upperBound: number;
  focusedCorridorData: CorridorDisplayData | null;
  selectedCorridor: CorridorSelection;
}

export function PredictionUncertainty({
  predictedDemand,
  historicalAverage,
  lowerBound,
  upperBound,
  focusedCorridorData,
  selectedCorridor,
}: PredictionUncertaintyProps) {
  const isSpecific = selectedCorridor !== 'ALL' && focusedCorridorData !== null;

  const pred = isSpecific ? focusedCorridorData.predictedDemand : predictedDemand;
  const hist = isSpecific ? focusedCorridorData.historicalAverage : historicalAverage;
  const lower = isSpecific ? focusedCorridorData.lowerBound : lowerBound;
  const upper = isSpecific ? focusedCorridorData.upperBound : upperBound;

  // Visual scaling: set minimum and maximum display scale with 15% margin
  const minVal = Math.max(0, Math.min(lower, hist) * 0.85);
  const maxVal = Math.max(upper, hist, pred) * 1.15 || 1;
  const valRange = maxVal - minVal || 1;

  const getPercent = (v: number) => {
    return Math.max(2, Math.min(98, ((v - minVal) / valRange) * 100));
  };

  const leftLowerPct = getPercent(lower);
  const rightUpperPct = getPercent(upper);
  const bandWidthPct = Math.max(4, rightUpperPct - leftLowerPct);
  const centerPredPct = getPercent(pred);
  const histPct = getPercent(hist);

  const spread = Math.round(upper - lower);
  const marginOfError = Math.round((upper - pred));

  return (
    <section
      id="prediction-uncertainty"
      aria-label="Forecast Uncertainty Band"
      className="signal-card overflow-hidden rounded-2xl border border-border/80 bg-card/95 p-5 shadow-xs sm:p-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
            <h2 className="font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
              Forecast Uncertainty Band (95% Prediction Interval)
            </h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Authoritative parametric interval bounds computed from held-out residual variance (±1.96σ).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono-ui text-[10px] font-bold text-primary uppercase tracking-wider">
            Prediction Interval Spread: ±{marginOfError.toLocaleString()} pax/h
          </span>
        </div>
      </div>

      {/* Visual Uncertainty Band */}
      <div className="mt-6 space-y-6">
        {/* Scale labels */}
        <div className="flex items-center justify-between font-mono-ui text-[10px] text-muted-foreground">
          <span>Display Scale Minimum: {Math.round(minVal).toLocaleString()} pax/h</span>
          <span className="text-primary font-semibold">
            Expected Forecast: {Math.round(pred).toLocaleString()} pax/h
          </span>
          <span>Display Scale Maximum: {Math.round(maxVal).toLocaleString()} pax/h</span>
        </div>

        {/* The Graphic Range Bar */}
        <div className="relative py-4">
          {/* Background Track */}
          <div className="h-3 w-full rounded-full bg-muted/60 border border-border/60" />

          {/* Uncertainty Band (lowerBound to upperBound) */}
          <div
            className="absolute top-4 h-3 rounded-full bg-primary/25 border-x-2 border-primary/70 shadow-xs"
            style={{
              left: `${leftLowerPct}%`,
              width: `${bandWidthPct}%`,
            }}
            title={`95% Prediction Interval: ${Math.round(lower)} to ${Math.round(upper)} pax/h`}
          />

          {/* Historical Baseline Marker */}
          <div
            className="absolute top-1 flex flex-col items-center -translate-x-1/2"
            style={{ left: `${histPct}%` }}
            title={`Historical Baseline: ${Math.round(hist)} pax/h`}
          >
            <div className="h-9 w-0.5 border-r-2 border-dashed border-muted-foreground" />
            <span className="mt-1 font-mono-ui text-[9px] font-semibold text-muted-foreground whitespace-nowrap">
              Baseline ({Math.round(hist).toLocaleString()})
            </span>
          </div>

          {/* Central Forecast Point Marker */}
          <div
            className="absolute top-1.5 flex flex-col items-center -translate-x-1/2 z-10"
            style={{ left: `${centerPredPct}%` }}
            title={`Central Forecast: ${Math.round(pred)} pax/h`}
          >
            <div className="h-8 w-2 rounded-full bg-primary shadow-md ring-2 ring-background" />
            <span className="mt-1 font-mono-ui text-[10px] font-bold text-primary whitespace-nowrap bg-card/90 px-1.5 py-0.5 rounded border border-primary/30">
              {Math.round(pred).toLocaleString()} pax/h
            </span>
          </div>
        </div>

        {/* Legend / Metrics Grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 pt-2">
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
            <div className="font-mono-ui text-[9px] uppercase tracking-wider text-muted-foreground font-medium">
              Lower Bound (95% PI)
            </div>
            <div className="mt-1 font-display text-base font-bold text-foreground tabular-nums">
              {Math.round(lower).toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Optimistic floor</div>
          </div>

          <div className="rounded-xl border border-primary/30 bg-primary/[0.04] p-3">
            <div className="font-mono-ui text-[9px] uppercase tracking-wider text-primary font-bold">
              Central Forecast (μ)
            </div>
            <div className="mt-1 font-display text-base font-bold text-primary tabular-nums">
              {Math.round(pred).toLocaleString()}
            </div>
            <div className="text-[10px] text-primary/80 mt-0.5">Expected passenger flow</div>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
            <div className="font-mono-ui text-[9px] uppercase tracking-wider text-muted-foreground font-medium">
              Upper Bound (95% PI)
            </div>
            <div className="mt-1 font-display text-base font-bold text-foreground tabular-nums">
              {Math.round(upper).toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Stress-test ceiling</div>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
            <div className="font-mono-ui text-[9px] uppercase tracking-wider text-muted-foreground font-medium">
              Prediction Interval Spread (3.92σ)
            </div>
            <div className="mt-1 font-display text-base font-bold text-foreground tabular-nums">
              {spread.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Parametric bandwidth</div>
          </div>
        </div>

        {/* Explanatory callout */}
        <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-3.5 flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed">
          <Info size={15} className="text-primary shrink-0 mt-0.5" />
          <p>
            <strong className="text-foreground">Statistical Interpretation:</strong> The interval is derived from held-out residual dispersion using ±1.96σ and represents estimated forecast uncertainty under the specified scenario (ranging from <strong className="text-foreground">{Math.round(lower).toLocaleString()}</strong> to <strong className="text-foreground">{Math.round(upper).toLocaleString()}</strong> pax/h).
          </p>
        </div>
      </div>
    </section>
  );
}
