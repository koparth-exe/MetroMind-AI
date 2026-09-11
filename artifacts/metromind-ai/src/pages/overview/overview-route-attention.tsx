import { useMemo } from 'react';
import type { RouteInsight } from '@workspace/api-client-react';
import { RiskBadge } from '@/components/metro-shell';
import { AlertCircle, CheckCircle2, ChevronRight, BusFront, TrainFront } from 'lucide-react';

interface OverviewRouteAttentionProps {
  routes: RouteInsight[];
  selectedRouteId?: string;
  onSelectRoute: (routeId: string) => void;
  transportMode: 'RAILWAY' | 'BUS';
}

export function OverviewRouteAttention({
  routes,
  selectedRouteId,
  onSelectRoute,
  transportMode,
}: OverviewRouteAttentionProps) {
  const isBus = transportMode === 'BUS';
  const FleetIcon = isBus ? BusFront : TrainFront;

  // Sort routes by urgency: Critical > High > Medium > Low, then by utilization descending
  const sortedRoutes = useMemo(() => {
    const riskScore = (risk: string) => {
      const r = risk.toLowerCase();
      if (r === 'critical') return 4;
      if (r === 'high') return 3;
      if (r === 'medium') return 2;
      return 1;
    };

    return [...routes].sort((a, b) => {
      const diff = riskScore(b.risk) - riskScore(a.risk);
      if (diff !== 0) return diff;
      return b.utilization - a.utilization;
    });
  }, [routes]);

  return (
    <section
      aria-label="Route Attention & Watchlist"
      className="signal-card flex flex-col justify-between rounded-2xl p-5 sm:p-6"
    >
      <div>
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-3.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
            <h2 className="font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
              Route Attention Watchlist
            </h2>
            <span className="rounded-full border border-border/70 bg-muted/50 px-2.5 py-0.5 font-mono-ui text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              Priority Ranked
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Select a corridor to isolate in spatial view
          </span>
        </div>

        {/* Route List Items */}
        <div className="mt-4 divide-y divide-border/60">
          {sortedRoutes.map((route) => {
            const isSelected = route.routeId === selectedRouteId;
            const utilPct = Math.round(route.utilization * 100);
            const isOverCapacity = utilPct > 100;
            const probPct = Math.round(route.overcrowdingProbability * 100);

            return (
              <div
                key={route.routeId}
                role="button"
                tabIndex={0}
                onClick={() => onSelectRoute(route.routeId)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectRoute(route.routeId);
                  }
                }}
                data-testid={`row-route-attention-${route.routeId}`}
                className={`group relative -mx-3 flex flex-col gap-3 rounded-xl p-3.5 transition-all duration-150 sm:-mx-4 sm:p-4 cursor-pointer focus-visible:outline-2 focus-visible:outline-primary ${
                  isSelected
                    ? 'bg-primary/[0.08] ring-1 ring-primary/40 shadow-xs'
                    : 'hover:bg-muted/40'
                }`}
              >
                {/* Route Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Line color tag */}
                    <span
                      className="h-8 w-1.5 rounded-full shrink-0 shadow-2xs"
                      style={{ background: route.color }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-base font-bold text-foreground">
                          {route.routeId}
                        </span>
                        <span className="text-xs font-semibold text-muted-foreground truncate">
                          · {route.name}
                        </span>
                        {isSelected && (
                          <span className="rounded bg-primary/15 px-1.5 py-0.2 font-mono-ui text-[8.5px] font-bold uppercase text-primary">
                            Focused
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 font-mono-ui text-[10px] text-muted-foreground">
                        <span>{route.stations.length} stations</span>
                        <span>·</span>
                        <span>Cap: {route.capacity.toLocaleString()} pax</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <RiskBadge risk={route.risk} />
                  </div>
                </div>

                {/* Analytical Metrics Bar */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 font-mono-ui text-xs">
                  {/* Forecast Demand */}
                  <div className="rounded-lg border border-border/50 bg-background/50 p-2">
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      Forecast Demand
                    </div>
                    <div className="mt-0.5 font-bold tabular-nums text-foreground">
                      {route.predictedDemand.toLocaleString()} <span className="text-[9.5px] text-muted-foreground font-normal">pax</span>
                    </div>
                  </div>

                  {/* Overcrowding Probability */}
                  <div className="rounded-lg border border-border/50 bg-background/50 p-2">
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      Overcrowd Prob
                    </div>
                    <div
                      className={`mt-0.5 font-bold tabular-nums ${
                        probPct >= 80 ? 'text-risk-high' : probPct >= 50 ? 'text-risk-medium' : 'text-risk-low'
                      }`}
                    >
                      {probPct}%
                    </div>
                  </div>

                  {/* Utilization & Capacity bar */}
                  <div className="rounded-lg border border-border/50 bg-background/50 p-2">
                    <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-muted-foreground">
                      <span>Utilization</span>
                      <span className="font-bold text-foreground">{utilPct}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${
                          isOverCapacity ? 'bg-risk-high' : utilPct >= 80 ? 'bg-risk-medium' : 'bg-risk-low'
                        }`}
                        style={{ width: `${Math.min(100, utilPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Recommended Fleet Allocation */}
                  <div className="rounded-lg border border-border/50 bg-background/50 p-2">
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      Fleet Buffer
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 font-bold text-accent">
                      <FleetIcon size={12} />
                      <span>+{route.recommendedBuses - route.baselineBuses} unit{route.recommendedBuses - route.baselineBuses !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
