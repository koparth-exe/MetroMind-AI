import { Link } from 'wouter';
import type { RouteInsight } from '@workspace/api-client-react';
import type { PassengerTelemetry } from './types';
import { Cpu, ArrowRight, ShieldCheck, Zap, Users, TrendingUp, BusFront, TrainFront } from 'lucide-react';

interface PassengerOperationalTakeawayProps {
  telemetry: PassengerTelemetry;
  routes: RouteInsight[];
  transportMode: 'RAILWAY' | 'BUS';
}

export function PassengerOperationalTakeaway({
  telemetry,
  routes,
  transportMode,
}: PassengerOperationalTakeawayProps) {
  const isBus = transportMode === 'BUS';
  const FleetIcon = isBus ? BusFront : TrainFront;

  // Find corridors with highest utilization and buffer requirements
  const mostCrowded = [...routes].sort((a, b) => b.utilization - a.utilization)[0];
  const totalAdvisedBuffer = routes.reduce(
    (acc, r) => acc + Math.max(0, r.recommendedBuses - r.baselineBuses),
    0
  );

  return (
    <section
      aria-label="Operational Passenger Takeaway"
      className="signal-card rounded-2xl p-5 sm:p-6"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between border-b border-border/70 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 text-primary">
            <Cpu size={15} />
          </div>
          <div>
            <h2 className="font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
              Operational Flow Synthesis & Protocols
            </h2>
            <p className="text-xs text-muted-foreground">
              Deterministic mathematical synthesis derived from active timetable observations and model evaluations.
            </p>
          </div>
        </div>

        <span className="self-start rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 font-mono-ui text-[9px] font-bold uppercase tracking-wider text-primary">
          Calibrated Ground Truth
        </span>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {/* 1. Diurnal Inflow Peak */}
        <div className="rounded-xl border border-border/70 bg-card/60 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <Zap size={14} className="text-primary" />
            <span>Diurnal Flow Profile</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Network passenger flow concentrates in twin commute surges at <strong className="text-foreground">{telemetry.morningPeakHour}</strong> ({Math.round(telemetry.morningPeakDemand).toLocaleString()} pax/h) and <strong className="text-foreground">{telemetry.eveningPeakHour}</strong> ({Math.round(telemetry.eveningPeakDemand).toLocaleString()} pax/h).
          </p>
        </div>

        {/* 2. Primary Pressure Corridor */}
        <div className="rounded-xl border border-border/70 bg-card/60 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <TrendingUp size={14} className="text-accent" />
            <span>Primary Pressure Node</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Corridor <strong className="text-foreground">{mostCrowded?.routeId} ({mostCrowded?.name})</strong> sustains peak load at <strong className="text-foreground">{Math.round(mostCrowded?.utilization * 100)}% capacity</strong> with {Math.round(mostCrowded?.predictedDemand).toLocaleString()} pax/h against nominal capacity of {mostCrowded?.capacity.toLocaleString()}.
          </p>
        </div>

        {/* 3. Reallocation Protocol */}
        <div className="rounded-xl border border-border/70 bg-card/60 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <FleetIcon size={14} className="text-primary" />
            <span>Capacity Buffer Protocol</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Optimization advises deploying <strong className="text-foreground">+{totalAdvisedBuffer} additional {telemetry.fleetUnitLabel}</strong> during commute crests to safeguard standing comfort and eliminate platform overflow risk.
          </p>
        </div>
      </div>

      {/* Downstream Actions Row */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
        <div className="flex items-center gap-2 font-mono-ui text-[11px] text-muted-foreground">
          <ShieldCheck size={13} className="text-risk-low" />
          <span>All flow metrics calibrated to {telemetry.datasetName} timetable telemetry.</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/optimization"
            className="inline-flex items-center gap-1.5 font-mono-ui text-xs font-bold text-primary hover:underline"
            data-testid="link-passenger-to-optimization"
          >
            <span>Execute Fleet Optimization</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </section>
  );
}
