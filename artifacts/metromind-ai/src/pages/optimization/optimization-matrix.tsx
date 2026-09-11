import { Panel } from '@/components/metro-shell';
import type { TransportMode } from '@/lib/transport-mode';
import { getModeNomenclature, type BeforeAfterRouteComparison } from './types';
import { ArrowRight, Ban, Minus, Plus } from 'lucide-react';

interface OptimizationMatrixProps {
  transportMode: TransportMode;
  rows: BeforeAfterRouteComparison[];
  isSolved: boolean;
}

export function OptimizationMatrix({
  transportMode,
  rows,
  isSolved,
}: OptimizationMatrixProps) {
  const mode = getModeNomenclature(transportMode);

  return (
    <div id="optimization-matrix">
      <Panel
        title="Authoritative Before → After Allocation Matrix"
        meta="corridor resource decisions"
      >
      {/* Desktop / Tablet Table View (hidden on small mobile) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="cockpit-table w-full">
          <thead>
            <tr className="border-b border-border/80 text-left">
              <th>Corridor</th>
              <th>Demand</th>
              <th>Baseline</th>
              <th>Recommended</th>
              <th>Δ Fleet</th>
              <th>Baseline Cap</th>
              <th>New Cap</th>
              <th>Utilization</th>
              <th>Overcrowding</th>
              <th>Unused</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {rows.map((row) => {
              const delta = isSolved ? row.vehicleDelta : 0;
              const isZero = isSolved && row.isZeroVehicleRoute;
              const utilText = isZero
                ? '—'
                : `${Math.round(
                    (row.predictedDemand /
                      Math.max(1, isSolved ? row.recommendedCapacity : row.baselineCapacity)) *
                      100
                  )}%`;

              return (
                <tr key={row.routeId} className="hover:bg-muted/25 transition-colors">
                  {/* Corridor */}
                  <td className="py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="h-3 w-1 rounded-full shrink-0" style={{ background: row.color }} />
                      <div>
                        <div className="font-display text-sm font-bold text-foreground">{row.routeId}</div>
                        <div className="font-sans text-[11px] text-muted-foreground truncate">{row.name}</div>
                      </div>
                    </div>
                  </td>

                  {/* Demand */}
                  <td className="font-mono-ui font-semibold text-foreground tabular-nums">
                    {Math.round(row.predictedDemand).toLocaleString()}
                  </td>

                  {/* Baseline Allocation */}
                  <td className="font-mono-ui text-muted-foreground tabular-nums">
                    {row.baselineBuses} {mode.vehicleSingular}
                  </td>

                  {/* Recommended Allocation */}
                  <td className="font-mono-ui font-bold text-primary tabular-nums">
                    {isSolved ? (
                      isZero ? (
                        <span className="inline-flex items-center gap-1 rounded bg-risk-medium/15 px-1.5 py-0.5 text-[10px] text-risk-medium">
                          <Ban size={10} /> 0 (NO SERVICE)
                        </span>
                      ) : (
                        `${row.recommendedBuses} ${row.recommendedBuses === 1 ? mode.vehicleSingular : mode.vehiclePlural}`
                      )
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* Delta Badge */}
                  <td>
                    {isSolved ? (
                      <span
                        className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-mono-ui text-[10px] font-bold ${
                          delta > 0
                            ? 'bg-primary/15 text-primary border border-primary/30'
                            : delta < 0
                            ? 'bg-destructive/15 text-destructive border border-destructive/30'
                            : 'bg-muted text-muted-foreground border border-border'
                        }`}
                      >
                        {delta > 0 ? <Plus size={10} /> : delta < 0 ? <Minus size={10} /> : null}
                        {delta > 0 ? `+${delta}` : delta}
                      </span>
                    ) : (
                      <span className="font-mono-ui text-xs text-muted-foreground">0</span>
                    )}
                  </td>

                  {/* Baseline Capacity */}
                  <td className="font-mono-ui text-muted-foreground tabular-nums">
                    {row.baselineCapacity.toLocaleString()}
                  </td>

                  {/* New Capacity */}
                  <td className="font-mono-ui font-semibold text-foreground tabular-nums">
                    {isSolved ? (isZero ? 0 : row.recommendedCapacity.toLocaleString()) : row.baselineCapacity.toLocaleString()}
                  </td>

                  {/* Utilization */}
                  <td className="font-mono-ui tabular-nums">
                    <span className={isZero ? 'text-muted-foreground' : row.recommendedOvercrowding > 0 ? 'text-destructive font-bold' : 'text-foreground'}>
                      {isSolved ? utilText : `${Math.round(row.baselineUtilization * 100)}%`}
                    </span>
                  </td>

                  {/* Overcrowding Deficit */}
                  <td className="font-mono-ui tabular-nums">
                    {(isSolved ? row.recommendedOvercrowding : row.baselineOvercrowding) > 0 ? (
                      <span className="font-bold text-destructive">
                        +{Math.round(isSolved ? row.recommendedOvercrowding : row.baselineOvercrowding).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60">0</span>
                    )}
                  </td>

                  {/* Unused Capacity */}
                  <td className="font-mono-ui text-muted-foreground tabular-nums">
                    {Math.round(isSolved ? row.recommendedUnusedCapacity : row.baselineUnusedCapacity).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Corridor Decision Cards (shown only on mobile < md) */}
      <div className="md:hidden space-y-3">
        {rows.map((row) => {
          const delta = isSolved ? row.vehicleDelta : 0;
          const isZero = isSolved && row.isZeroVehicleRoute;
          const utilText = isZero
            ? '—'
            : `${Math.round(
                (row.predictedDemand /
                  Math.max(1, isSolved ? row.recommendedCapacity : row.baselineCapacity)) *
                  100
              )}%`;

          return (
            <div
              key={`card-${row.routeId}`}
              className="rounded-xl border border-border/70 bg-card/60 p-4 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-1 rounded-full shrink-0" style={{ background: row.color }} />
                  <div>
                    <span className="font-display text-sm font-bold text-foreground">{row.routeId}</span>
                    <span className="font-sans text-xs text-muted-foreground ml-1.5">{row.name}</span>
                  </div>
                </div>

                {isSolved && (
                  <span
                    className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-mono-ui text-[10px] font-bold ${
                      delta > 0
                        ? 'bg-primary/15 text-primary border border-primary/30'
                        : delta < 0
                        ? 'bg-destructive/15 text-destructive border border-destructive/30'
                        : 'bg-muted text-muted-foreground border border-border'
                    }`}
                  >
                    {delta > 0 ? `+${delta} ${mode.vehicleSingular}` : delta < 0 ? `${delta} ${mode.vehicleSingular}` : `No change`}
                  </span>
                )}
              </div>

              {/* Grid 2x2 Telemetry */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono-ui bg-muted/20 p-2.5 rounded-lg">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">Demand:</span>{' '}
                  <strong className="text-foreground">{Math.round(row.predictedDemand).toLocaleString()} pax</strong>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">Allocation:</span>{' '}
                  <strong className="text-primary">
                    {isSolved ? (isZero ? 'NO SERVICE' : `${row.recommendedBuses} ${mode.vehiclePlural}`) : `${row.baselineBuses} ${mode.vehicleSingular}`}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">Capacity:</span>{' '}
                  <strong className="text-foreground">
                    {(isSolved ? (isZero ? 0 : row.recommendedCapacity) : row.baselineCapacity).toLocaleString()} seats
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">Util:</span>{' '}
                  <strong className={isZero ? 'text-muted-foreground' : row.recommendedOvercrowding > 0 ? 'text-destructive' : 'text-foreground'}>
                    {isSolved ? utilText : `${Math.round(row.baselineUtilization * 100)}%`}
                  </strong>
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
