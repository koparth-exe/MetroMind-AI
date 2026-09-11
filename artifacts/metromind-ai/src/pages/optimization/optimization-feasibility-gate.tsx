import { AlertOctagon, CheckCircle2, Wrench } from 'lucide-react';
import type { FeasibilityCheckResult, OptimizationScenarioState } from './types';

interface OptimizationFeasibilityGateProps {
  feasibility: FeasibilityCheckResult;
  onApplyRemediation: (patch: Partial<OptimizationScenarioState>) => void;
  routeCount: number;
  availableFleet: number;
  minVehicles: number;
}

export function OptimizationFeasibilityGate({
  feasibility,
  onApplyRemediation,
  routeCount,
  availableFleet,
  minVehicles,
}: OptimizationFeasibilityGateProps) {
  if (!feasibility.isFeasible) {
    return (
      <div
        id="optimization-feasibility-gate"
        role="alert"
        aria-live="assertive"
        className="rounded-xl border border-destructive/40 bg-destructive/[0.06] p-4 shadow-sm animate-in fade-in slide-in-from-top-1 duration-200"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-destructive/15 p-2 text-destructive shrink-0 mt-0.5">
              <AlertOctagon size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono-ui text-[9.5px] uppercase font-bold tracking-wider text-destructive">
                  CONSTRAINT INFEASIBLE · SOLVER BLOCKED
                </span>
              </div>
              <h3 className="font-display text-sm font-bold text-foreground mt-0.5">
                {feasibility.title}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                {feasibility.message}
              </p>
            </div>
          </div>

          {feasibility.remediationPatch && feasibility.remediationLabel && (
            <button
              type="button"
              onClick={() => onApplyRemediation(feasibility.remediationPatch!)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/15 px-3 py-1.5 font-mono-ui text-xs font-bold text-destructive hover:bg-destructive/25 transition-all shrink-0 cursor-pointer self-start sm:self-center"
              data-testid="button-feasibility-remediation"
            >
              <Wrench size={13} />
              <span>{feasibility.remediationLabel}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      id="optimization-feasibility-gate"
      className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/[0.03] px-4 py-2.5"
    >
      <div className="flex items-center gap-2">
        <CheckCircle2 size={15} className="text-primary shrink-0" />
        <span className="font-mono-ui text-xs font-medium text-foreground">
          Constraints Feasible
        </span>
        <span className="h-1 w-1 rounded-full bg-border" aria-hidden="true" />
        <span className="font-mono-ui text-[11px] text-muted-foreground">
          Pool of {availableFleet} vehicles satisfies {routeCount} corridors × {minVehicles} min requirement ({routeCount * minVehicles} min).
        </span>
      </div>
      <span className="hidden sm:inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 font-mono-ui text-[9px] font-bold text-primary uppercase">
        Solver Ready
      </span>
    </div>
  );
}
