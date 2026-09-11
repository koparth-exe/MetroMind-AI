import { Panel, Stat } from '@/components/metro-shell';
import type { TransportMode } from '@/lib/transport-mode';
import { getModeNomenclature, type BeforeAfterRouteComparison } from './types';
import type { OptimizationResult } from '@workspace/api-client-react';
import { ArrowDownRight, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface OptimizationImpactSummaryProps {
  transportMode: TransportMode;
  rows: BeforeAfterRouteComparison[];
  result: OptimizationResult | null;
  availableFleet: number;
}

export function OptimizationImpactSummary({
  transportMode,
  rows,
  result,
  availableFleet,
}: OptimizationImpactSummaryProps) {
  const mode = getModeNomenclature(transportMode);

  // Baseline sums
  const baseOvercrowd = Math.round(rows.reduce((sum, r) => sum + r.baselineOvercrowding, 0) * 10) / 10;
  const baseUnused = Math.round(rows.reduce((sum, r) => sum + r.baselineUnusedCapacity, 0) * 10) / 10;
  const baseObjective = Math.round((baseOvercrowd + 0.05 * baseUnused) * 10) / 10;
  const totalDemand = Math.round(rows.reduce((sum, r) => sum + r.predictedDemand, 0) * 10) / 10;

  // Recommended sums
  const recOvercrowd = result
    ? Math.round(rows.reduce((sum, r) => sum + r.recommendedOvercrowding, 0) * 10) / 10
    : baseOvercrowd;
  const recUnused = result
    ? Math.round(rows.reduce((sum, r) => sum + r.recommendedUnusedCapacity, 0) * 10) / 10
    : baseUnused;
  const recObjective = result ? result.objectiveValue : baseObjective;
  const recTotalCapacity = result
    ? result.totalCapacity
    : rows.reduce((sum, r) => sum + r.baselineCapacity, 0);
  const recTotalBuses = result ? result.totalBuses : rows.reduce((sum, r) => sum + r.baselineBuses, 0);

  // Overcrowding reduction percentage
  const overcrowdReduction =
    baseOvercrowd > 0
      ? Math.round(((baseOvercrowd - recOvercrowd) / baseOvercrowd) * 100)
      : 0;

  // Capacity coverage
  const coveragePercent = Math.round((recTotalCapacity / Math.max(1, totalDemand)) * 100);

  return (
    <div id="optimization-impact-summary">
      <Panel
        title="System Allocation Impact"
        meta={result ? 'solver outcome' : 'baseline performance'}
      >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Objective Function Metric */}
        <div className="rounded-xl border border-border/70 bg-card/60 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono-ui text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
              Objective Value (Z)
            </span>
            <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono-ui text-[8.5px] font-semibold text-primary">
              lower is better
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {recObjective.toFixed(1)}
            </span>
            {result && (
              <span
                className={`flex items-center text-xs font-bold font-mono-ui ${
                  recObjective < baseObjective
                    ? 'text-risk-low'
                    : recObjective > baseObjective
                    ? 'text-risk-medium'
                    : 'text-muted-foreground'
                }`}
              >
                {recObjective < baseObjective ? (
                  <>
                    <ArrowDownRight size={14} /> -{Math.round((1 - recObjective / (baseObjective || 1)) * 100)}%
                  </>
                ) : recObjective > baseObjective ? (
                  <>
                    <ArrowUpRight size={14} /> +{Math.round((recObjective / (baseObjective || 1) - 1) * 100)}%
                  </>
                ) : (
                  'par'
                )}
              </span>
            )}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground font-mono-ui">
            Overcrowding + 5% Unused Penalty
          </div>
          {result && recObjective > baseObjective && (
            <div className="mt-1 text-[10px] text-muted-foreground font-mono-ui leading-tight text-risk-medium/90">
              Higher than baseline because additional capacity introduces unused-capacity penalty.
            </div>
          )}
        </div>

        {/* 2. Fleet Utilization */}
        <div className="rounded-xl border border-border/70 bg-card/60 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono-ui text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
              Fleet Deployed
            </span>
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono-ui text-[8.5px] font-semibold text-muted-foreground">
              {availableFleet} available
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {recTotalBuses} / {availableFleet}
            </span>
            <span className="text-xs text-primary font-bold font-mono-ui">
              {Math.round((recTotalBuses / Math.max(1, availableFleet)) * 100)}%
            </span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground font-mono-ui">
            Active {mode.vehiclePlural} assigned to routes
          </div>
        </div>

        {/* 3. Capacity / Demand Ratio */}
        <div className="rounded-xl border border-border/70 bg-card/60 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono-ui text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
              Capacity / Demand Ratio
            </span>
            <span
              className={`rounded px-1.5 py-0.5 font-mono-ui text-[8.5px] font-semibold ${
                coveragePercent >= 100 ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
              }`}
            >
              {coveragePercent >= 100 ? 'surplus' : 'deficit'}
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {coveragePercent}%
            </span>
            <span className="text-xs text-muted-foreground font-mono-ui">
              ({(coveragePercent / 100).toFixed(2)}× demand)
            </span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground font-mono-ui">
            {(coveragePercent / 100).toFixed(2)}× deployed capacity relative to predicted demand ({recTotalCapacity.toLocaleString()} seats vs {Math.round(totalDemand).toLocaleString()} pax).
          </div>
        </div>

        {/* 4. Overcrowding Relief */}
        <div className="rounded-xl border border-border/70 bg-card/60 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono-ui text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
              Residual Deficit
            </span>
            <span
              className={`rounded px-1.5 py-0.5 font-mono-ui text-[8.5px] font-semibold ${
                recOvercrowd === 0 ? 'bg-risk-low/15 text-risk-low' : 'bg-destructive/15 text-destructive'
              }`}
            >
              {recOvercrowd === 0 ? 'eliminated' : 'unserved'}
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span
              className={`font-display text-2xl sm:text-3xl font-bold tracking-tight tabular-nums ${
                recOvercrowd === 0 ? 'text-risk-low' : 'text-destructive'
              }`}
            >
              {recOvercrowd.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground font-mono-ui">pax / h</span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground font-mono-ui">
            {overcrowdReduction > 0 ? (
              <span className="text-primary font-semibold">Reduced by {overcrowdReduction}% from baseline</span>
            ) : recOvercrowd === 0 ? (
              <span className="text-risk-low">All predicted demand served</span>
            ) : (
              <span className="text-destructive">Unserved corridor congestion remains</span>
            )}
          </div>
        </div>
      </div>
    </Panel>
    </div>
  );
}
