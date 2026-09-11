import React, { useState, useMemo } from 'react';
import { ArrowUpDown, AlertTriangle, CheckCircle2, Minus, Ban } from 'lucide-react';
import type { SimulatorRouteComparison, RouteSortField } from './types';

interface SimulatorRouteMatrixProps {
  routes: SimulatorRouteComparison[];
  hasExecutedScenario: boolean;
}

export function SimulatorRouteMatrix({
  routes,
  hasExecutedScenario,
}: SimulatorRouteMatrixProps) {
  const [sortField, setSortField] = useState<RouteSortField>('volumeShift');
  const [sortAsc, setSortAsc] = useState(false);

  const sortedRoutes = useMemo(() => {
    return [...routes].sort((a, b) => {
      let aVal = 0;
      let bVal = 0;
      switch (sortField) {
        case 'volumeShift':
          aVal = Math.abs(a.demandDelta);
          bVal = Math.abs(b.demandDelta);
          break;
        case 'demand':
          aVal = a.simulatedDemand;
          bVal = b.simulatedDemand;
          break;
        case 'utilization':
          aVal = a.simulatedUtilization ?? -1;
          bVal = b.simulatedUtilization ?? -1;
          break;
        case 'probability':
          aVal = a.overloadProbability;
          bVal = b.overloadProbability;
          break;
      }
      return sortAsc ? aVal - bVal : bVal - aVal;
    });
  }, [routes, sortField, sortAsc]);

  const toggleSort = (field: RouteSortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const fmt = (n: number) => (Math.round(n * 10) / 10).toLocaleString(undefined, { minimumFractionDigits: 1 });

  return (
    <section
      id="simulator-route-matrix"
      aria-label="Authoritative Route Stress Matrix"
      className="rounded-xl border border-border/70 bg-card/75 p-4 sm:p-5 shadow-sm space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div>
          <span className="font-mono-ui text-[10px] font-semibold uppercase tracking-wider text-primary">
            Route Matrix
          </span>
          <h2 className="font-display text-base font-bold text-foreground mt-0.5">
            Authoritative Corridor Stress Matrix
          </h2>
        </div>
        <div className="flex items-center gap-1.5 font-mono-ui text-[10px] text-muted-foreground">
          <span>Sort by:</span>
          {(['volumeShift', 'demand', 'utilization', 'probability'] as RouteSortField[]).map((field) => (
            <button
              key={field}
              type="button"
              onClick={() => toggleSort(field)}
              className={`rounded border px-2 py-0.5 font-semibold transition-all ${
                sortField === field
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground'
              }`}
            >
              {field === 'volumeShift' ? 'Δ Volume' : field === 'demand' ? 'Demand' : field === 'utilization' ? 'Utilization' : 'Exceedance'}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Semantic Table (Hidden on small mobile) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left font-mono-ui text-xs border-collapse">
          <thead>
            <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="py-2.5 px-3">Corridor</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Baseline (pax/h)</th>
              <th className="py-2.5 px-3 text-right">Simulated (pax/h)</th>
              <th className="py-2.5 px-3 text-right">Shift (Δ)</th>
              <th className="py-2.5 px-3 text-right">Capacity</th>
              <th className="py-2.5 px-3 text-right">Utilization</th>
              <th className="py-2.5 px-3 text-right">Exceedance P(D&gt;C)</th>
              <th className="py-2.5 px-3 text-center">Utilization Band</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {sortedRoutes.map((r) => {
              const deltaSign = r.demandDelta >= 0 ? '+' : '';
              return (
                <tr
                  key={r.routeId}
                  className={`transition-colors hover:bg-muted/20 ${r.isSuspended ? 'bg-destructive/5' : ''}`}
                >
                  {/* Corridor */}
                  <td className="py-3 px-3 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: r.color }} />
                      <span className="font-bold text-foreground">{r.routeId}</span>
                      <span className="text-muted-foreground truncate max-w-[140px]">{r.name}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3">
                    {r.isSuspended ? (
                      <span className="inline-flex items-center gap-1 rounded bg-destructive/15 px-2 py-0.5 text-[9px] font-bold text-destructive">
                        <Ban size={10} /> SUSPENDED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-[9px] font-semibold text-primary">
                        <CheckCircle2 size={10} /> Active
                      </span>
                    )}
                  </td>

                  {/* Baseline Demand */}
                  <td className="py-3 px-3 text-right text-muted-foreground">
                    {fmt(r.baselineDemand)}
                  </td>

                  {/* Simulated Demand */}
                  <td className="py-3 px-3 text-right font-bold text-foreground">
                    {r.isSuspended ? '0.0' : fmt(r.simulatedDemand)}
                  </td>

                  {/* Shift (Delta) */}
                  <td className="py-3 px-3 text-right">
                    {r.isSuspended ? (
                      <span className="text-destructive font-bold">−100% (Suspended)</span>
                    ) : hasExecutedScenario ? (
                      <span
                        className={`font-semibold ${
                          r.demandDelta > 0
                            ? 'text-amber-400'
                            : r.demandDelta < 0
                            ? 'text-cyan-400'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {deltaSign}{r.demandDeltaPct.toFixed(1)}% ({deltaSign}{fmt(r.demandDelta)})
                      </span>
                    ) : (
                      <span className="text-muted-foreground">▬ 0.0%</span>
                    )}
                  </td>

                  {/* Capacity */}
                  <td className="py-3 px-3 text-right text-muted-foreground">
                    {r.capacity.toLocaleString()} seats
                  </td>

                  {/* Utilization */}
                  <td className="py-3 px-3 text-right">
                    {r.isSuspended || r.capacity === 0 ? (
                      <span className="text-destructive font-semibold">N/A</span>
                    ) : (
                      <span
                        className={`font-bold ${
                          (r.simulatedUtilization ?? 0) > 1.0 ? 'text-destructive' : 'text-foreground'
                        }`}
                      >
                        {Math.round((r.simulatedUtilization ?? 0) * 100)}%
                      </span>
                    )}
                  </td>

                  {/* Overload Probability */}
                  <td className="py-3 px-3 text-right">
                    {r.isSuspended ? (
                      <span className="text-muted-foreground">N/A</span>
                    ) : (
                      <span className="font-semibold text-foreground">
                        {(r.overloadProbability * 100).toFixed(0)}%
                      </span>
                    )}
                  </td>

                  {/* Risk Band */}
                  <td className="py-3 px-3 text-center">
                    {r.isSuspended ? (
                      <span className="rounded bg-muted px-2 py-0.5 text-[9.5px] text-muted-foreground">
                        Offline
                      </span>
                    ) : (
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[9.5px] font-bold ${
                          r.riskBand === 'High'
                            ? 'bg-destructive/15 text-destructive'
                            : r.riskBand === 'Medium'
                            ? 'bg-amber-500/15 text-amber-400'
                            : 'bg-primary/10 text-primary'
                        }`}
                      >
                        Util · {r.riskBand}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Corridor Cards (Rendered when < md to avoid horizontal scroll) */}
      <div className="md:hidden space-y-3">
        {sortedRoutes.map((r) => {
          const deltaSign = r.demandDelta >= 0 ? '+' : '';
          return (
            <div
              key={r.routeId}
              className={`rounded-lg border p-3 font-mono-ui text-xs space-y-2 ${
                r.isSuspended ? 'border-destructive/40 bg-destructive/5' : 'border-border/60 bg-background/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} />
                  <span className="font-bold text-foreground text-sm">{r.routeId}</span>
                  <span className="text-muted-foreground text-xs truncate max-w-[130px]">{r.name}</span>
                </div>
                {r.isSuspended ? (
                  <span className="rounded bg-destructive/15 px-2 py-0.5 text-[9px] font-bold text-destructive">
                    SUSPENDED
                  </span>
                ) : (
                  <span
                    className={`rounded px-2 py-0.5 text-[9.5px] font-bold ${
                      r.riskBand === 'High'
                        ? 'bg-destructive/15 text-destructive'
                        : r.riskBand === 'Medium'
                        ? 'bg-amber-500/15 text-amber-400'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    Util · {r.riskBand}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-border/40">
                <div>
                  <span className="text-muted-foreground block text-[9.5px] uppercase">Baseline</span>
                  <span className="text-foreground font-semibold">{fmt(r.baselineDemand)} pax</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9.5px] uppercase">Simulated</span>
                  <span className="text-foreground font-bold">
                    {r.isSuspended ? '0.0 pax' : `${fmt(r.simulatedDemand)} pax`}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9.5px] uppercase">Volume Shift</span>
                  <span
                    className={`font-semibold ${
                      r.isSuspended
                        ? 'text-destructive'
                        : r.demandDelta > 0
                        ? 'text-amber-400'
                        : 'text-cyan-400'
                    }`}
                  >
                    {r.isSuspended ? '−100%' : `${deltaSign}${r.demandDeltaPct.toFixed(1)}%`}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9.5px] uppercase">Capacity / Saturation</span>
                  <span className="text-foreground">
                    {r.isSuspended ? '0 seats (N/A)' : `${r.capacity} (${Math.round((r.simulatedUtilization ?? 0) * 100)}%)`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
