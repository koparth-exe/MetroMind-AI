import { Sparkles, Database, Waypoints, CheckCircle2, ShieldAlert, BookOpen } from 'lucide-react';
import type { TransportMode } from '@/lib/transport-mode';
import { useTutorial } from '@/components/tutorial-overlay';
import { Button } from '@/components/metro-shell';
import { getModeNomenclature } from './types';

interface OptimizationHeaderProps {
  transportMode: TransportMode;
}

export function OptimizationHeader({ transportMode }: OptimizationHeaderProps) {
  const mode = getModeNomenclature(transportMode);
  const { startTutorial } = useTutorial();

  return (
    <header id="optimization-header" className="mb-7 md:mb-8 animate-page-enter">
      {/* Workflow Breadcrumb Ribbon */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5 font-mono-ui text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1 text-foreground/80">
          <CheckCircle2 size={11} className="text-primary" /> 8D Intake
        </span>
        <span>→</span>
        <span className="inline-flex items-center gap-1 text-foreground/80">
          <CheckCircle2 size={11} className="text-primary" /> 8E Analysis
        </span>
        <span>→</span>
        <span className="inline-flex items-center gap-1 text-foreground/80">
          <CheckCircle2 size={11} className="text-primary" /> 8F Forecast
        </span>
        <span>→</span>
        <span className="inline-flex items-center gap-1 text-foreground/80">
          <ShieldAlert size={11} className="text-risk-medium" /> 8G Risk
        </span>
        <span>→</span>
        <span className="inline-flex items-center gap-1 text-primary font-bold">
          <Waypoints size={11} /> 8H Optimization
        </span>
        <span>→</span>
        <span className="text-muted-foreground/60">8I Simulator</span>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          {/* Eyebrow and Status Beacons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="font-mono-ui text-[10px] font-semibold uppercase tracking-[.22em] text-primary">
              OPTIMIZATION / 06 · {mode.vehiclePluralTitleCase} ALLOCATION
            </span>
            <span className="h-1 w-1 rounded-full bg-border" aria-hidden="true" />
            <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-card/60 px-2 py-0.5 font-mono-ui text-[9px] font-medium text-muted-foreground">
              <Database size={10} className="text-primary" />
              {mode.datasetName}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 font-mono-ui text-[9px] font-medium text-primary">
              <Sparkles size={10} />
              Solver Active
            </span>
            <Button
              onClick={() => startTutorial(6)}
              variant="outline"
              testId="button-optimization-tutorial"
              className="ml-auto inline-flex py-1 px-2.5 min-h-0 text-[11px]"
            >
              <BookOpen size={12} className="text-primary" />
              <span>Guide</span>
            </Button>
          </div>

          <h1 className="mt-2 font-display text-[1.65rem] font-bold tracking-[-.04em] text-foreground sm:text-3xl md:text-[36px] leading-tight">
            Make the constraint legible.
          </h1>
          <p className="mt-2 max-w-3xl text-xs sm:text-sm leading-6 text-muted-foreground">
            The recommended {mode.vehicleSingular} fleet is a constrained decision, not a guess: allocate available {mode.vehiclePlural} against predicted passenger demand to eliminate unserved overcrowding while penalizing idle unused capacity.
          </p>
        </div>
      </div>
    </header>
  );
}
