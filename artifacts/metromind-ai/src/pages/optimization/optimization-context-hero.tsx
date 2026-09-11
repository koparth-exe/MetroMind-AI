import { Users, BusFront, TrainFront, Layers, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { TransportMode } from '@/lib/transport-mode';
import { getModeNomenclature, type BeforeAfterRouteComparison } from './types';

interface OptimizationContextHeroProps {
  transportMode: TransportMode;
  availableFleet: number;
  vehicleCapacity: number;
  rows: BeforeAfterRouteComparison[];
  isSolved: boolean;
}

export function OptimizationContextHero({
  transportMode,
  availableFleet,
  vehicleCapacity,
  rows,
  isSolved,
}: OptimizationContextHeroProps) {
  const mode = getModeNomenclature(transportMode);
  const VehicleIcon = mode.isBus ? BusFront : TrainFront;

  const totalDemand = Math.round(rows.reduce((sum, r) => sum + r.predictedDemand, 0) * 10) / 10;
  const baselineTotalCapacity = rows.reduce((sum, r) => sum + r.baselineCapacity, 0);
  const baselineTotalOvercrowd = Math.round(rows.reduce((sum, r) => sum + r.baselineOvercrowding, 0) * 10) / 10;
  const baselineUnusedCapacity = Math.round(rows.reduce((sum, r) => sum + r.baselineUnusedCapacity, 0) * 10) / 10;

  const recommendedTotalCapacity = rows.reduce((sum, r) => sum + r.recommendedCapacity, 0);
  const recommendedTotalOvercrowd = Math.round(rows.reduce((sum, r) => sum + r.recommendedOvercrowding, 0) * 10) / 10;

  return (
    <section
      id="optimization-context-hero"
      aria-label="Demand and Resource Operational Context"
      className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      {/* 1. Total Demand Signal */}
      <div className="signal-card rounded-2xl p-4 sm:p-5 border border-border/70 bg-card/60">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono-ui text-[9px] uppercase tracking-[.18em] text-muted-foreground font-semibold">
            Network Demand
          </span>
          <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono-ui text-[8.5px] font-semibold text-primary">
            forecast
          </span>
        </div>
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
            {totalDemand.toLocaleString()}
          </span>
          <span className="font-mono-ui text-xs text-muted-foreground">pax / h</span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Users size={12} className="text-primary shrink-0" />
          <span>Across {rows.length} {mode.corridorNoun} corridors</span>
        </div>
      </div>

      {/* 2. Available Fleet Pool */}
      <div className="signal-card rounded-2xl p-4 sm:p-5 border border-border/70 bg-card/60">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono-ui text-[9px] uppercase tracking-[.18em] text-muted-foreground font-semibold">
            Available Fleet
          </span>
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono-ui text-[8.5px] font-semibold text-muted-foreground">
            budget pool
          </span>
        </div>
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
            {availableFleet}
          </span>
          <span className="font-mono-ui text-xs text-muted-foreground">{mode.vehiclePlural}</span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <VehicleIcon size={12} className="text-primary shrink-0" />
          <span>{vehicleCapacity.toLocaleString()} {mode.capacityUnit}</span>
        </div>
      </div>

      {/* 3. Network Capacity Coverage */}
      <div className="signal-card rounded-2xl p-4 sm:p-5 border border-border/70 bg-card/60">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono-ui text-[9px] uppercase tracking-[.18em] text-muted-foreground font-semibold">
            Capacity Deployed
          </span>
          <span
            className={`rounded px-1.5 py-0.5 font-mono-ui text-[8.5px] font-semibold ${
              isSolved ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}
          >
            {isSolved ? 'optimized' : 'baseline'}
          </span>
        </div>
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
            {(isSolved ? recommendedTotalCapacity : baselineTotalCapacity).toLocaleString()}
          </span>
          <span className="font-mono-ui text-xs text-muted-foreground">seats</span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Layers size={12} className="text-primary shrink-0" />
          <span>
            {isSolved
              ? `${(recommendedTotalCapacity / Math.max(1, totalDemand)).toFixed(2)}× capacity / demand ratio`
              : `${(baselineTotalCapacity / Math.max(1, totalDemand)).toFixed(2)}× baseline capacity / demand ratio`}
          </span>
        </div>
      </div>

      {/* 4. Overcrowding Pressure / Status */}
      <div
        className={`signal-card rounded-2xl p-4 sm:p-5 border ${
          (isSolved ? recommendedTotalOvercrowd : baselineTotalOvercrowd) > 0
            ? 'border-risk-high/40 bg-risk-high/[0.03]'
            : 'border-risk-low/40 bg-risk-low/[0.03]'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono-ui text-[9px] uppercase tracking-[.18em] text-muted-foreground font-semibold">
            Unserved Deficit
          </span>
          <span
            className={`rounded px-1.5 py-0.5 font-mono-ui text-[8.5px] font-semibold uppercase ${
              (isSolved ? recommendedTotalOvercrowd : baselineTotalOvercrowd) > 0
                ? 'bg-risk-high/15 text-risk-high'
                : 'bg-risk-low/15 text-risk-low'
            }`}
          >
            {(isSolved ? recommendedTotalOvercrowd : baselineTotalOvercrowd) > 0 ? 'overcrowded' : 'surplus'}
          </span>
        </div>
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span
            className={`font-display text-2xl sm:text-3xl font-bold tracking-tight tabular-nums ${
              (isSolved ? recommendedTotalOvercrowd : baselineTotalOvercrowd) > 0
                ? 'text-risk-high'
                : 'text-risk-low'
            }`}
          >
            {(isSolved ? recommendedTotalOvercrowd : baselineTotalOvercrowd).toLocaleString()}
          </span>
          <span className="font-mono-ui text-xs text-muted-foreground">pax / h</span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {(isSolved ? recommendedTotalOvercrowd : baselineTotalOvercrowd) > 0 ? (
            <>
              <AlertTriangle size={12} className="text-risk-high shrink-0" />
              <span>Residual overcrowding across network</span>
            </>
          ) : (
            <>
              <ShieldCheck size={12} className="text-risk-low shrink-0" />
              <span>Zero unserved demand ({baselineUnusedCapacity.toLocaleString()} spare headroom)</span>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
