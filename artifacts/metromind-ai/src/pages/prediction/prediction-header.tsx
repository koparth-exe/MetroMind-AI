import { Activity, BookOpen, BusFront, LoaderCircle, RefreshCw, ShieldCheck, Sparkles, TrainFront } from 'lucide-react';
import { Button } from '@/components/metro-shell';
import { useTutorial } from '@/components/tutorial-overlay';
import type { TransportMode } from '@/lib/transport-mode';

interface PredictionHeaderProps {
  transportMode: TransportMode;
  datasetName: string;
  activeModel: string;
  isPending: boolean;
  isError: boolean;
  onRefresh: () => void;
}

export function PredictionHeader({
  transportMode,
  datasetName,
  activeModel,
  isPending,
  isError,
  onRefresh,
}: PredictionHeaderProps) {
  const { startTutorial } = useTutorial();
  const isBus = transportMode === 'BUS';
  const ModeIcon = isBus ? BusFront : TrainFront;
  const modeTitle = isBus ? 'BEST Bus Network' : 'Suburban Railway Network';

  return (
    <header
      id="prediction-header"
      aria-label="Prediction Command Context"
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
              <Sparkles size={11} className="text-primary animate-pulse" />
              METROMIND / FORECAST / DEMAND PREDICTION
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/60 px-2.5 py-0.5 font-mono-ui text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              <ModeIcon size={12} className="text-primary" />
              {modeTitle}
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2.5 py-0.5 font-mono-ui text-[9.5px] font-medium uppercase tracking-wider text-muted-foreground/90">
              <ShieldCheck size={12} className="text-risk-low" />
              {isBus ? 'BUS' : 'RAILWAY'} / {datasetName}
            </span>

            {activeModel && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/[0.07] px-2.5 py-0.5 font-mono-ui text-[9.5px] font-medium uppercase tracking-wider text-primary">
                MODEL: {activeModel}
              </span>
            )}
          </div>

          {/* Primary Headline */}
          <div className="pt-1">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-[28px] lg:text-[32px]">
              Demand Forecasting
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm leading-relaxed max-w-3xl">
              Use trained demand models to estimate future passenger pressure across the selected transport network under customizable scenario conditions.
            </p>
          </div>
        </div>

        {/* Operational Status & Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start md:self-center">
          {/* Compact Status Beacon */}
          <div
            data-testid="status-prediction-beacon"
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono-ui text-[11px] font-semibold transition-colors ${
              isPending
                ? 'border-risk-medium/40 bg-risk-medium/10 text-risk-medium'
                : isError
                ? 'border-risk-high/40 bg-risk-high/10 text-risk-high'
                : 'border-risk-low/30 bg-risk-low/10 text-risk-low'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isPending
                  ? 'bg-risk-medium animate-spin'
                  : isError
                  ? 'bg-risk-high'
                  : 'bg-risk-low animate-pulse'
              }`}
            />
            <span>
              {isPending
                ? 'FORECAST ENGINE · COMPUTING...'
                : isError
                ? 'FORECAST ENGINE · ERROR'
                : 'FORECAST ENGINE · ACTIVE'}
            </span>
          </div>

          {/* Tutorial Guide Trigger (Step index 4 is Prediction) */}
          <Button
            onClick={() => startTutorial(4)}
            variant="outline"
            testId="button-prediction-tutorial"
            className="hidden sm:inline-flex"
          >
            <BookOpen size={14} className="text-primary" />
            <span>Guide</span>
          </Button>

          {/* Signal Refresh Action */}
          <Button
            onClick={onRefresh}
            variant="outline"
            disabled={isPending}
            testId="button-refresh-prediction"
          >
            {isPending ? (
              <LoaderCircle size={14} className="animate-spin text-primary" />
            ) : (
              <RefreshCw size={14} className="text-primary" />
            )}
            <span>Refresh</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
