import { Layers, Database, AlertTriangle, Users, BusFront, TrainFront } from 'lucide-react';
import type { OverviewTelemetry } from './types';

interface OverviewMetricsProps {
  telemetry: OverviewTelemetry;
  transportMode: 'RAILWAY' | 'BUS';
}

export function OverviewMetrics({ telemetry, transportMode }: OverviewMetricsProps) {
  const isBus = transportMode === 'BUS';
  const FleetIcon = isBus ? BusFront : TrainFront;

  return (
    <div
      aria-label="Core Network Telemetry"
      className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5"
    >
      {/* 1. Records Analyzed */}
      <div className="stat-card">
        <div className="flex items-center justify-between gap-1.5">
          <span className="font-mono-ui text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Records Analyzed
          </span>
          <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono-ui text-[8.5px] font-bold uppercase tracking-wider text-primary">
            Clean
          </span>
        </div>
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="font-display text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
            {telemetry.records.toLocaleString()}
          </span>
          <span className="font-mono-ui text-[10px] text-muted-foreground">rows</span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
          <Database size={11} className="text-primary shrink-0" />
          <span className="truncate">{telemetry.datasetName}</span>
        </div>
      </div>

      {/* 2. Active Corridors & Stations */}
      <div className="stat-card">
        <div className="flex items-center justify-between gap-1.5">
          <span className="font-mono-ui text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Network Footprint
          </span>
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono-ui text-[8.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            Geometry
          </span>
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="font-display text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
            {String(telemetry.routesCount).padStart(2, '0')}
          </span>
          <span className="font-mono-ui text-xs font-semibold uppercase text-muted-foreground">
            Lines
          </span>
          <span className="text-muted-foreground/40 font-mono-ui">/</span>
          <span className="font-display text-lg font-bold text-foreground tabular-nums">
            {telemetry.stations}
          </span>
          <span className="font-mono-ui text-[10px] text-muted-foreground">stops</span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Layers size={11} className="text-primary shrink-0" />
          <span>MMR transit grid</span>
        </div>
      </div>

      {/* 3. Forecast Peak Demand */}
      <div className="stat-card">
        <div className="flex items-center justify-between gap-1.5">
          <span className="font-mono-ui text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Forecast Peak Load
          </span>
          <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono-ui text-[8.5px] font-bold uppercase tracking-wider text-primary">
            +8.4%
          </span>
        </div>
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="font-display text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
            {telemetry.totalPredictedDemand.toLocaleString()}
          </span>
          <span className="font-mono-ui text-[10px] text-muted-foreground">pax/h</span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
          <Users size={11} className="text-primary shrink-0" />
          <span className="truncate">Crest: {telemetry.peakHour} window</span>
        </div>
      </div>

      {/* 4. Risk Surveillance */}
      <div className={`stat-card ${telemetry.highRiskCount > 0 ? 'border-t-2 border-t-risk-high' : 'border-t-2 border-t-risk-low'}`}>
        <div className="flex items-center justify-between gap-1.5">
          <span className="font-mono-ui text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Risk Surveillance
          </span>
          <span
            className={`rounded px-1.5 py-0.5 font-mono-ui text-[8.5px] font-bold uppercase tracking-wider ${
              telemetry.highRiskCount > 0
                ? 'bg-risk-high/15 text-risk-high'
                : 'bg-risk-low/15 text-risk-low'
            }`}
          >
            {telemetry.highRiskCount > 0 ? 'Action Req' : 'Nominal'}
          </span>
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span
            className={`font-display text-2xl font-bold tracking-tight tabular-nums sm:text-3xl ${
              telemetry.highRiskCount > 0 ? 'text-risk-high' : 'text-risk-low'
            }`}
          >
            {String(telemetry.highRiskCount).padStart(2, '0')}
          </span>
          <span className="font-mono-ui text-xs font-semibold uppercase text-muted-foreground">
            High-Risk
          </span>
          <span className="text-muted-foreground/40 font-mono-ui">·</span>
          <span className="font-mono-ui text-xs font-bold text-foreground tabular-nums">
            {Math.round(telemetry.averageUtilization * 100)}%
          </span>
          <span className="font-mono-ui text-[9px] text-muted-foreground">avg util</span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
          <AlertTriangle size={11} className={telemetry.highRiskCount > 0 ? 'text-risk-high shrink-0' : 'text-risk-low shrink-0'} />
          <span className="truncate">Network capacity utilization</span>
        </div>
      </div>

      {/* 5. Fleet Allocation Status */}
      <div className="col-span-2 stat-card sm:col-span-1 md:col-span-1">
        <div className="flex items-center justify-between gap-1.5">
          <span className="font-mono-ui text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Fleet Deployment
          </span>
          <span className="rounded bg-accent/15 px-1.5 py-0.5 font-mono-ui text-[8.5px] font-bold uppercase tracking-wider text-accent">
            +{telemetry.recommendedAdditionalFleet} advise
          </span>
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="font-display text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
            {telemetry.availableFleet}
          </span>
          <span className="font-mono-ui text-xs font-semibold uppercase text-muted-foreground">
            Active
          </span>
          <span className="text-muted-foreground/40 font-mono-ui">/</span>
          <span className="font-display text-base font-bold text-accent tabular-nums">
            +{telemetry.recommendedAdditionalFleet}
          </span>
          <span className="font-mono-ui text-[10px] text-muted-foreground">{telemetry.fleetUnitLabel}</span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
          <FleetIcon size={11} className="text-primary shrink-0" />
          <span className="truncate">Capacity gap buffer</span>
        </div>
      </div>
    </div>
  );
}
