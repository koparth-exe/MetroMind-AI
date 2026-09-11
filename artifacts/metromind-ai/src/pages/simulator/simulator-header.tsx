import { SlidersHorizontal, Database, CheckCircle2, ShieldAlert, Waypoints, BookOpen, FlaskConical, Play } from 'lucide-react';
import type { TransportMode } from './types';
import { useTutorial } from '@/components/tutorial-overlay';
import { Button } from '@/components/metro-shell';

interface SimulatorHeaderProps {
  transportMode: TransportMode;
  datasetName: string;
  hasExecutedScenario: boolean;
  isSimulating: boolean;
}

export function SimulatorHeader({
  transportMode,
  datasetName,
  hasExecutedScenario,
  isSimulating,
}: SimulatorHeaderProps) {
  const { startTutorial } = useTutorial();
  const isBus = transportMode === 'BUS';
  const networkTitle = isBus ? 'BEST Bus Network' : 'Suburban Railway Network';

  return (
    <header id="simulator-header" className="mb-7 md:mb-8 animate-page-enter">
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
        <span className="inline-flex items-center gap-1 text-foreground/80">
          <Waypoints size={11} className="text-primary" /> 8H Optimization
        </span>
        <span>→</span>
        <span className="inline-flex items-center gap-1 text-primary font-bold">
          <FlaskConical size={11} /> 8I Simulator
        </span>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          {/* Eyebrow and Status Beacons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${isSimulating ? 'animate-ping bg-accent' : 'bg-primary'}`} />
              <span className={`relative inline-flex h-2 w-2 rounded-full ${isSimulating ? 'bg-accent' : 'bg-primary'}`} />
            </span>
            <span className="font-mono-ui text-[10px] font-semibold uppercase tracking-[.22em] text-primary">
              SIMULATOR / 07 · {networkTitle}
            </span>
            <span className="h-1 w-1 rounded-full bg-border" aria-hidden="true" />
            <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-card/60 px-2 py-0.5 font-mono-ui text-[9px] font-medium text-muted-foreground">
              <Database size={10} className="text-primary" />
              {datasetName}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono-ui text-[9px] font-medium transition-colors ${
                hasExecutedScenario
                  ? 'border-accent/40 bg-accent/10 text-accent font-semibold'
                  : 'border-primary/30 bg-primary/5 text-primary'
              }`}
            >
              <SlidersHorizontal size={10} />
              {hasExecutedScenario ? 'Scenario Executed' : 'Baseline Ready · Awaiting Run'}
            </span>

            <Button
              onClick={() => startTutorial(7)}
              variant="outline"
              testId="button-simulator-tutorial"
              className="ml-auto inline-flex py-1 px-2.5 min-h-0 text-[11px]"
            >
              <BookOpen size={12} className="text-primary" />
              <span>Guide</span>
            </Button>
          </div>

          <h1 className="mt-2 font-display text-[1.65rem] font-bold tracking-[-.04em] text-foreground sm:text-3xl md:text-[36px] leading-tight">
            Stress the network before conditions stress you.
          </h1>
          <p className="mt-2 max-w-3xl text-xs sm:text-sm leading-6 text-muted-foreground">
            Evaluate how changing operational factors—monsoon rainfall, thermal sensitivity, commute surges, and unexpected corridor suspensions—alter passenger demand and service capacity against nominal baseline timetables.
          </p>
        </div>
      </div>
    </header>
  );
}
