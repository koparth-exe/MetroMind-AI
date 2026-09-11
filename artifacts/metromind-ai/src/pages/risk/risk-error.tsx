import { AlertTriangle, RefreshCw, Database, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/metro-shell';

interface RiskErrorStateProps {
  message?: string;
  retry?: () => void;
}

export function RiskErrorState({
  message = 'The capacity exceedance assessment could not be calculated.',
  retry,
}: RiskErrorStateProps) {
  return (
    <div
      role="alert"
      className="signal-card overflow-hidden rounded-2xl border border-risk-high/40 bg-risk-high/[0.04] p-6 sm:p-8 text-center"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-risk-high/15 text-risk-high">
        <AlertTriangle size={24} />
      </div>

      <h2 className="mt-4 font-display text-lg font-bold text-foreground">
        Risk Assessment Unavailable
      </h2>

      <p className="mx-auto mt-2 max-w-md text-xs text-muted-foreground leading-relaxed">
        {message} This can occur if the backend mathematical engine is recalibrating or if timetable records are currently synchronizing.
      </p>

      {retry && (
        <div className="mt-5 flex justify-center">
          <Button onClick={retry} testId="button-retry-risk" variant="primary">
            <RefreshCw size={14} />
            <span>Retry Calculation</span>
          </Button>
        </div>
      )}
    </div>
  );
}

export function RiskEmptyState({
  message = 'No corridor forecast records are available to evaluate capacity exceedance.',
}: {
  message?: string;
}) {
  return (
    <div
      role="status"
      className="signal-card overflow-hidden rounded-2xl border border-dashed border-border/80 bg-muted/20 p-8 sm:p-10 text-center"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Database size={22} />
      </div>

      <h2 className="mt-4 font-display text-lg font-bold text-foreground">
        Risk Assessment Not Ready
      </h2>

      <p className="mx-auto mt-2 max-w-md text-xs text-muted-foreground leading-relaxed">
        {message} Please ensure a valid timetable dataset has been ingested in Data Intake and demand forecasts have been generated in Prediction.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/data"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-4 py-2 text-xs font-bold text-foreground hover:bg-muted transition-all"
        >
          <span>Go to Data Intake</span>
          <ArrowRight size={13} />
        </Link>
        <Link
          href="/prediction"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:brightness-105 transition-all"
        >
          <span>Go to Prediction</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
