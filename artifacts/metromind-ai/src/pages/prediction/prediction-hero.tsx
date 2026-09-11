import { ArrowDownRight, ArrowUpRight, Cpu, Gauge, Info, Layers, Sparkles, Target, Zap } from 'lucide-react';
import type { CorridorDisplayData, CorridorSelection, ModelMetric } from './types';
import type { TransportMode } from '@/lib/transport-mode';

interface PredictionHeroProps {
  totalPredictedDemand: number;
  totalHistoricalAverage: number;
  totalDifference: number;
  totalPercentDifference: number;
  totalLowerBound: number;
  totalUpperBound: number;
  focusedCorridorData: CorridorDisplayData | null;
  selectedCorridor: CorridorSelection;
  activeModelName: string;
  activeModelMetrics?: ModelMetric;
  conditions: string;
  transportMode: TransportMode;
}

export function PredictionHero({
  totalPredictedDemand,
  totalHistoricalAverage,
  totalDifference,
  totalPercentDifference,
  totalLowerBound,
  totalUpperBound,
  focusedCorridorData,
  selectedCorridor,
  activeModelName,
  activeModelMetrics,
  conditions,
  transportMode,
}: PredictionHeroProps) {
  const isSpecific = selectedCorridor !== 'ALL' && focusedCorridorData !== null;

  // Values based on selection
  const displayDemand = isSpecific
    ? focusedCorridorData.predictedDemand
    : totalPredictedDemand;
  const displayBaseline = isSpecific
    ? focusedCorridorData.historicalAverage
    : totalHistoricalAverage;
  const displayDiff = isSpecific
    ? focusedCorridorData.difference
    : totalDifference;
  const displayPctDiff = isSpecific
    ? focusedCorridorData.percentDifference
    : totalPercentDifference;
  const displayLower = isSpecific
    ? focusedCorridorData.lowerBound
    : totalLowerBound;
  const displayUpper = isSpecific
    ? focusedCorridorData.upperBound
    : totalUpperBound;

  const isSurge = displayPctDiff > 0;
  const unitLabel = transportMode === 'BUS' ? 'pax / hour' : 'passengers / hour';

  return (
    <section
      id="prediction-hero"
      aria-label="Primary Demand Forecast"
      className="signal-card relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-card via-card/98 to-primary/[0.04] p-6 shadow-sm sm:p-8"
    >
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-accent/5 blur-3xl" />

      {/* Top Meta Strip */}
      <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono-ui text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
            <Sparkles size={12} className="text-primary" />
            PRIMARY DEMAND FORECAST
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/60 px-2.5 py-1 font-mono-ui text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Target size={11} className="text-primary" />
            {isSpecific
              ? `${focusedCorridorData.name} (${focusedCorridorData.routeId})`
              : 'Network Aggregate (All Corridors)'}
          </span>

          {activeModelName && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 font-mono-ui text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <Cpu size={11} className="text-primary" />
              {activeModelName} {activeModelMetrics?.isBest ? '★' : ''}
            </span>
          )}
        </div>

        {/* Condition Tag */}
        {conditions && (
          <div className="rounded-full border border-border/60 bg-muted/50 px-3 py-1 font-mono-ui text-[10.5px] font-medium text-muted-foreground">
            {conditions}
          </div>
        )}
      </div>

      {/* Core Dominant Value Readout */}
      <div className="relative mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
        {/* Left 7 Columns: Giant Predicted Number */}
        <div className="lg:col-span-7">
          <div className="font-mono-ui text-[11px] uppercase font-bold tracking-[0.2em] text-muted-foreground">
            Projected Arrival Demand
          </div>

          <div className="mt-2 flex flex-wrap items-baseline gap-3 sm:gap-4">
            <div
              data-testid="hero-predicted-demand"
              className="font-display text-5xl font-black tracking-[-0.05em] text-foreground sm:text-6xl md:text-7xl tabular-nums"
            >
              {Math.round(displayDemand).toLocaleString()}
            </div>
            <div className="font-mono-ui text-sm font-semibold uppercase tracking-wider text-primary sm:text-base">
              {unitLabel}
            </div>
          </div>

          {/* Delta against historical baseline */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div
              className={`inline-flex items-center gap-1 rounded-xl px-3 py-1 font-mono-ui text-xs font-bold ${
                isSurge
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'bg-accent/15 text-accent-foreground border border-accent/30'
              }`}
            >
              {isSurge ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              <span>
                {isSurge ? '+' : ''}
                {Math.round(displayDiff).toLocaleString()} pax/h ({isSurge ? '+' : ''}
                {displayPctDiff.toFixed(1)}%)
              </span>
            </div>

            <span className="font-mono-ui text-xs text-muted-foreground">
              vs historical baseline{' '}
              <strong className="text-foreground font-semibold">
                {Math.round(displayBaseline).toLocaleString()} {unitLabel}
              </strong>
            </span>
          </div>
        </div>

        {/* Right 5 Columns: Uncertainty & Operational Highlights */}
        <div className="lg:col-span-5 rounded-2xl border border-border/70 bg-card/80 p-5 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
            <span className="font-mono-ui text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Gauge size={13} className="text-primary" />
              95% Prediction Interval
            </span>
            <span className="font-mono-ui text-[9.5px] font-semibold text-primary uppercase">
              ±1.96σ Holdout Error
            </span>
          </div>

          {/* Bounds display */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
              <div className="font-mono-ui text-[9px] uppercase tracking-wider text-muted-foreground font-medium">
                Lower Bound (95% PI)
              </div>
              <div className="mt-1 font-display text-lg font-bold text-foreground tabular-nums">
                {Math.round(displayLower).toLocaleString()}
              </div>
              <div className="font-mono-ui text-[9px] text-muted-foreground">pax/h</div>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
              <div className="font-mono-ui text-[9px] uppercase tracking-wider text-muted-foreground font-medium">
                Upper Bound (95% PI)
              </div>
              <div className="mt-1 font-display text-lg font-bold text-foreground tabular-nums">
                {Math.round(displayUpper).toLocaleString()}
              </div>
              <div className="font-mono-ui text-[9px] text-muted-foreground">pax/h</div>
            </div>
          </div>

          {/* Interval Spread & Model Fit */}
          <div className="space-y-2 pt-1 font-mono-ui text-xs">
            <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-1.5 text-[11px]">
              <span className="text-muted-foreground">Interval Spread (3.92σ):</span>
              <span className="font-semibold text-foreground">
                ±{Math.round((displayUpper - displayDemand)).toLocaleString()} pax/h ({Math.round(displayUpper - displayLower).toLocaleString()} total)
              </span>
            </div>

            {activeModelMetrics && (
              <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/[0.04] px-3 py-1.5 text-[11px]">
                <span className="text-muted-foreground">Holdout Model Fit:</span>
                <span className="font-bold text-foreground">
                  R² = {activeModelMetrics.r2.toFixed(2)} · RMSE = {activeModelMetrics.rmse.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
