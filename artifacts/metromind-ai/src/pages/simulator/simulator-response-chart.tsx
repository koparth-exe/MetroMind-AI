import React from 'react';
import { Layers, AlertTriangle, CheckCircle2, TrendingUp, Info } from 'lucide-react';
import type { SimulatorRouteComparison } from './types';

interface SimulatorResponseChartProps {
  routes: SimulatorRouteComparison[];
  hasExecutedScenario: boolean;
}

export function SimulatorResponseChart({
  routes,
  hasExecutedScenario,
}: SimulatorResponseChartProps) {
  if (routes.length === 0) return null;

  // Compute maximum scale across all routes for visual normalization
  const maxVal = Math.max(
    ...routes.map((r) => Math.max(r.capacity, r.baselineDemand, r.simulatedDemand)),
    100
  );
  const scaleMax = maxVal * 1.12;

  const getWidthPct = (val: number) => {
    return `${Math.min(100, Math.max(0, (val / scaleMax) * 100))}%`;
  };

  return (
    <section
      id="simulator-response-chart"
      aria-label="2D Scenario Response Visualization"
      className="rounded-xl border border-border/70 bg-card/75 p-4 sm:p-5 shadow-sm space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div>
          <span className="font-mono-ui text-[10px] font-semibold uppercase tracking-wider text-primary">
            Scenario Response
          </span>
          <h2 className="font-display text-base font-bold text-foreground mt-0.5">
            Corridor Demand &amp; Capacity Pressure
          </h2>
        </div>
        <div className="flex items-center gap-3 font-mono-ui text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-xs border border-muted-foreground/40 bg-muted/30" />
            <span>Baseline Demand</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-xs bg-primary" />
            <span>Scenario Demand</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-0.5 bg-foreground/80 border-r border-dashed border-foreground" />
            <span>Capacity Limit</span>
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Compares nominal baseline timetable demand against stressed scenario demand for each corridor. Vertical dashed needles indicate vehicle capacity limits.
      </p>

      {/* Corridor Visual Tracks Grid */}
      <div className="space-y-4 pt-1">
        {routes.map((route) => {
          const isOverflowing = route.capacity > 0 && route.simulatedDemand > route.capacity;
          const capPct = (route.capacity / scaleMax) * 100;
          const basePct = (route.baselineDemand / scaleMax) * 100;
          const scenPct = (route.simulatedDemand / scaleMax) * 100;

          return (
            <div
              key={route.routeId}
              className="rounded-lg border border-border/50 bg-background/50 p-3 transition-colors hover:border-border"
            >
              {/* Corridor Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2 font-mono-ui">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ background: route.color }}
                  />
                  <span className="font-bold text-xs text-foreground">
                    {route.routeId} · {route.name}
                  </span>
                  {route.isSuspended ? (
                    <span className="rounded bg-destructive/15 px-1.5 py-0.5 text-[9px] font-bold text-destructive">
                      SUSPENDED
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">
                      ({route.stations.length} stations)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-muted-foreground text-[11px]">
                    Base: <strong className="text-foreground">{Math.round(route.baselineDemand)}</strong>
                  </span>
                  <span className="text-muted-foreground text-[11px]">
                    Scen:{' '}
                    <strong className={route.isSuspended ? 'text-destructive' : 'text-foreground'}>
                      {route.isSuspended ? '0 (Off)' : Math.round(route.simulatedDemand)}
                    </strong>
                  </span>
                  {hasExecutedScenario && !route.isSuspended && (
                    <span
                      className={`text-[10px] font-bold ${
                        route.demandDelta > 0
                          ? 'text-amber-400'
                          : route.demandDelta < 0
                          ? 'text-cyan-400'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {route.demandDelta >= 0 ? '+' : ''}
                      {route.demandDeltaPct.toFixed(1)}%
                    </span>
                  )}
                  <span className="text-[10.5px] text-muted-foreground">
                    Cap: <strong className="text-foreground">{route.capacity.toLocaleString()}</strong>
                  </span>
                </div>
              </div>

              {/* Comparative Dual Horizontal Bar Visualizer */}
              <div className="relative pt-1 pb-2">
                {/* Background Track */}
                <div className="relative h-6 w-full rounded bg-muted/20 overflow-hidden border border-border/40">
                  {route.isSuspended ? (
                    <div className="h-full w-full flex items-center justify-center font-mono-ui text-[10px] text-destructive bg-destructive/5 font-semibold">
                      Corridor service offline · Capacity 0 · Local demand 0
                    </div>
                  ) : (
                    <>
                      {/* Top Bar: Baseline Demand */}
                      <div
                        className="absolute top-0 left-0 h-2.5 rounded-xs bg-muted-foreground/25 border-r border-muted-foreground/60 transition-all duration-300"
                        style={{ width: `${Math.min(100, basePct)}%` }}
                        title={`Baseline: ${Math.round(route.baselineDemand)} pax/h`}
                      />

                      {/* Bottom Bar: Simulated Demand */}
                      <div
                        className={`absolute bottom-0 left-0 h-3 rounded-xs transition-all duration-300 ${
                          isOverflowing ? 'bg-gradient-to-r from-amber-500 to-destructive' : ''
                        }`}
                        style={{
                          width: `${Math.min(100, scenPct)}%`,
                          background: isOverflowing ? undefined : route.color,
                        }}
                        title={`Simulated: ${Math.round(route.simulatedDemand)} pax/h`}
                      />
                    </>
                  )}

                  {/* Vertical Capacity Needle */}
                  {!route.isSuspended && route.capacity > 0 && (
                    <div
                      className="absolute top-0 bottom-0 z-10 w-0.5 border-r-2 border-dashed border-foreground/90 pointer-events-none"
                      style={{ left: `${Math.min(100, capPct)}%` }}
                      title={`Capacity: ${route.capacity} seats`}
                    >
                      <span className="absolute -top-1 -translate-x-1/2 font-mono-ui text-[8px] font-bold text-foreground/80 bg-background/90 px-0.5 rounded">
                        Cap
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Corridor Footnote Telemetry */}
              <div className="flex flex-wrap items-center justify-between gap-2 font-mono-ui text-[10px] text-muted-foreground pt-0.5">
                <span>
                  {route.isSuspended ? (
                    <span className="text-destructive">Service capacity isolated · 0 throughput</span>
                  ) : (
                    <>
                      Utilization:{' '}
                      <strong className={isOverflowing ? 'text-destructive' : 'text-foreground'}>
                        {route.simulatedUtilization !== null ? `${Math.round(route.simulatedUtilization * 100)}%` : 'N/A'}
                      </strong>
                      <span className="ml-1 text-[9px] opacity-75">(Util · {route.riskBand})</span>
                      {isOverflowing && (
                        <span className="ml-1 text-destructive font-bold inline-flex items-center gap-0.5">
                          <AlertTriangle size={10} /> Overcrowded
                        </span>
                      )}
                    </>
                  )}
                </span>
                <span>
                  Exceedance Risk:{' '}
                  <strong className={route.isSuspended ? 'text-muted-foreground' : 'text-foreground'}>
                    {route.isSuspended ? 'N/A' : `${(route.overloadProbability * 100).toFixed(0)}%`}
                  </strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
