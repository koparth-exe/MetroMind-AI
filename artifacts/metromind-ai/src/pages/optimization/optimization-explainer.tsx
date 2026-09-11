import { useState, useMemo } from 'react';
import { Panel } from '@/components/metro-shell';
import type { TransportMode } from '@/lib/transport-mode';
import { getModeNomenclature } from './types';
import { ChevronDown, ChevronUp, Cpu, Info, Sigma } from 'lucide-react';

interface OptimizationExplainerProps {
  transportMode: TransportMode;
  formulationText?: string;
  isSolved: boolean;
  availableFleet: number;
  minVehicles: number;
  maxVehicles: number;
  routeCount: number;
}

export function OptimizationExplainer({
  transportMode,
  formulationText,
  isSolved,
  availableFleet,
  minVehicles,
  maxVehicles,
  routeCount,
}: OptimizationExplainerProps) {
  const mode = getModeNomenclature(transportMode);
  const [isExpanded, setIsExpanded] = useState(false);

  // Translate any legacy/stale "Integer programming" wording from backend responses
  const sanitizedFormulation = useMemo(() => {
    if (!formulationText) {
      return `Constrained Greedy Marginal Allocation: minimize residual overcrowding with 5% unused-capacity penalty across ${routeCount} ${mode.corridorNoun} corridors.`;
    }
    return formulationText.replace(/integer programming allocation/gi, 'Constrained Greedy Marginal Allocation');
  }, [formulationText, routeCount, mode.corridorNoun]);

  return (
    <div id="optimization-explainer">
      <Panel
        title="Mathematical Basis & Heuristic Audit"
        meta="algorithm transparency"
      action={
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1 font-mono-ui text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        >
          <span>{isExpanded ? 'Collapse' : 'Inspect Formula'}</span>
          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      }
    >
      <div className="space-y-4">
        {/* Authoritative Solver Formulation Text */}
        <div className="rounded-xl border border-primary/25 bg-primary/[0.04] p-4 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/15 p-2 text-primary shrink-0 mt-0.5">
              <Cpu size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2 font-mono-ui text-[10px] font-bold text-primary uppercase">
                <span>Solver Formulation & Decision Narrative</span>
              </div>
              <p className="mt-1 text-xs sm:text-sm font-medium text-foreground leading-relaxed">
                {sanitizedFormulation}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                MetroMind starts from the minimum route allocation and repeatedly assigns available vehicles to the corridor with the greatest residual unserved demand, subject to route bounds.
              </p>
            </div>
          </div>
        </div>

        {/* Collapsible Mathematical Specification */}
        {isExpanded && (
          <div className="space-y-3 pt-2 border-t border-border/60 animate-in fade-in duration-200">
            {/* Algorithm Transparency Callout */}
            <div className="rounded-lg border border-border/70 bg-card/60 p-3.5 text-xs text-muted-foreground leading-relaxed space-y-2">
              <div className="font-display font-bold text-foreground flex items-center gap-2">
                <Sigma size={14} className="text-primary" />
                Algorithm: Constrained Greedy Marginal Allocation
              </div>
              <p>
                MetroMind does not solve an unconstrained continuous relaxation or exact MILP; it employs a deterministic Constrained Greedy Marginal Allocation heuristic.
              </p>
              <ol className="list-decimal list-inside space-y-1 pl-1 font-mono-ui text-[11px] text-foreground/90">
                <li>Initializes all corridors to the minimum service guarantee: <code className="bg-muted px-1 py-0.5 rounded">xᵢ = {minVehicles}</code>.</li>
                <li>Calculates surplus available pool: <code className="bg-muted px-1 py-0.5 rounded">remaining = {availableFleet} - Σ xᵢ</code>.</li>
                <li>Iteratively assigns the next vehicle to the corridor with the highest residual unserved demand: <code className="bg-muted px-1 py-0.5 rounded">arg max [ Dᵢ - (xᵢ × Cap) ]</code>, subject to <code className="bg-muted px-1 py-0.5 rounded">xᵢ &lt; {maxVehicles}</code>.</li>
                <li>Halts when all fleet units are allocated or all eligible corridors reach the upper bound.</li>
              </ol>
            </div>

            {/* LaTeX Equation Representation */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/70 bg-card/60 p-3 font-mono-ui text-xs text-foreground space-y-1">
                <div className="text-[10px] uppercase text-primary font-bold">Objective Function</div>
                <div className="text-sm font-bold">
                  minimize Z = Σ Overcrowdingᵢ + 0.05 × Σ Unusedᵢ
                </div>
                <p className="text-[10px] text-muted-foreground pt-1">
                  Overcrowding is penalized at full weight (1.0). Unused capacity carries a 5% penalty to deter deploying empty vehicles on low-demand corridors.
                </p>
              </div>

              <div className="rounded-lg border border-border/70 bg-card/60 p-3 font-mono-ui text-xs text-foreground space-y-1">
                <div className="text-[10px] uppercase text-primary font-bold">Active Constraints</div>
                <div className="space-y-0.5 text-xs">
                  <div>Fleet Limit: Σ xᵢ ≤ {availableFleet}</div>
                  <div>Corridor Bounds: {minVehicles} ≤ xᵢ ≤ {maxVehicles}</div>
                  <div>Integrality: xᵢ ∈ ℤ⁺</div>
                </div>
                <p className="text-[10px] text-muted-foreground pt-1">
                  Guarantees integer fleet quotas and protects baseline service frequency across corridors.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Panel>
    </div>
  );
}
