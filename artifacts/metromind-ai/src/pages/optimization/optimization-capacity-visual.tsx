import { Panel } from '@/components/metro-shell';
import type { TransportMode } from '@/lib/transport-mode';
import { getModeNomenclature, type BeforeAfterRouteComparison } from './types';
import { ShieldAlert, AlertTriangle, ShieldCheck, Ban } from 'lucide-react';

interface OptimizationCapacityVisualProps {
  transportMode: TransportMode;
  rows: BeforeAfterRouteComparison[];
  isSolved: boolean;
}

export function OptimizationCapacityVisual({
  transportMode,
  rows,
  isSolved,
}: OptimizationCapacityVisualProps) {
  const mode = getModeNomenclature(transportMode);

  return (
    <div id="optimization-capacity-visual">
      <Panel
        title="Capacity vs. Demand Breakdown"
        meta="headroom & deficit envelope"
      >
      <div className="space-y-4">
        {rows.map((r) => {
          const demand = r.predictedDemand;
          const capacity = isSolved ? r.recommendedCapacity : r.baselineCapacity;
          const vehicles = isSolved ? r.recommendedBuses : r.baselineBuses;
          const isZero = isSolved && r.isZeroVehicleRoute;
          const utilPct = isZero ? 0 : Math.round((demand / Math.max(1, capacity)) * 100);

          const isOvercrowded = demand > capacity;
          const deficit = Math.max(0, Math.round((demand - capacity) * 10) / 10);
          const headroom = Math.max(0, Math.round((capacity - demand) * 10) / 10);

          return (
            <div
              key={r.routeId}
              className="rounded-xl border border-border/70 bg-card/60 p-3.5 sm:p-4 shadow-2xs transition-all hover:border-border"
            >
              {/* Row Header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: r.color }} />
                  <span className="font-display text-sm font-bold text-foreground">{r.routeId}</span>
                  <span className="text-xs text-muted-foreground truncate font-medium">· {r.name}</span>
                </div>

                <div className="flex items-center gap-2 font-mono-ui text-xs">
                  {isZero ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-risk-medium/15 px-2 py-0.5 font-bold text-risk-medium border border-risk-medium/30">
                      <Ban size={11} /> NO SERVICE
                    </span>
                  ) : isOvercrowded ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-destructive/15 px-2 py-0.5 font-bold text-destructive border border-destructive/30">
                      <AlertTriangle size={11} /> OVERCROWDED ({utilPct}%)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 font-bold text-primary border border-primary/25">
                      <ShieldCheck size={11} /> {utilPct}% UTILIZED
                    </span>
                  )}
                </div>
              </div>

              {/* Multi-tier Capacity & Demand Progress Bar */}
              <div className="mt-3">
                <div className="relative h-3 w-full rounded-full bg-muted/60 overflow-hidden">
                  {isZero ? (
                    /* Zero capacity route */
                    <div className="h-full w-full bg-border/40 border border-dashed border-border" />
                  ) : (
                    /* Active capacity fill */
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isOvercrowded
                          ? 'bg-destructive'
                          : utilPct > 80
                          ? 'bg-risk-medium'
                          : 'bg-primary'
                      }`}
                      style={{ width: `${Math.min(100, utilPct)}%` }}
                    />
                  )}
                </div>

                {/* Sub-bar Metric Indicators */}
                <div className="mt-2 flex flex-wrap items-center justify-between font-mono-ui text-[11px] text-muted-foreground gap-2">
                  <div className="flex items-center gap-3">
                    <span>
                      Demand: <strong className="text-foreground">{Math.round(demand).toLocaleString()} pax/h</strong>
                    </span>
                    <span>
                      Capacity: <strong className="text-foreground">{isZero ? 0 : capacity.toLocaleString()} seats</strong>{' '}
                      ({vehicles} {vehicles === 1 ? mode.vehicleSingular : mode.vehiclePlural})
                    </span>
                  </div>

                  <div>
                    {isZero ? (
                      <span className="text-destructive font-bold">Unserved: {Math.round(demand).toLocaleString()} pax</span>
                    ) : isOvercrowded ? (
                      <span className="text-destructive font-bold">Deficit: -{deficit.toLocaleString()} pax</span>
                    ) : (
                      <span className="text-primary font-semibold">Headroom: +{headroom.toLocaleString()} seats</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
    </div>
  );
}
