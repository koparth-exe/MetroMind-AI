import { Database, RefreshCw, FlaskConical, LoaderCircle, TrainFront, BusFront, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/metro-shell';
import type { TransportMode } from '@/lib/transport-mode';

interface DataHeaderProps {
  transportMode: TransportMode;
  datasetName: string;
  isDemo: boolean;
  isPending: boolean;
  isError: boolean;
  onLoadDemo: () => void;
  onRefresh: () => void;
  recordsCount: number;
}

export function DataHeader({
  transportMode,
  datasetName,
  isDemo,
  isPending,
  isError,
  onLoadDemo,
  onRefresh,
  recordsCount,
}: DataHeaderProps) {
  const isBus = transportMode === 'BUS';
  const ModeIcon = isBus ? BusFront : TrainFront;
  const modeTitle = isBus ? 'BEST Bus Network' : 'Suburban Railway Network';

  return (
    <section
      aria-label="Data Ingestion Command Context"
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
              <Database size={11} className="text-primary animate-pulse" />
              METROMIND / INTAKE / TELEMETRY PIPELINE
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/60 px-2.5 py-0.5 font-mono-ui text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              <ModeIcon size={12} className="text-primary" />
              {modeTitle}
            </span>

            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2.5 py-0.5 font-mono-ui text-[9.5px] font-medium uppercase tracking-wider text-muted-foreground/80">
              <ShieldCheck size={12} className={recordsCount > 0 ? 'text-risk-low' : 'text-muted-foreground'} />
              {datasetName} {recordsCount > 0 ? `(${recordsCount.toLocaleString()} rows)` : '(Awaiting telemetry)'}
            </span>
          </div>

          {/* Primary Headline */}
          <div className="pt-1">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-[28px] lg:text-[32px]">
              Data Intake & Quality Control
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm leading-relaxed max-w-3xl">
              Validate and activate timetable telemetry for network analysis. Ingested datasets directly calibrate downstream prediction models, risk exceedance curves, and fleet optimization solvers.
            </p>
          </div>
        </div>

        {/* Operational Status & Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start md:self-center">
          {/* Real-time Status Badge */}
          <div
            data-testid="status-pipeline-beacon"
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 font-mono-ui text-xs font-semibold shadow-2xs backdrop-blur-xs transition-colors ${
              isPending
                ? 'border-risk-medium/40 bg-risk-medium/10 text-risk-medium'
                : isError
                ? 'border-risk-high/40 bg-risk-high/10 text-risk-high'
                : 'border-risk-low/30 bg-risk-low/10 text-risk-low'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isPending
                  ? 'bg-risk-medium animate-spin'
                  : isError
                  ? 'bg-risk-high'
                  : 'bg-risk-low animate-pulse'
              }`}
            />
            <span>
              {isPending
                ? 'VALIDATING PIPELINE...'
                : isError
                ? 'VALIDATION REJECTED'
                : 'PIPELINE: ACTIVE & VALIDATED'}
            </span>
          </div>

          {/* Load Demo Data Button */}
          <Button
            onClick={onLoadDemo}
            disabled={isPending}
            variant="outline"
            testId="button-load-demo"
            className="border-border/70 bg-card/80 font-mono-ui text-xs font-semibold text-foreground hover:bg-muted/80 shadow-2xs"
          >
            {isPending ? (
              <LoaderCircle size={13} className="animate-spin text-primary" />
            ) : (
              <FlaskConical size={13} className="text-primary" />
            )}
            <span>Load Demo Baseline</span>
          </Button>

          {/* Signal Refresh Button */}
          <Button
            onClick={onRefresh}
            disabled={isPending}
            variant="quiet"
            testId="button-refresh-data"
            className="p-2 text-muted-foreground hover:text-foreground"
            aria-label="Refresh pipeline telemetry signal"
          >
            <RefreshCw size={14} className={isPending ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>
    </section>
  );
}
