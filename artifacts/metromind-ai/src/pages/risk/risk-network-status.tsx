import { ShieldAlert, ShieldCheck, AlertTriangle, Flame, ArrowUpRight } from 'lucide-react';
import type { NetworkRiskSummary, RiskLevel } from './types';
import { formatProbability, formatPercent } from './types';

interface RiskNetworkStatusProps {
  summary: NetworkRiskSummary;
  selectedRouteName?: string;
  isCustomScenario?: boolean;
}

export function RiskNetworkStatus({
  summary,
  selectedRouteName,
  isCustomScenario,
}: RiskNetworkStatusProps) {
  const level = summary.overallRiskLevel;
  const isCritical = level === 'CRITICAL';
  const isHigh = level === 'HIGH';
  const isMedium = level === 'MEDIUM';
  const isLow = level === 'LOW';

  const levelColorClass = isCritical
    ? 'text-risk-critical'
    : isHigh
    ? 'text-risk-high'
    : isMedium
    ? 'text-risk-medium'
    : 'text-risk-low';

  const levelBorderClass = isCritical
    ? 'border-risk-critical/40 bg-risk-critical/[0.07]'
    : isHigh
    ? 'border-risk-high/40 bg-risk-high/[0.07]'
    : isMedium
    ? 'border-risk-medium/40 bg-risk-medium/[0.07]'
    : 'border-risk-low/40 bg-risk-low/[0.07]';

  const LevelIcon = isCritical ? Flame : isHigh ? ShieldAlert : isMedium ? AlertTriangle : ShieldCheck;

  return (
    <section
      id="risk-network-status"
      aria-label="Network Risk Status"
      className="signal-card overflow-hidden rounded-2xl border border-border/80 bg-card/95 p-5 shadow-xs sm:p-6"
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1.9fr] lg:items-center">
        {/* Dominant Risk Score & Level Display */}
        <div className={`rounded-2xl border ${levelBorderClass} p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden`}>
          {/* Subtle background glow */}
          <div
            className={`absolute -top-12 -right-12 h-36 w-36 rounded-full blur-3xl opacity-20 ${
              isCritical
                ? 'bg-risk-critical'
                : isHigh
                ? 'bg-risk-high'
                : isMedium
                ? 'bg-risk-medium'
                : 'bg-risk-low'
            }`}
            aria-hidden="true"
          />

          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono-ui text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">
                  {selectedRouteName ? `CORRIDOR RISK · ${selectedRouteName}` : 'NETWORK RISK EXPOSURE'}
                </span>
                {isCustomScenario && (
                  <span className="rounded bg-primary/10 px-1.5 py-0.2 font-mono-ui text-[9px] font-semibold text-primary">
                    Simulated
                  </span>
                )}
              </div>

              {/* Categorical Level Badge */}
              <div
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono-ui text-[10.5px] font-bold uppercase tracking-wider ${
                  isCritical
                    ? 'bg-risk-critical/20 text-risk-critical border border-risk-critical/40'
                    : isHigh
                    ? 'bg-risk-high/20 text-risk-high border border-risk-high/40'
                    : isMedium
                    ? 'bg-risk-medium/20 text-risk-medium border border-risk-medium/40'
                    : 'bg-risk-low/20 text-risk-low border border-risk-low/40'
                }`}
              >
                <LevelIcon size={13} />
                <span>{level}</span>
              </div>
            </div>

            {/* Dominant Headline Risk Score */}
            <div className="mt-4 flex items-baseline gap-2">
              <span className={`font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight tabular-nums ${levelColorClass}`}>
                {summary.averageRiskScore}
              </span>
              <span className="font-mono-ui text-sm sm:text-base font-semibold text-muted-foreground">
                / 100
              </span>
            </div>

            <div className="mt-1 font-mono-ui text-xs font-semibold text-foreground/80">
              Composite Risk Index
            </div>
          </div>

          <p className="mt-4 text-[11.5px] text-muted-foreground leading-relaxed border-t border-border/50 pt-3">
            Weighted synthesis of <span className="text-foreground font-semibold">60% nominal utilization</span> and{' '}
            <span className="text-foreground font-semibold">40% overload probability</span> under residual uncertainty.
          </p>
        </div>

        {/* Supporting Analytical Telemetry Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Tile 1: Capacity Utilization */}
          <div className="rounded-xl border border-border/70 bg-muted/25 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono-ui text-[9.5px] font-bold uppercase tracking-[.15em] text-muted-foreground">
                  Capacity Utilization
                </span>
                <span className="font-mono-ui text-[9px] font-semibold text-primary">60% Weight</span>
              </div>

              <div className="mt-2.5 flex items-baseline gap-1">
                <span className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
                  {formatPercent(summary.averageUtilization)}
                </span>
              </div>

              <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(5, summary.averageUtilization * 100))}%` }}
                />
              </div>
            </div>

            <span className="mt-2 text-[10.5px] text-muted-foreground">
              Ratio of predicted demand to nominal capacity.
            </span>
          </div>

          {/* Tile 2: Overload Probability */}
          <div className="rounded-xl border border-border/70 bg-muted/25 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono-ui text-[9.5px] font-bold uppercase tracking-[.15em] text-muted-foreground">
                  Overload Probability
                </span>
                <span className="font-mono-ui text-[9px] font-semibold text-accent">40% Weight</span>
              </div>

              <div className="mt-2.5 flex items-baseline gap-1">
                <span className={`font-display text-2xl sm:text-3xl font-bold tracking-tight tabular-nums ${
                  summary.maxOverloadProbability >= 0.5 ? 'text-risk-critical' : summary.maxOverloadProbability >= 0.25 ? 'text-risk-high' : 'text-foreground'
                }`}>
                  {formatProbability(summary.maxOverloadProbability)}
                </span>
                <span className="font-mono-ui text-[10px] text-muted-foreground font-medium">max peak</span>
              </div>

              <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    summary.maxOverloadProbability >= 0.5
                      ? 'bg-risk-critical'
                      : summary.maxOverloadProbability >= 0.25
                      ? 'bg-risk-high'
                      : 'bg-accent'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(4, summary.maxOverloadProbability * 100))}%` }}
                />
              </div>
            </div>

            <span className="mt-2 text-[10.5px] text-muted-foreground">
              Gaussian tail probability P(demand &gt; capacity).
            </span>
          </div>

          {/* Tile 3: Predicted Demand */}
          <div className="rounded-xl border border-border/70 bg-muted/25 p-4 flex flex-col justify-between">
            <div>
              <span className="font-mono-ui text-[9.5px] font-bold uppercase tracking-[.15em] text-muted-foreground">
                Predicted Demand
              </span>

              <div className="mt-2.5 flex items-baseline gap-1.5">
                <span className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
                  {Math.round(summary.totalPredictedDemand).toLocaleString()}
                </span>
                <span className="font-mono-ui text-[10px] text-muted-foreground font-medium">pax/h</span>
              </div>
            </div>

            <span className="mt-2 text-[10.5px] text-muted-foreground">
              Aggregate forecast across all network corridors.
            </span>
          </div>

          {/* Tile 4: Available Capacity */}
          <div className="rounded-xl border border-border/70 bg-muted/25 p-4 flex flex-col justify-between">
            <div>
              <span className="font-mono-ui text-[9.5px] font-bold uppercase tracking-[.15em] text-muted-foreground">
                Available Capacity
              </span>

              <div className="mt-2.5 flex items-baseline gap-1.5">
                <span className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
                  {Math.round(summary.totalCapacity).toLocaleString()}
                </span>
                <span className="font-mono-ui text-[10px] text-muted-foreground font-medium">pax/h</span>
              </div>
            </div>

            <span className="mt-2 text-[10.5px] text-muted-foreground">
              Aggregate nominal capacity summed across all active corridors.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
