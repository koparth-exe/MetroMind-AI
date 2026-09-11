import { useMemo } from 'react';
import type { RouteInsight } from '@workspace/api-client-react';
import { Users, TrendingUp, BusFront, TrainFront, MapPin, ArrowUpRight } from 'lucide-react';

interface PassengerCorridorRankingProps {
  routes: RouteInsight[];
  selectedRouteId?: string;
  onSelectRoute: (routeId: string) => void;
  transportMode: 'RAILWAY' | 'BUS';
}

export function PassengerCorridorRanking({
  routes,
  selectedRouteId,
  onSelectRoute,
  transportMode,
}: PassengerCorridorRankingProps) {
  const isBus = transportMode === 'BUS';
  const FleetIcon = isBus ? BusFront : TrainFront;

  // Rank routes by predicted passenger demand descending
  const rankedRoutes = useMemo(() => {
    return [...routes].sort((a, b) => b.predictedDemand - a.predictedDemand);
  }, [routes]);

  return (
    <section
      aria-label="Passenger Corridor Ranking"
      className="signal-card flex flex-col justify-between rounded-2xl p-5 sm:p-6"
    >
      <div>
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-3.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
            <h2 className="font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
              Passenger Flow Corridor Priority
            </h2>
            <span className="rounded-full border border-border/70 bg-muted/50 px-2.5 py-0.5 font-mono-ui text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              Volume Ranked
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Select a corridor to isolate on spatial map and inspect journey window
          </span>
        </div>

        {/* Corridor List Items */}
        <div className="mt-4 divide-y divide-border/60">
          {rankedRoutes.map((route, idx) => {
            const isSelected = route.routeId === selectedRouteId;
            const utilPct = Math.round(route.utilization * 100);
            const headroom = route.capacity - route.predictedDemand;
            const isSurplus = headroom >= 0;
            const rankStr = String(idx + 1).padStart(2, '0');
            const diffHist = route.predictedDemand - route.historicalAverage;
            const diffHistPct = route.historicalAverage > 0 ? (diffHist / route.historicalAverage) * 100 : 0;

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
                data-testid={`row-corridor-ranking-${route.routeId}`}
                className={`group relative -mx-3 flex flex-col gap-3 rounded-xl p-3.5 transition-all duration-150 sm:-mx-4 sm:p-4 cursor-pointer focus-visible:outline-2 focus-visible:outline-primary ${
                  isSelected
                    ? 'bg-primary/[0.08] ring-1 ring-primary/40 shadow-xs'
                    : 'hover:bg-muted/40'
                }`}
              >
                {/* Corridor Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono-ui text-xs font-bold text-muted-foreground w-6">
                      #{rankStr}
                    </span>
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
                        <span>{route.stations.length} stops ({route.stations.slice(0, 3).join(' → ')}{route.stations.length > 3 ? '…' : ''})</span>
                        <span>·</span>
                        <span>Cap: {route.capacity.toLocaleString()} pax</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="font-display text-sm font-bold text-foreground tabular-nums">
                        {Math.round(route.predictedDemand).toLocaleString()} <span className="text-[10px] font-normal text-muted-foreground font-mono-ui">pax/h</span>
                      </div>
                      <div className="font-mono-ui text-[9.5px] text-primary font-semibold">
                        {diffHistPct >= 0 ? '+' : ''}{diffHistPct.toFixed(1)}% vs hist
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analytical Metrics Bar */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 font-mono-ui text-xs">
                  {/* Utilization */}
                  <div className="rounded-lg border border-border/50 bg-background/50 p-2">
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      Utilization
                    </div>
                    <div className="mt-0.5 font-bold tabular-nums text-foreground">
                      {utilPct}% <span className="text-[9px] text-muted-foreground font-normal">capacity</span>
                    </div>
                  </div>

                  {/* Available Headroom */}
                  <div className="rounded-lg border border-border/50 bg-background/50 p-2">
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      Available Headroom
                    </div>
                    <div className={`mt-0.5 font-bold tabular-nums ${isSurplus ? 'text-primary' : 'text-risk-high'}`}>
                      {isSurplus ? '+' : ''}{Math.round(headroom).toLocaleString()} <span className="text-[9px] text-muted-foreground font-normal">pax</span>
                    </div>
                  </div>

                  {/* Crowding Band */}
                  <div className="rounded-lg border border-border/50 bg-background/50 p-2">
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      Crowding Level
                    </div>
                    <div className={`mt-0.5 font-bold ${utilPct >= 85 ? 'text-risk-high' : utilPct >= 70 ? 'text-risk-medium' : 'text-risk-low'}`}>
                      {utilPct >= 100 ? 'Critical' : utilPct >= 85 ? 'High' : utilPct >= 70 ? 'Moderate' : 'Low'}
                    </div>
                  </div>

                  {/* Recommended Fleet */}
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
