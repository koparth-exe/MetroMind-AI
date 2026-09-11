import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/metro-shell';

interface OptimizationErrorProps {
  errorTitle?: string;
  errorMessage?: string;
  onRetry?: () => void;
}

export function OptimizationError({
  errorTitle = 'Optimization Service Unavailable',
  errorMessage = 'The mathematical allocation engine could not be reached. The workbench is showing baseline network telemetry.',
  onRetry,
}: OptimizationErrorProps) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-destructive/30 bg-destructive/[0.05] p-6 sm:p-8 text-center"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/15 text-destructive mb-3">
        <AlertTriangle size={24} />
      </div>
      <h3 className="font-display text-lg font-bold text-foreground">{errorTitle}</h3>
      <p className="mx-auto mt-1 max-w-md text-xs sm:text-sm text-muted-foreground leading-relaxed">
        {errorMessage}
      </p>

      {onRetry && (
        <div className="mt-5 flex justify-center">
          <Button onClick={onRetry} variant="outline" testId="button-retry-optimization">
            <RefreshCw size={13} />
            <span>Retry Connection</span>
          </Button>
        </div>
      )}
    </div>
  );
}
