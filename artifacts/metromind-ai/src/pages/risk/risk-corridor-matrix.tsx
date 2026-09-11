import { useState, useMemo } from 'react';
import { ArrowUpDown, AlertTriangle, ShieldAlert, CheckCircle2, Flame, ChevronRight } from 'lucide-react';
import { RiskBadge } from '@/components/metro-shell';
import type { RouteRiskViewModel } from './types';
import { formatPercent, formatProbability } from './types';

interface RiskCorridorMatrixProps {
  routes: RouteRiskViewModel[];
  selectedRouteId?: string;
  onSelectRoute: (routeId: string) => void;
}

type SortKey = 'riskScore' | 'utilization' | 'probability' | 'routeId';

export function RiskCorridorMatrix({
  routes,
  selectedRouteId,
  onSelectRoute,
}: RiskCorridorMatrixProps) {
  const [sortKey, setSortKey] = useState<SortKey>('riskScore');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false); // default descending for risk/load
    }
  };

  const sortedRoutes = useMemo(() => {
    return [...routes].sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;

      if (sortKey === 'riskScore') {
        valA = a.riskScore;
        valB = b.riskScore;
      } else if (sortKey === 'utilization') {
        valA = a.utilization;
        valB = b.utilization;
      } else if (sortKey === 'probability') {
        valA = a.overloadProbability;
        valB = b.overloadProbability;
      } else if (sortKey === 'routeId') {
        valA = a.routeId;
        valB = b.routeId;
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
  }, [routes, sortKey, sortAsc]);

  return (
    <section
      id="risk-corridor-matrix"
      aria-label="Corridor Risk Matrix"
      className="signal-card overflow-hidden rounded-2xl border border-border/80 bg-card/95 p-5 shadow-xs sm:p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
            <h2 className="font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
              Corridor Risk Matrix & Operational Drill-Down
            </h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Ranked by authoritative composite risk score. Click any corridor to isolate telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono-ui text-[10px] uppercase tracking-wider text-muted-foreground">
            Sorted by:
          </span>
          <span className="rounded-lg border border-border/70 bg-muted/40 px-2.5 py-1 font-mono-ui text-[11px] font-bold text-foreground">
            {sortKey === 'riskScore'
              ? 'Risk Score (Desc)'
              : sortKey === 'utilization'
              ? 'Utilization (Desc)'
              : sortKey === 'probability'
              ? 'Overload Prob (Desc)'
              : 'Route Identifier'}
          </span>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="mt-4 hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border/60 font-mono-ui text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <th className="py-3 px-3">
                <button
                  type="button"
                  onClick={() => handleSort('routeId')}
                  className="flex items-center gap-1 hover:text-foreground cursor-pointer"
                >
                  <span>Corridor</span>
                  <ArrowUpDown size={11} />
                </button>
              </th>
              <th className="py-3 px-3 text-right">Predicted Demand</th>
              <th className="py-3 px-3 text-right">Capacity</th>
              <th className="py-3 px-3">
                <button
                  type="button"
                  onClick={() => handleSort('utilization')}
                  className="flex items-center gap-1 hover:text-foreground cursor-pointer"
                >
                  <span>Utilization</span>
                  <ArrowUpDown size={11} />
                </button>
              </th>
              <th className="py-3 px-3">
                <button
                  type="button"
                  onClick={() => handleSort('probability')}
                  className="flex items-center gap-1 hover:text-foreground cursor-pointer"
                >
                  <span>Overload Prob.</span>
                  <ArrowUpDown size={11} />
                </button>
              </th>
              <th className="py-3 px-3">
                <button
                  type="button"
                  onClick={() => handleSort('riskScore')}
                  className="flex items-center gap-1 hover:text-foreground cursor-pointer text-primary"
                >
                  <span>Risk Score</span>
                  <ArrowUpDown size={11} />
                </button>
              </th>
              <th className="py-3 px-3 text-right">Risk Level</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 font-sans text-xs">
            {sortedRoutes.map((route) => {
              const isSelected = route.routeId === selectedRouteId;
              return (
                <tr
                  key={route.routeId}
                  onClick={() => onSelectRoute(route.routeId)}
                  className={`group cursor-pointer transition-colors duration-150 ${
                    isSelected
                      ? 'bg-primary/10 hover:bg-primary/15'
                      : 'hover:bg-muted/40'
                  }`}
                >
                  {/* Corridor ID & Name */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: route.color || 'hsl(var(--primary))' }}
                      />
                      <div>
                        <div className="font-display font-bold text-foreground flex items-center gap-1.5">
                          <span>{route.name}</span>
                          <span className="font-mono-ui text-[10px] text-muted-foreground font-semibold">
                            ({route.routeId})
                          </span>
                        </div>
                        <div className="font-mono-ui text-[10px] text-muted-foreground truncate max-w-[180px]">
                          {route.stations.length} stations · {route.stations[0]} → {route.stations[route.stations.length - 1]}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Demand */}
                  <td className="py-3.5 px-3 text-right font-mono-ui font-semibold text-foreground tabular-nums">
                    {Math.round(route.predictedDemand).toLocaleString()} pax/h
                  </td>

                  {/* Capacity */}
                  <td className="py-3.5 px-3 text-right font-mono-ui text-muted-foreground tabular-nums">
                    {Math.round(route.capacity).toLocaleString()} pax/h
                  </td>

                  {/* Utilization */}
                  <td className="py-3.5 px-3">
                    <div className="space-y-1">
                      <div className="flex items-baseline justify-between gap-2 font-mono-ui text-[11px]">
                        <span className="font-bold text-foreground tabular-nums">
                          {formatPercent(route.utilization)}
                        </span>
                        <span className="text-[9.5px] text-muted-foreground">
                          {route.utilization >= 1.0 ? 'Overload' : route.utilization >= 0.85 ? 'High' : 'Safe'}
                        </span>
                      </div>
                      <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.min(100, Math.max(5, route.utilization * 100))}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Probability */}
                  <td className="py-3.5 px-3">
                    <div className="space-y-1">
                      <div className="flex items-baseline justify-between gap-2 font-mono-ui text-[11px]">
                        <span className={`font-bold tabular-nums ${
                          route.overloadProbability >= 0.5 ? 'text-risk-critical' : route.overloadProbability >= 0.25 ? 'text-risk-high' : 'text-foreground'
                        }`}>
                          {formatProbability(route.overloadProbability)}
                        </span>
                        {route.levelElevated && (
                          <span className="text-[9px] font-bold text-risk-high" title="Elevated by P ≥ 50%">
                            P≥50%
                          </span>
                        )}
                      </div>
                      <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            route.overloadProbability >= 0.5
                              ? 'bg-risk-critical'
                              : route.overloadProbability >= 0.25
                              ? 'bg-risk-high'
                              : 'bg-accent'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(4, route.overloadProbability * 100))}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Risk Score */}
                  <td className="py-3.5 px-3">
                    <div className="font-display text-sm font-extrabold text-foreground tabular-nums">
                      {route.riskScore}
                      <span className="font-mono-ui text-[10px] font-medium text-muted-foreground ml-0.5">/100</span>
                    </div>
                  </td>

                  {/* Risk Level Badge */}
                  <td className="py-3.5 px-3 text-right">
                    <RiskBadge risk={route.riskLevel} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile / Responsive Card View */}
      <div className="mt-4 grid grid-cols-1 gap-3 md:hidden">
        {sortedRoutes.map((route) => {
          const isSelected = route.routeId === selectedRouteId;
          return (
            <div
              key={route.routeId}
              onClick={() => onSelectRoute(route.routeId)}
              className={`rounded-xl border p-4 transition-all ${
                isSelected
                  ? 'border-primary bg-primary/[0.06]'
                  : 'border-border/70 bg-card hover:border-border'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: route.color || 'hsl(var(--primary))' }}
                  />
                  <div>
                    <span className="font-display font-bold text-foreground text-sm">
                      {route.name}
                    </span>
                    <span className="font-mono-ui text-xs text-muted-foreground ml-1.5">
                      ({route.routeId})
                    </span>
                  </div>
                </div>

                <RiskBadge risk={route.riskLevel} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-mono-ui border-t border-border/50 pt-2.5">
                <div>
                  <span className="text-muted-foreground">Demand: </span>
                  <span className="font-bold text-foreground">{Math.round(route.predictedDemand)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Capacity: </span>
                  <span className="font-bold text-foreground">{Math.round(route.capacity)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Util: </span>
                  <span className="font-bold text-foreground">{formatPercent(route.utilization)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">P(overload): </span>
                  <span className="font-bold text-foreground">{formatProbability(route.overloadProbability)}</span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2 text-xs">
                <div className="flex items-baseline gap-1">
                  <span className="font-mono-ui text-[10px] text-muted-foreground uppercase">Risk Score:</span>
                  <span className="font-display font-extrabold text-foreground">{route.riskScore} / 100</span>
                </div>
                {route.levelElevated && (
                  <span className="rounded bg-risk-high/15 px-1.5 py-0.5 font-mono-ui text-[9px] font-bold text-risk-high">
                    Elevated by P≥50%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
