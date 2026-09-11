import { Flame, AlertTriangle, ShieldAlert, ArrowRight, TrendingUp } from 'lucide-react';
import { RiskBadge } from '@/components/metro-shell';
import type { RouteRiskViewModel } from './types';
import { formatPercent, formatProbability } from './types';

interface RiskExposureProps {
  highestRoute: RouteRiskViewModel;
  onFocusRoute?: (routeId: string) => void;
}

export function RiskExposure({ highestRoute, onFocusRoute }: RiskExposureProps) {
  const isOverloaded = highestRoute.predictedDemand > highestRoute.capacity;
  const deficit = Math.max(0, Math.round(highestRoute.predictedDemand - highestRoute.capacity));

  return (
    <section
      id="risk-exposure"
      aria-label="Highest Capacity Exposure"
      className="signal-card overflow-hidden rounded-2xl border border-risk-critical/40 bg-risk-critical/[0.03] p-5 shadow-xs sm:p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-risk-critical/15 p-2 text-risk-critical shrink-0">
            <Flame size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono-ui text-[10px] font-bold uppercase tracking-[.18em] text-risk-critical">
                PRIORITY SURVEILLANCE
              </span>
              <RiskBadge risk={highestRoute.riskLevel} />
            </div>
            <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-foreground">
              Highest Exposure: {highestRoute.name} ({highestRoute.routeId})
            </h2>
          </div>
        </div>

        {onFocusRoute && (
          <button
            type="button"
            onClick={() => onFocusRoute(highestRoute.routeId)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted transition-all self-start sm:self-auto cursor-pointer"
          >
            <span>Isolate Corridor</span>
            <ArrowRight size={13} />
          </button>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Risk Score */}
        <div className="rounded-xl border border-border/70 bg-card/80 p-3.5">
          <span className="font-mono-ui text-[9.5px] uppercase tracking-wider text-muted-foreground font-semibold">
            Risk Score
          </span>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="font-display text-2xl font-extrabold text-foreground tabular-nums">
              {highestRoute.riskScore}
            </span>
            <span className="font-mono-ui text-xs text-muted-foreground">/ 100</span>
          </div>
        </div>

        {/* Metric 2: Utilization */}
        <div className="rounded-xl border border-border/70 bg-card/80 p-3.5">
          <span className="font-mono-ui text-[9.5px] uppercase tracking-wider text-muted-foreground font-semibold">
            Capacity Utilization
          </span>
          <div className="mt-1.5 font-display text-2xl font-bold text-foreground tabular-nums">
            {formatPercent(highestRoute.utilization)}
          </div>
        </div>

        {/* Metric 3: Overload Probability */}
        <div className="rounded-xl border border-border/70 bg-card/80 p-3.5">
          <span className="font-mono-ui text-[9.5px] uppercase tracking-wider text-muted-foreground font-semibold">
            Overload Probability
          </span>
          <div className="mt-1.5 font-display text-2xl font-bold text-foreground tabular-nums">
            {formatProbability(highestRoute.overloadProbability)}
          </div>
        </div>

        {/* Metric 4: Capacity Deficit */}
        <div className="rounded-xl border border-border/70 bg-card/80 p-3.5">
          <span className="font-mono-ui text-[9.5px] uppercase tracking-wider text-muted-foreground font-semibold">
            {isOverloaded ? 'Projected Overload' : 'Headroom Buffer'}
          </span>
          <div className={`mt-1.5 font-display text-2xl font-bold tabular-nums ${isOverloaded ? 'text-risk-critical' : 'text-risk-low'}`}>
            {isOverloaded ? `+${deficit.toLocaleString()}` : `${Math.abs(Math.round(highestRoute.capacity - highestRoute.predictedDemand)).toLocaleString()}`}
            <span className="font-mono-ui text-xs font-normal text-muted-foreground ml-1">pax/h</span>
          </div>
        </div>
      </div>

      {/* Analytical Rationale Narrative */}
      <div className="mt-4 rounded-xl border border-border/60 bg-muted/20 p-4 text-xs text-muted-foreground leading-relaxed">
        <p>
          <strong className="text-foreground">Why this corridor is highlighted: </strong>
          {isOverloaded ? (
            <>
              Predicted demand (<span className="text-foreground font-semibold">{Math.round(highestRoute.predictedDemand).toLocaleString()} pax/h</span>) exceeds nominal assigned vehicle capacity (<span className="text-foreground font-semibold">{Math.round(highestRoute.capacity).toLocaleString()} pax/h</span>) by {deficit.toLocaleString()} passengers/hour. This yields a near-certain exceedance probability ({formatProbability(highestRoute.overloadProbability)}), making it the primary operational pinch point requiring immediate vehicle reallocation in Phase 8H.
            </>
          ) : (
            <>
              {highestRoute.name} carries the highest relative capacity exposure in the active network, operating at {formatPercent(highestRoute.utilization)} utilization with a composite risk index of {highestRoute.riskScore} / 100.
            </>
          )}
        </p>
      </div>
    </section>
  );
}
