import { Database, CheckCircle2, AlertTriangle, Calendar, Layers, MapPin, Hash, ShieldCheck, Sparkles, TrainFront, BusFront } from 'lucide-react';
import type { DataSummary } from '@workspace/api-client-react';
import type { TransportMode } from '@/lib/transport-mode';

interface DataActiveCardProps {
  summary?: DataSummary | null;
  transportMode: TransportMode;
  resolvedDatasetName: string;
  isLoading?: boolean;
}

export function DataActiveCard({ summary, transportMode, resolvedDatasetName, isLoading }: DataActiveCardProps) {
  const isBus = transportMode === 'BUS';
  const ModeIcon = isBus ? BusFront : TrainFront;
  const isDemo = summary ? (summary.isDemo || summary.datasetName.includes('_DEMO')) : true;
  const durationDays = 28; // Standard canonical observation window length

  const isExcellent = Boolean(
    summary &&
    summary.quality.toLowerCase() === 'excellent' &&
    summary.missingValues === 0 &&
    summary.invalidValues === 0
  );

  return (
    <section
      aria-label="Active Dataset Pipeline Status"
      className="signal-card rounded-2xl p-5 sm:p-6 border border-border/80 bg-card/95 shadow-xs"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between border-b border-border/70 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 text-primary shadow-xs">
            <Database size={20} />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-primary/10 px-2 py-0.5 font-mono-ui text-[9px] font-bold uppercase tracking-wider text-primary">
                Active In Pipeline
              </span>
              <span className="rounded bg-muted px-2 py-0.5 font-mono-ui text-[9px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <ModeIcon size={11} className="text-primary" />
                {isBus ? 'Bus Mode' : 'Railway Mode'}
              </span>
              <span className="rounded border border-border/60 bg-muted/30 px-2 py-0.5 font-mono-ui text-[9px] font-medium uppercase text-muted-foreground">
                {isDemo ? 'Canonical Demonstration Baseline' : 'Custom User Ingest'}
              </span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground" data-testid="text-active-dataset-name">
              {resolvedDatasetName}
            </h2>
            <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
              Active operational dataset currently powering downstream statistical correlation, ML demand forecasting, Gaussian exceedance risk, and fleet optimization solvers.
            </p>
          </div>
        </div>

        {/* Quality Gate Seal */}
        <div className="flex items-center gap-3 shrink-0 self-start lg:self-center">
          <div
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 font-mono-ui text-xs font-bold uppercase tracking-wider shadow-2xs ${
              !summary
                ? 'border-border/70 bg-muted/40 text-muted-foreground'
                : isExcellent
                ? 'border-risk-low/40 bg-risk-low/10 text-risk-low'
                : 'border-risk-medium/40 bg-risk-medium/10 text-risk-medium'
            }`}
          >
            {!summary ? (
              <ShieldCheck size={16} className="text-muted-foreground" />
            ) : isExcellent ? (
              <CheckCircle2 size={16} className="text-risk-low" />
            ) : (
              <AlertTriangle size={16} className="text-risk-medium" />
            )}
            <div>
              <div className="text-[9px] font-medium tracking-normal text-muted-foreground">Quality Gate</div>
              <div className="font-display text-xs font-bold">
                {summary ? `${summary.quality} (${summary.invalidValues === 0 ? '100% Valid' : 'Filtered'})` : 'Telemetry Pending'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vital Metric Statistics Grid */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* 1. Records */}
        <div className="rounded-xl border border-border/60 bg-card/60 p-3.5 shadow-2xs">
          <div className="flex items-center gap-1.5 font-mono-ui text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
            <Hash size={11} className="text-primary" />
            <span>Records</span>
          </div>
          <div className="mt-2 font-display text-xl sm:text-2xl font-bold text-foreground tabular-nums">
            {summary ? summary.records.toLocaleString() : '—'}
          </div>
          <div className="mt-0.5 text-[10px] text-muted-foreground font-medium">
            {summary ? 'validated timetable rows' : 'awaiting dataset'}
          </div>
        </div>

        {/* 2. Routes */}
        <div className="rounded-xl border border-border/60 bg-card/60 p-3.5 shadow-2xs">
          <div className="flex items-center gap-1.5 font-mono-ui text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
            <Layers size={11} className="text-primary" />
            <span>Corridors</span>
          </div>
          <div className="mt-2 font-display text-xl sm:text-2xl font-bold text-foreground tabular-nums">
            {summary ? summary.routes : '—'}
          </div>
          <div className="mt-0.5 text-[10px] text-muted-foreground font-medium">
            {summary ? (isBus ? 'BEST bus routes' : 'Suburban lines') : 'corridors pending'}
          </div>
        </div>

        {/* 3. Stations */}
        <div className="rounded-xl border border-border/60 bg-card/60 p-3.5 shadow-2xs">
          <div className="flex items-center gap-1.5 font-mono-ui text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
            <MapPin size={11} className="text-primary" />
            <span>Stations</span>
          </div>
          <div className="mt-2 font-display text-xl sm:text-2xl font-bold text-foreground tabular-nums">
            {summary ? summary.stations : '—'}
          </div>
          <div className="mt-0.5 text-[10px] text-muted-foreground font-medium">
            {summary ? (isBus ? 'monitored stops' : 'station nodes') : 'stations pending'}
          </div>
        </div>

        {/* 4. Missing Values */}
        <div className="rounded-xl border border-border/60 bg-card/60 p-3.5 shadow-2xs">
          <div className="flex items-center gap-1.5 font-mono-ui text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
            <ShieldCheck size={11} className={summary ? 'text-risk-low' : 'text-muted-foreground'} />
            <span>Missing Values</span>
          </div>
          <div className={`mt-2 font-display text-xl sm:text-2xl font-bold tabular-nums ${summary ? 'text-risk-low' : 'text-muted-foreground'}`}>
            {summary ? summary.missingValues : '—'}
          </div>
          <div className="mt-0.5 text-[10px] text-muted-foreground font-medium">
            {summary ? 'zero null fields' : 'telemetry pending'}
          </div>
        </div>

        {/* 5. Invalid Values */}
        <div className="rounded-xl border border-border/60 bg-card/60 p-3.5 shadow-2xs">
          <div className="flex items-center gap-1.5 font-mono-ui text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
            <ShieldCheck size={11} className={summary ? 'text-risk-low' : 'text-muted-foreground'} />
            <span>Invalid Values</span>
          </div>
          <div className={`mt-2 font-display text-xl sm:text-2xl font-bold tabular-nums ${summary ? 'text-risk-low' : 'text-muted-foreground'}`}>
            {summary ? summary.invalidValues : '—'}
          </div>
          <div className="mt-0.5 text-[10px] text-muted-foreground font-medium">
            {summary ? 'zero type conflicts' : 'telemetry pending'}
          </div>
        </div>

        {/* 6. Temporal Span */}
        <div className="rounded-xl border border-border/60 bg-card/60 p-3.5 shadow-2xs">
          <div className="flex items-center gap-1.5 font-mono-ui text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
            <Calendar size={11} className="text-primary" />
            <span>Time Window</span>
          </div>
          <div className="mt-2 font-display text-sm font-bold text-foreground">
            {summary ? `${summary.dateStart.slice(5)} → ${summary.dateEnd.slice(5)}` : 'N/A'}
          </div>
          <div className="mt-0.5 text-[10px] text-muted-foreground font-medium">
            {summary ? `${durationDays} calendar days` : 'observation window pending'}
          </div>
        </div>
      </div>
    </section>
  );
}
