import { Users, Zap, TrendingUp, Navigation, MapPin } from 'lucide-react';
import type { PassengerTelemetry } from './types';

interface PassengerTelemetryProps {
  telemetry: PassengerTelemetry;
  transportMode: 'RAILWAY' | 'BUS';
}

export function PassengerTelemetryRow({ telemetry, transportMode }: PassengerTelemetryProps) {
  const isBus = transportMode === 'BUS';

  return (
    <div
      aria-label="Passenger Network Telemetry"
      className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5"
    >
      {/* 1. Total Network Passenger Demand */}
      <div className="stat-card">
        <div className="flex items-center justify-between gap-1.5">
          <span className="font-mono-ui text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Total Hourly Demand
          </span>
          <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono-ui text-[8.5px] font-bold uppercase tracking-wider text-primary">
            Active Load
          </span>
        </div>
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="font-display text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
            {Math.round(telemetry.totalDemand).toLocaleString()}
          </span>
          <span className="font-mono-ui text-[10px] text-muted-foreground">pax/h</span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
          <Users size={11} className="text-primary shrink-0" />
          <span className="truncate">Across {telemetry.corridorsCount} {isBus ? 'bus routes' : 'suburban lines'}</span>
        </div>
      </div>

      {/* 2. Peak Flow Surge */}
      <div className="stat-card">
        <div className="flex items-center justify-between gap-1.5">
          <span className="font-mono-ui text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Peak Inflow Surge
          </span>
          <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono-ui text-[8.5px] font-bold uppercase tracking-wider text-primary">
            {telemetry.peakHour} window
          </span>
        </div>
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="font-display text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
            {Math.round(telemetry.peakDemand).toLocaleString()}
          </span>
          <span className="font-mono-ui text-[10px] text-muted-foreground">pax/h</span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
          <Zap size={11} className="text-primary shrink-0" />
          <span className="truncate">Max Diurnal Inflow</span>
        </div>
      </div>

      {/* 3. Network Crowding Pressure */}
      <div className={`stat-card ${telemetry.averageUtilization >= 0.70 ? 'border-t-2 border-t-risk-medium' : 'border-t-2 border-t-risk-low'}`}>
        <div className="flex items-center justify-between gap-1.5">
          <span className="font-mono-ui text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Crowding Pressure
          </span>
          <span
            className={`rounded px-1.5 py-0.5 font-mono-ui text-[8.5px] font-bold uppercase tracking-wider ${
              telemetry.averageUtilization >= 0.85
                ? 'bg-risk-high/15 text-risk-high'
                : telemetry.averageUtilization >= 0.70
                ? 'bg-risk-medium/15 text-risk-medium'
                : 'bg-risk-low/15 text-risk-low'
            }`}
          >
            {telemetry.averageUtilization >= 0.85
              ? 'Dense Flow'
              : telemetry.averageUtilization >= 0.70
              ? 'Moderate Load'
              : 'Nominal Load'}
          </span>
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span
            className={`font-display text-2xl font-bold tracking-tight tabular-nums sm:text-3xl ${
              telemetry.averageUtilization >= 0.70 ? 'text-risk-medium' : 'text-risk-low'
            }`}
          >
            {Math.round(telemetry.averageUtilization * 100)}%
          </span>
          <span className="font-mono-ui text-xs font-semibold uppercase text-muted-foreground">
            avg util
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
          <TrendingUp size={11} className={telemetry.averageUtilization >= 0.70 ? 'text-risk-medium shrink-0' : 'text-risk-low shrink-0'} />
          <span className="truncate">Effective capacity consumed</span>
        </div>
      </div>

      {/* 4. Busiest Passenger Corridor */}
      <div className="stat-card">
        <div className="flex items-center justify-between gap-1.5">
          <span className="font-mono-ui text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Busiest Corridor
          </span>
          <span
            className="flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 font-mono-ui text-[8.5px] font-bold uppercase text-foreground"
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: telemetry.busiestRoute.color }}
              aria-hidden="true"
            />
            {telemetry.busiestRoute.routeId}
          </span>
        </div>
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="font-display text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
            {Math.round(telemetry.busiestRoute.demand).toLocaleString()}
          </span>
          <span className="font-mono-ui text-[10px] text-muted-foreground">pax/h</span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground truncate" title={telemetry.busiestRoute.name}>
          <Navigation size={11} className="text-primary shrink-0" />
          <span className="truncate">{telemetry.busiestRoute.name}</span>
        </div>
      </div>

      {/* 5. Key Interchange Transfer Hub */}
      <div className="col-span-2 stat-card sm:col-span-1 md:col-span-1">
        <div className="flex items-center justify-between gap-1.5">
          <span className="font-mono-ui text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Interchange Hub
          </span>
          <span className="rounded bg-accent/15 px-1.5 py-0.5 font-mono-ui text-[8.5px] font-bold uppercase tracking-wider text-accent">
            {telemetry.keyInterchangeHub.corridorCount} Corridors
          </span>
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl truncate">
            {telemetry.keyInterchangeHub.name}
          </span>
          <span className="font-mono-ui text-[10px] text-muted-foreground shrink-0">transfer</span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground truncate" title={telemetry.keyInterchangeHub.corridorNames.join(', ')}>
          <MapPin size={11} className="text-primary shrink-0" />
          <span className="truncate">{telemetry.keyInterchangeHub.corridorNames.join(' · ')}</span>
        </div>
      </div>
    </div>
  );
}
