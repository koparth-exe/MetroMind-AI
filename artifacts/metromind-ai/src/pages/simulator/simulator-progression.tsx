import React from 'react';
import { Link } from 'wouter';
import { ArrowLeft, ArrowRight, Waypoints, BarChart3 } from 'lucide-react';
import type { TransportMode } from './types';

interface SimulatorProgressionProps {
  transportMode: TransportMode;
}

export function SimulatorProgression({ transportMode }: SimulatorProgressionProps) {
  const isBus = transportMode === 'BUS';

  return (
    <nav
      id="simulator-progression"
      aria-label="Workflow Progression from Simulator"
      className="mt-8 rounded-xl border border-border/70 bg-gradient-to-r from-card/80 via-card/50 to-background/80 p-4 sm:p-6 shadow-sm"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <span className="font-mono-ui text-[10px] font-semibold uppercase tracking-wider text-primary">
            Decision Progression · 8I Simulator Complete
          </span>
          <h3 className="font-display text-base font-bold text-foreground">
            Continue Transit Decision Workflow
          </h3>
          <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
            Fleet allocation quotas are mathematically optimized in 8H Optimization and stress-tested under disruption in 8I Simulator. Proceed to 8J Models to inspect empirical machine learning holdout errors.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 font-mono-ui text-xs font-semibold">
          <Link
            href="/optimization"
            data-testid="button-simulator-to-optimization"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/80 px-3.5 py-2 text-foreground hover:border-primary hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs"
          >
            <ArrowLeft size={14} />
            <span>Return to Optimization</span>
          </Link>

          <Link
            href="/models"
            data-testid="button-simulator-to-models"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-primary-foreground hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-xs"
          >
            <span>Inspect Models (8J)</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </nav>
  );
}
