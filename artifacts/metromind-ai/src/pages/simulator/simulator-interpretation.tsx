import React from 'react';
import { Sparkles, FileText, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import type { SimulatorNetworkComparison } from './types';

interface SimulatorInterpretationProps {
  comparison: SimulatorNetworkComparison | null;
  hasExecutedScenario: boolean;
}

export function SimulatorInterpretation({
  comparison,
  hasExecutedScenario,
}: SimulatorInterpretationProps) {
  if (!hasExecutedScenario || !comparison) {
    return (
      <div className="rounded-xl border border-border/60 bg-card/60 p-4 font-mono-ui text-xs text-muted-foreground flex items-center gap-2">
        <Info size={15} className="text-primary shrink-0" />
        <span>Awaiting scenario execution. Run a simulation to synthesize an operational briefing.</span>
      </div>
    );
  }

  // Deterministic rule-based synthesis from live API values
  const isDemandSurging = comparison.demandDelta > 0;
  const isDemandFalling = comparison.demandDelta < 0;
  const activeRoutes = comparison.routes.filter((r) => !r.isSuspended);
  const highestUtilRoute = [...activeRoutes].sort((a, b) => (b.simulatedUtilization ?? 0) - (a.simulatedUtilization ?? 0))[0];
  const overcrowdedRoutes = activeRoutes.filter((r) => r.capacity > 0 && r.simulatedDemand > r.capacity);
  const suspendedRoute = comparison.routes.find((r) => r.isSuspended);

  const deltaText = isDemandSurging
    ? `surges by ${Math.round(comparison.demandDelta).toLocaleString()} pax/h (+${comparison.demandDeltaPct.toFixed(1)}%)`
    : isDemandFalling
    ? `attenuates by ${Math.abs(Math.round(comparison.demandDelta)).toLocaleString()} pax/h (${comparison.demandDeltaPct.toFixed(1)}%)`
    : 'matches nominal baseline conditions (0.0% variance)';

  return (
    <section
      id="simulator-interpretation"
      aria-label="Deterministic Operational Briefing"
      className="rounded-xl border border-border/70 bg-card/75 p-4 sm:p-5 shadow-sm space-y-3"
    >
      <div className="flex items-center gap-2 border-b border-border/60 pb-2.5">
        <Sparkles size={15} className="text-primary" />
        <span className="font-mono-ui text-xs font-bold uppercase tracking-wider text-foreground">
          Operational Synthesis &amp; Capacity Assessment
        </span>
      </div>

      <div className="space-y-2 text-xs leading-relaxed text-foreground/90 font-sans">
        <p>
          Under the evaluated operating vector (<strong>{comparison.label || 'Scenario conditions'}</strong>), total network passenger volume {deltaText} relative to the nominal timetable baseline.
        </p>

        {suspendedRoute && (
          <p className="text-destructive font-medium">
            Corridor <strong>{suspendedRoute.routeId} · {suspendedRoute.name}</strong> is suspended, withdrawing {suspendedRoute.baselineCapacity > 0 ? `${suspendedRoute.baselineCapacity.toLocaleString()} seats` : "the corridor's nominal baseline capacity"} from active service. Local corridor throughput is set to zero; passenger redistribution is not modeled.
          </p>
        )}

        {overcrowdedRoutes.length > 0 ? (
          <p className="text-destructive font-medium">
            Acute overcrowding detected across {overcrowdedRoutes.length} corridor{overcrowdedRoutes.length > 1 ? 's' : ''} (
            {overcrowdedRoutes.map((r) => `${r.routeId} at ${Math.round((r.simulatedUtilization ?? 0) * 100)}%`).join(', ')}). Total unserved passenger volume above allocated capacity reaches {Math.round(comparison.simulatedUnserved).toLocaleString()} pax.
          </p>
        ) : (
          <p className="text-risk-low font-medium">
            All active corridors maintain positive capacity headroom. Highest capacity saturation is observed on{' '}
            <strong>{highestUtilRoute ? `${highestUtilRoute.routeId} · ${highestUtilRoute.name}` : 'the network'}</strong> at{' '}
            {highestUtilRoute ? `${Math.round((highestUtilRoute.simulatedUtilization ?? 0) * 100)}%` : 'nominal'} utilization with{' '}
            {highestUtilRoute ? `${(highestUtilRoute.overloadProbability * 100).toFixed(0)}%` : '0%'} exceedance probability.
          </p>
        )}

        <p className="text-muted-foreground font-mono-ui text-[11px] pt-1">
          Evaluation basis: {comparison.datasetName} · {comparison.activeCorridorsCount} active corridors · Deterministic algebraic simulation.
        </p>
      </div>
    </section>
  );
}
