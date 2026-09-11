import { AlertTriangle, Database, RefreshCw, RotateCcw } from 'lucide-react';
import { Button } from '@/components/metro-shell';
import type { TransportMode } from '@/lib/transport-mode';

interface PredictionErrorStateProps {
  transportMode: TransportMode;
  errorMessage?: string;
  onRetry: () => void;
  isRetrying: boolean;
}

export function PredictionErrorState({
  transportMode,
  errorMessage,
  onRetry,
  isRetrying,
}: PredictionErrorStateProps) {
  const isValidationError = errorMessage?.includes('422') || errorMessage?.toLowerCase().includes('validation');

  return (
    <section
      role="alert"
      aria-label="Prediction Error Diagnostics"
      className="signal-card rounded-2xl border border-risk-high/30 bg-risk-high/[0.04] p-6 sm:p-8 text-center shadow-xs"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-risk-high/40 bg-risk-high/10 text-risk-high shadow-xs">
        <AlertTriangle size={24} />
      </div>

      <h2 className="mt-4 font-display text-lg font-bold text-foreground sm:text-xl">
        {isValidationError ? 'Scenario Parameter Validation Error' : 'Forecasting Engine Unavailable'}
      </h2>

      <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-muted-foreground sm:text-sm">
        {isValidationError
          ? 'The specified scenario condition vector contains out-of-bounds parameters (such as hour outside 0–23 or demand multiplier outside 0.1–3.0). Reset parameters to default baseline.'
          : errorMessage || `Unable to compute route-level demand forecasts for the ${transportMode === 'BUS' ? 'BEST Bus' : 'Suburban Railway'} network. Verify that the backend mathematical service is running.`}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button
          onClick={onRetry}
          disabled={isRetrying}
          testId="button-retry-prediction"
          className="gap-2"
        >
          <RefreshCw size={14} className={isRetrying ? 'animate-spin' : ''} />
          <span>{isRetrying ? 'Retrying...' : 'Retry Forecast'}</span>
        </Button>
      </div>
    </section>
  );
}

interface PredictionEmptyStateProps {
  transportMode: TransportMode;
  datasetName: string;
  onRefresh: () => void;
}

export function PredictionEmptyState({
  transportMode,
  datasetName,
  onRefresh,
}: PredictionEmptyStateProps) {
  return (
    <section
      role="status"
      aria-label="No Forecast Observations Available"
      className="signal-card rounded-2xl border border-border/80 bg-card/60 p-8 sm:p-10 text-center shadow-xs"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border/80 bg-muted/40 text-muted-foreground">
        <Database size={22} />
      </div>

      <h2 className="mt-4 font-display text-base font-bold text-foreground sm:text-lg">
        No Corridors Available for Forecast
      </h2>

      <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
        The active dataset ({datasetName}) for {transportMode === 'BUS' ? 'BEST Bus' : 'Suburban Railway'} does not contain sufficient verified corridor observations to generate calibrated demand predictions.
      </p>

      <div className="mt-6 flex justify-center">
        <Button onClick={onRefresh} testId="button-empty-refresh-prediction">
          Refresh Network Data
        </Button>
      </div>
    </section>
  );
}
