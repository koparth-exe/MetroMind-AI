import { Link } from 'wouter';
import { ArrowRight, Check, Compass, Cpu, Database, Flame, LineChart, ShieldAlert, Sparkles, Waypoints } from 'lucide-react';
import type { CorridorDisplayData } from './types';
import type { TransportMode } from '@/lib/transport-mode';

interface PredictionAttentionProps {
  corridors: CorridorDisplayData[];
  transportMode: TransportMode;
}

export function PredictionAttention({
  corridors,
  transportMode,
}: PredictionAttentionProps) {
  // Identify highest demand corridor
  const priorityCorridor = [...corridors].sort((a, b) => b.predictedDemand - a.predictedDemand)[0];
  const unitName = transportMode === 'BUS' ? 'bus' : 'train set';

  const steps = [
    {
      num: '8D',
      title: 'Data Intake',
      subtitle: 'Data Integrity Gate',
      status: 'complete',
      Icon: Database,
    },
    {
      num: '8E',
      title: 'Analysis',
      subtitle: 'Statistical Evidence',
      status: 'complete',
      Icon: LineChart,
    },
    {
      num: '8F',
      title: 'Prediction',
      subtitle: 'Demand Forecasting',
      status: 'active',
      Icon: Sparkles,
    },
    {
      num: '8G',
      title: 'Risk',
      subtitle: 'Capacity Exceedance',
      status: 'next',
      Icon: ShieldAlert,
    },
    {
      num: '8H',
      title: 'Optimization',
      subtitle: 'Fleet Allocation',
      status: 'upcoming',
      Icon: Waypoints,
    },
  ];

  return (
    <section
      id="prediction-attention"
      aria-label="Operational Attention and Risk Progression"
      className="signal-card overflow-hidden rounded-2xl border border-border/80 bg-card/95 p-5 shadow-xs sm:p-6"
    >
      {/* Top Banner with Next-Step CTA */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
            <h2 className="font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
              Operational Attention & Risk Progression
            </h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Transfer forecast demand into the dynamic risk engine to evaluate capacity overload probabilities.
          </p>
        </div>

        <Link
          href="/risk"
          data-testid="button-prediction-to-risk"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-2xs hover:brightness-110 active:scale-[0.98] transition-all self-start sm:self-center cursor-pointer"
        >
          <span>Continue to Risk</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Operational Pinch-Point Notice */}
      {priorityCorridor && (
        <div className="mt-5 rounded-2xl border border-risk-medium/30 bg-risk-medium/[0.04] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-risk-medium/15 p-2 text-risk-medium shrink-0 mt-0.5">
              <Flame size={16} />
            </div>
            <div>
              <div className="font-display text-sm font-bold text-foreground">
                Critical Surveillance Corridor: {priorityCorridor.name} ({priorityCorridor.routeId})
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Projected to absorb {Math.round(priorityCorridor.predictedDemand).toLocaleString()} passengers/hour. In the Risk assessment stage, MetroMind evaluates whether current fleet allocation can absorb this passenger volume without exceeding maximum nominal vehicle capacity.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex sm:flex-col items-end gap-1 font-mono-ui">
            <span className="text-[10px] uppercase text-muted-foreground">Forecast Load</span>
            <span className="font-display text-lg font-bold text-foreground">
              {Math.round(priorityCorridor.predictedDemand).toLocaleString()} pax/h
            </span>
          </div>
        </div>
      )}

      {/* 5-Step Workflow Progression Strip */}
      <div className="mt-5 pt-3 border-t border-border/50">
        <div className="text-[10px] font-mono-ui uppercase tracking-wider text-muted-foreground mb-3 font-semibold">
          Operational Intelligence Lifecycle
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-5">
          {steps.map((s) => {
            const Icon = s.Icon;
            const isComplete = s.status === 'complete';
            const isActive = s.status === 'active';
            const isNext = s.status === 'next';

            return (
              <div
                key={s.num}
                className={`rounded-xl border p-3 transition-all ${
                  isActive
                    ? 'border-primary bg-primary/[0.08] shadow-xs'
                    : isNext
                    ? 'border-risk-medium/40 bg-risk-medium/[0.04]'
                    : isComplete
                    ? 'border-border/60 bg-muted/20'
                    : 'border-border/40 bg-card/40 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono-ui text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    Phase {s.num}
                  </span>
                  {isComplete ? (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-primary">
                      <Check size={10} strokeWidth={3} />
                    </span>
                  ) : isActive ? (
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  ) : null}
                </div>

                <div className="mt-2 flex items-center gap-1.5">
                  <Icon size={12} className={isActive ? 'text-primary' : isNext ? 'text-risk-medium' : 'text-muted-foreground'} />
                  <div className="font-display text-xs font-bold text-foreground">{s.title}</div>
                </div>

                <div className="mt-0.5 text-[10px] text-muted-foreground truncate">{s.subtitle}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
