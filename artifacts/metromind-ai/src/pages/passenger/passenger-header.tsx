import { RefreshCw, Activity, Users, TrainFront, BusFront, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/metro-shell';
import type { TransportMode } from '@/lib/transport-mode';

interface PassengerHeaderProps {
  transportMode: TransportMode;
  datasetName: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  systemStatus?: string;
  recordsCount: number;
}

export function PassengerHeader({
  transportMode,
  datasetName,
  isRefreshing,
  onRefresh,
  systemStatus = 'OPERATIONAL',
  recordsCount,
}: PassengerHeaderProps) {
  const isBus = transportMode === 'BUS';
  const ModeIcon = isBus ? BusFront : TrainFront;
  const modeTitle = isBus ? 'BEST Bus Network' : 'Suburban Railway Network';
  const corridorContext = isBus ? 'feeder & ring corridors' : 'Central, Western & Harbour corridors';

  return (
    <section
      aria-label="Passenger Flow Command Context"
      className="relative mb-6 overflow-hidden rounded-2xl border border-border/80 bg-card/95 p-5 shadow-xs transition-all backdrop-blur-md sm:p-6 lg:mb-7"
    >
      {/* Background architectural signal watermark */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-primary/5 blur-2xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-24 w-64 bg-accent/3 blur-3xl" />

      <div className="relative flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="min-w-0 space-y-1.5">
          {/* Eyebrow telemetry badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 font-mono-ui text-[9.5px] font-bold uppercase tracking-[0.16em] text-primary">
              <Users size={11} className="text-primary animate-pulse" />
              PASSENGER FLOW · MONITOR
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/60 px-2.5 py-0.5 font-mono-ui text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              <ModeIcon size={12} className="text-primary" />
              {modeTitle}
            </span>

            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2.5 py-0.5 font-mono-ui text-[9.5px] font-medium uppercase tracking-wider text-muted-foreground/80">
              <ShieldCheck size={12} className="text-risk-low" />
              {datasetName} ({recordsCount.toLocaleString()} obs)
            </span>
          </div>

          {/* Primary Headline */}
          <div className="pt-1">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-[28px] lg:text-[32px]">
              Passenger Flow & Crowding Intelligence
            </h1>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
              Surveillance of passenger boarding volumes, diurnal inflow crests, and vehicle capacity headroom across active {corridorContext}.
            </p>
          </div>
        </div>

        {/* Right side operational actions & status pill */}
        <div className="flex shrink-0 flex-wrap items-center gap-2.5 sm:gap-3">
          <div
            className="flex items-center gap-2 rounded-xl border border-border/80 bg-muted/40 px-3 py-2 font-mono-ui text-[10px]"
            title="Passenger flow calibration status"
          >
            <Activity size={13} className="text-primary animate-pulse-line" />
            <div className="flex flex-col">
              <span className="text-[8.5px] uppercase tracking-wider text-muted-foreground">FLOW STATE</span>
              <span className="font-bold uppercase tracking-wider text-foreground">{systemStatus}</span>
            </div>
          </div>

          <Button
            onClick={onRefresh}
            variant="outline"
            disabled={isRefreshing}
            testId="button-refresh-passenger-flow"
            className="min-h-10 px-4 font-mono-ui text-xs font-semibold"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-primary' : 'text-primary'} />
            <span>{isRefreshing ? 'Recalibrating…' : 'Refresh signal'}</span>
          </Button>
        </div>
      </div>
    </section>
  );
}
