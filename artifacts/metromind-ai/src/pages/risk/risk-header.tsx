import { useState, useEffect } from 'react';
import { Sigma, LoaderCircle, Activity, Train, Bus, Sparkles, Sliders, BookOpen } from 'lucide-react';
import { Button } from '@/components/metro-shell';
import { useTutorial } from '@/components/tutorial-overlay';
import type { RiskScenarioState } from './types';

interface RiskHeaderProps {
  transportMode: 'RAILWAY' | 'BUS';
  datasetName: string;
  modelName: string;
  uncertaintySigma: number;
  scenarioState: RiskScenarioState;
  onScenarioChange: (newScenario: RiskScenarioState) => void;
  onRecalculate: (scenario: RiskScenarioState) => void;
  isPending: boolean;
}

export function RiskHeader({
  transportMode,
  datasetName,
  modelName,
  uncertaintySigma,
  scenarioState,
  onScenarioChange,
  onRecalculate,
  isPending,
}: RiskHeaderProps) {
  const { startTutorial } = useTutorial();
  const isBus = transportMode === 'BUS';

  const [unitCapacity, setUnitCapacity] = useState(String(scenarioState.corridorCapacity));

  // Sync with prop when transport mode changes
  useEffect(() => {
    setUnitCapacity(String(scenarioState.corridorCapacity));
  }, [scenarioState.corridorCapacity]);

  const handleApply = () => {
    const cap = Math.max(1, parseInt(unitCapacity, 10) || (isBus ? 70 : 3000));
    const newScenario: RiskScenarioState = { corridorCapacity: cap };
    onScenarioChange(newScenario);
    onRecalculate(newScenario);
  };

  return (
    <header
      id="risk-header"
      aria-label="Risk Command Header"
      className="signal-card overflow-hidden rounded-2xl border border-border/80 bg-card/95 p-5 shadow-xs sm:p-6"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        {/* Title and Pipeline Eyebrow */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono-ui text-[10px] font-bold uppercase tracking-[.18em] text-primary">
              RISK / 05 · {transportMode}
            </span>
            <span className="h-1 w-1 rounded-full bg-border" aria-hidden="true" />
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 font-mono-ui text-[9px] font-semibold text-primary">
              <Activity size={10} className="animate-pulse" />
              Calibrated & Synchronized
            </span>
            <Button
              onClick={() => startTutorial(5)}
              variant="outline"
              testId="button-risk-tutorial"
              className="ml-auto inline-flex py-1 px-2.5 min-h-0 text-[11px]"
            >
              <BookOpen size={12} className="text-primary" />
              <span>Guide</span>
            </Button>
          </div>

          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Capacity Exceedance
          </h1>

          <p className="max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Translate forecast demand into capacity exposure, overload probability, and operational risk.
            Evaluates whether nominal corridor allocations can absorb projected passenger peaks.
          </p>

          {/* Context Telemetry Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-foreground">
              {isBus ? <Bus size={12} className="text-primary" /> : <Train size={12} className="text-primary" />}
              <span>{isBus ? 'BEST Bus Network' : 'Suburban Railway'}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-foreground">
              <span className="font-mono-ui text-[9.5px] uppercase tracking-wider text-muted-foreground">Dataset:</span>
              <span className="font-mono-ui font-semibold text-foreground">{datasetName}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-foreground">
              <Sparkles size={11} className="text-accent" />
              <span className="font-mono-ui text-[9.5px] uppercase tracking-wider text-muted-foreground">Champion:</span>
              <span className="font-semibold text-foreground">{modelName}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-foreground">
              <Sigma size={11} className="text-primary" />
              <span className="font-mono-ui text-[9.5px] uppercase tracking-wider text-muted-foreground">Residual Uncertainty:</span>
              <span className="font-mono-ui font-bold text-foreground">±{Math.round(uncertaintySigma * 10) / 10} pax/h</span>
            </div>
          </div>
        </div>

        {/* Interactive Scenario Assumptions Panel */}
        <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 sm:p-4 w-full lg:w-auto lg:min-w-[340px] space-y-3">
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <Sliders size={13} className="text-primary" />
              <span>Scenario Assumptions</span>
            </div>
            <span className="font-mono-ui text-[9px] uppercase tracking-wider text-muted-foreground">
              Corridor Calibration
            </span>
          </div>

          <div className="space-y-1">
            <label htmlFor="risk-unit-capacity" className="block font-mono-ui text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              Nominal Capacity / Corridor (pax/h)
            </label>
            <div className="relative">
              <input
                id="risk-unit-capacity"
                type="number"
                min="10"
                step={isBus ? '5' : '100'}
                value={unitCapacity}
                onChange={(e) => setUnitCapacity(e.target.value)}
                className="w-full rounded-lg border border-border/80 bg-card px-2.5 py-1.5 font-mono-ui text-xs font-bold text-foreground shadow-2xs focus:border-primary focus:outline-none pr-12"
              />
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 font-mono-ui text-[10px] font-medium text-muted-foreground">
                pax/h
              </span>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Risk evaluates each active corridor against its nominal capacity. Fleet allocation is solved in Optimization.
          </p>

          <Button
            onClick={handleApply}
            disabled={isPending}
            testId="button-calculate-risk"
            className="w-full"
          >
            {isPending ? (
              <>
                <LoaderCircle size={14} className="animate-spin" />
                <span>Recalculating Risk...</span>
              </>
            ) : (
              <>
                <Sigma size={14} />
                <span>Recalculate Risk</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
