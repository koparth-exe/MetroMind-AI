import React from 'react';
import { AlertTriangle, RefreshCw, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TransportMode } from '@/lib/transport-mode';

interface AnalysisErrorStateProps {
  transportMode: TransportMode;
  errorMessage?: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

export const AnalysisErrorState: React.FC<AnalysisErrorStateProps> = ({
  transportMode,
  errorMessage,
  onRetry,
  isRetrying,
}) => {
  const isBus = transportMode === 'BUS';
  const modeLabel = isBus ? 'Bus' : 'Railway';

  return (
    <div className="min-h-[460px] flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-destructive/30 bg-destructive/5 backdrop-blur-sm p-8 text-center space-y-6 shadow-xl shadow-destructive/5">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-destructive/10 border border-destructive/20 text-xs font-mono font-medium text-destructive tracking-wider uppercase">
            {modeLabel} Analysis
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Analysis Unavailable
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Statistical analysis could not be loaded for the current {modeLabel.toLowerCase()} dataset.
          </p>
          {errorMessage && (
            <p className="text-xs font-mono text-destructive/80 bg-destructive/10 rounded p-2 mt-2 break-all text-left">
              {errorMessage}
            </p>
          )}
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={onRetry}
            disabled={isRetrying}
            className="w-full sm:w-auto gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            Retry Analysis
          </Button>
        </div>
      </div>
    </div>
  );
};

interface AnalysisEmptyStateProps {
  transportMode: TransportMode;
  datasetName?: string;
  onRefresh?: () => void;
}

export const AnalysisEmptyState: React.FC<AnalysisEmptyStateProps> = ({
  transportMode,
  datasetName,
  onRefresh,
}) => {
  const isBus = transportMode === 'BUS';
  const modeLabel = isBus ? 'Bus' : 'Railway';

  return (
    <div className="min-h-[460px] flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-8 text-center space-y-6 shadow-xl">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-muted/30 border border-border/40 flex items-center justify-center text-muted-foreground">
          <Database className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted/40 border border-border/40 text-xs font-mono font-medium text-muted-foreground tracking-wider uppercase">
            {datasetName ?? `${modeLabel} Transit`}
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Insufficient Analytical Data
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The active {modeLabel.toLowerCase()} intake does not contain enough records to compute Pearson/Spearman correlations, OLS regression matrices, or FFT harmonics.
          </p>
        </div>

        {onRefresh && (
          <div className="pt-2 flex justify-center">
            <Button
              variant="outline"
              onClick={onRefresh}
              className="gap-2 border-border/60 hover:bg-accent/40"
            >
              <RefreshCw className="w-4 h-4" />
              Recheck Intake Status
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
