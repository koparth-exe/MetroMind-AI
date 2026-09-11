import { RefreshCw, Activity, TrainFront, BusFront, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/metro-shell';
import type { TransportMode } from '@/lib/transport-mode';

interface OverviewHeroProps {
  transportMode: TransportMode;
  datasetName: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  systemStatus?: string;
}

export function OverviewHero({
  transportMode,
  datasetName,
  isRefreshing,
  onRefresh,
  systemStatus = 'OPERATIONAL',
}: OverviewHeroProps) {
  const isBus = transportMode === 'BUS';
  const ModeIcon = isBus ? BusFront : TrainFront;
  const modeTitle = isBus ? 'BEST Bus Network' : 'Suburban Railway Network';
  const corridorLabel = isBus ? 'City feeder & ring corridors' : 'Central, Western & Harbour lines';

  return (
    <section
      aria-label="Network Command Context"
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
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              COMMAND CENTER · 01
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/60 px-2.5 py-0.5 font-mono-ui text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              <ModeIcon size={12} className="text-primary" />
              {modeTitle}
            </span>

            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2.5 py-0.5 font-mono-ui text-[9.5px] font-medium uppercase tracking-wider text-muted-foreground/80">
              <ShieldCheck size={12} className="text-risk-low" />
              {datasetName}
            </span>
          </div>

          {/* Primary Command Center Headline */}
          <div className="pt-1">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-[28px] lg:text-[32px]">
              Mumbai Transportation Intelligence
            </h1>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
              Real-time operational dispatch and risk surveillance across active {corridorLabel}. All signals calibrated to active timetable records.
            </p>
          </div>
        </div>

        {/* Right side operational actions & status pill */}
        <div className="flex shrink-0 flex-wrap items-center gap-2.5 sm:gap-3">
          <div
            className="flex items-center gap-2 rounded-xl border border-border/80 bg-muted/40 px-3 py-2 font-mono-ui text-[10px]"
            title="System operational integrity verified"
          >
            <Activity size={13} className="text-primary animate-pulse-line" />
            <div className="flex flex-col">
              <span className="text-[8.5px] uppercase tracking-wider text-muted-foreground">STATE</span>
              <span className="font-bold uppercase tracking-wider text-foreground">{systemStatus}</span>
            </div>
          </div>

          <Button
            onClick={onRefresh}
            variant="outline"
            disabled={isRefreshing}
            testId="button-refresh-dashboard"
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
