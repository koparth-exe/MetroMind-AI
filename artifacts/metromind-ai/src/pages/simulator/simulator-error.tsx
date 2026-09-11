import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/metro-shell';

interface SimulatorErrorProps {
  message?: string;
  onRetry: () => void;
}

export function SimulatorError({
  message = 'Failed to load transit simulation baseline. Please ensure the backend API server is operational.',
  onRetry,
}: SimulatorErrorProps) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-center space-y-4 max-w-xl mx-auto my-8"
    >
      <div className="grid h-12 w-12 place-items-center rounded-full bg-destructive/20 text-destructive mx-auto">
        <AlertTriangle size={24} />
      </div>

      <div className="space-y-1">
        <h3 className="font-display text-base font-bold text-foreground">
          Simulation Pipeline Error
        </h3>
        <p className="font-mono-ui text-xs text-muted-foreground leading-relaxed">
          {message}
        </p>
      </div>

      <Button
        onClick={onRetry}
        variant="outline"
        testId="button-retry-simulator"
        className="mx-auto inline-flex items-center gap-2"
      >
        <RefreshCw size={14} />
        <span>Retry Pipeline Connection</span>
      </Button>
    </div>
  );
}
