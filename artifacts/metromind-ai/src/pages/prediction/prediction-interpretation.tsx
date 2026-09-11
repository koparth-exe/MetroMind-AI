import { Activity, BarChart2, CheckCircle2, Compass, Gauge, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react';
import type { CorridorDisplayData } from './types';
import type { TransportMode } from '@/lib/transport-mode';

interface PredictionInterpretationProps {
  corridors: CorridorDisplayData[];
  totalPredictedDemand: number;
  totalHistoricalAverage: number;
  totalPercentDifference: number;
  conditions: string;
  transportMode: TransportMode;
}

export function PredictionInterpretation({
  corridors,
  totalPredictedDemand,
  totalHistoricalAverage,
  totalPercentDifference,
  conditions,
  transportMode,
}: PredictionInterpretationProps) {
  if (corridors.length === 0) return null;

  // 1. Peak corridor by demand volume
  const peakCorridor = [...corridors].sort((a, b) => b.predictedDemand - a.predictedDemand)[0];

  // 2. Steepest surge corridor by percentage difference
  const surgeCorridor = [...corridors].sort((a, b) => b.percentDifference - a.percentDifference)[0];

  // 3. Overall network direction
  const isNetworkSurge = totalPercentDifference > 0;
  const isBus = transportMode === 'BUS';

  const insights = [
    {
      title: 'Aggregate Network Demand',
      icon: Activity,
      text: `Under ${conditions || 'active scenario conditions'}, total arrival demand across all corridors is projected at ${Math.round(totalPredictedDemand).toLocaleString()} pax/h, reflecting a ${isNetworkSurge ? '+' : ''}${totalPercentDifference.toFixed(1)}% variance against the historical baseline of ${Math.round(totalHistoricalAverage).toLocaleString()} pax/h.`,
      tone: isNetworkSurge ? 'warning' : 'good',
    },
    {
      title: 'Primary Volume Pinch Point',
      icon: Compass,
      text: `${peakCorridor.name} (${peakCorridor.routeId}) carries the highest volume pressure across the network with ${Math.round(peakCorridor.predictedDemand).toLocaleString()} predicted pax/h (95% CI: ${Math.round(peakCorridor.lowerBound)}–${Math.round(peakCorridor.upperBound)} pax/h).`,
      tone: 'default',
    },
    {
      title: 'Maximum Relative Surge Corridor',
      icon: TrendingUp,
      text: `${surgeCorridor.name} exhibits the highest arrival growth at ${surgeCorridor.percentDifference > 0 ? '+' : ''}${surgeCorridor.percentDifference.toFixed(1)}% above its historical average (${Math.round(surgeCorridor.historicalAverage)} pax/h → ${Math.round(surgeCorridor.predictedDemand)} pax/h).`,
      tone: surgeCorridor.percentDifference > 15 ? 'alert' : 'good',
    },
    {
      title: 'Model Uncertainty Calibration',
      icon: Gauge,
      text: `Corridor prediction bands reflect empirical residual dispersion without synthetic smoothing. The ${isBus ? 'bus network' : 'rail corridor'} envelope provides conservative bounds for fleet sizing and headway dispatch.`,
      tone: 'good',
    },
  ];

  return (
    <section
      id="prediction-interpretation"
      aria-label="Demand Forecasting Interpretation"
      className="signal-card overflow-hidden rounded-2xl border border-border/80 bg-card/95 p-5 shadow-xs sm:p-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            <h2 className="font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
              Mathematical Forecast Interpretation
            </h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Deterministic domain synthesis derived directly from active model predictions and scenario conditions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="rounded-full border border-border/60 bg-muted/50 px-2.5 py-0.5 font-mono-ui text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            SYNTHESIS
          </span>
        </div>
      </div>

      {/* Insight Cards Grid */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {insights.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="rounded-2xl border border-border/70 bg-card/60 p-4 sm:p-5 transition-all hover:bg-card/90"
            >
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Icon size={14} />
                </span>
                <h3 className="font-display text-sm font-bold text-foreground">
                  {item.title}
                </h3>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {item.text}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
