import { useMemo } from 'react';
import type { RouteInsight } from '@workspace/api-client-react';
import { ShieldCheck, AlertTriangle, Users, ChevronRight, TrainFront, BusFront } from 'lucide-react';

interface PassengerCrowdingAnalysisProps {
  routes: RouteInsight[];
  selectedRouteId?: string;
  onSelectRoute: (routeId: string) => void;
  transportMode: 'RAILWAY' | 'BUS';
}

export function PassengerCrowdingAnalysis({
  routes,
  selectedRouteId,
  onSelectRoute,
  transportMode,
}: PassengerCrowdingAnalysisProps) {
  const isBus = transportMode === 'BUS';
  const FleetIcon = isBus ? BusFront : TrainFront;

  // Compute aggregated headroom across network
  const { totalCapacity, totalDemand, totalHeadroom, crowdedCorridorsCount } = useMemo(() => {
    let cap = 0;
    let dem = 0;
    let crowded = 0;

    routes.forEach((r) => {
      cap += r.capacity;
      dem += r.predictedDemand;
      if (r.utilization >= 0.85) crowded += 1;
    });

    return {
      totalCapacity: cap,
      totalDemand: dem,
      totalHeadroom: Math.max(0, cap - dem),
      crowdedCorridorsCount: crowded,
    };
  }, [routes]);

  const getCrowdingBadge = (util: number) => {
    if (util >= 1.0) {
      return {
        label: 'Critical Surge',
        badgeClass: 'bg-risk-critical/15 text-risk-critical border-risk-critical/30',
        barClass: 'bg-risk-critical',
        description: 'Exceeds nominal capacity',
      };
    }
    if (util >= 0.85) {
      return {
        label: 'High Crowding',
        badgeClass: 'bg-risk-high/15 text-risk-high border-risk-high/30',
        barClass: 'bg-risk-high',
        description: 'Dense passenger standing',
      };
    }
    if (util >= 0.70) {
      return {
        label: 'Moderate Crowding',
        badgeClass: 'bg-risk-medium/15 text-risk-medium border-risk-medium/30',
        barClass: 'bg-risk-medium',
        description: 'Standing room comfortable',
      };
    }
    return {
      label: 'Low Crowding',
      badgeClass: 'bg-risk-low/15 text-risk-low border-risk-low/30',
      barClass: 'bg-risk-low',
      description: 'Seated capacity available',
    };
  };

  return (
    <section
      aria-label="Corridor Crowding & Headroom"
      className="signal-card flex flex-col justify-between rounded-2xl p-5 sm:p-6"
    >
      <div>
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-3.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
            <h2 className="font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
              Corridor Crowding & Headroom
            </h2>
            <span className="rounded-full border border-border/70 bg-muted/50 px-2.5 py-0.5 font-mono-ui text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              {routes.length} Active Corridors
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono-ui text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span>Total Headroom:</span>
              <strong className="text-primary font-bold tabular-nums">
                {Math.round(totalHeadroom).toLocaleString()} pax
              </strong>
            </div>
          </div>
        </div>

        {/* Corridor Crowding Cards Grid */}
        <div className="mt-4 space-y-3">
          {routes.map((route) => {
            const isSelected = route.routeId === selectedRouteId;
            const util = route.utilization;
            const utilPct = Math.round(util * 100);
            const headroom = route.capacity - route.predictedDemand;
            const isSurplus = headroom >= 0;
            const crowding = getCrowdingBadge(util);
            const probPct = (route.overcrowdingProbability * 100).toFixed(1);

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
                data-testid={`card-crowding-${route.routeId}`}
                className={`group relative rounded-xl border p-3.5 transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-primary ${
                  isSelected
                    ? 'border-primary/50 bg-primary/[0.08] shadow-xs'
                    : 'border-border/60 bg-card/40 hover:bg-muted/40'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="h-3 w-3 rounded-full shrink-0 shadow-2xs"
                      style={{ background: route.color }}
                      aria-hidden="true"
                    />
                    <div className="flex items-baseline gap-2 min-w-0">
                      <span className="font-display text-sm font-bold text-foreground">
                        {route.routeId}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground truncate">
                        {route.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`rounded-full border px-2 py-0.5 font-mono-ui text-[9px] font-bold uppercase tracking-wider ${crowding.badgeClass}`}
                    >
                      {crowding.label}
                    </span>
                    <span className="font-mono-ui text-xs font-bold text-foreground tabular-nums">
                      {utilPct}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${crowding.barClass}`}
                    style={{ width: `${Math.min(100, utilPct)}%` }}
                  />
                </div>

                {/* Footnote telemetry metrics */}
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 font-mono-ui text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Users size={11} className="text-primary" />
                    <span>Demand:</span>
                    <strong className="text-foreground tabular-nums">{Math.round(route.predictedDemand).toLocaleString()}</strong>
                    <span>/ Cap:</span>
                    <span className="tabular-nums">{route.capacity.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span>Headroom:</span>
                    <strong className={`tabular-nums ${isSurplus ? 'text-primary' : 'text-risk-high'}`}>
                      {isSurplus ? '+' : ''}{Math.round(headroom).toLocaleString()} pax
                    </strong>
                  </div>

                  <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                    <span>Exceedance Prob:</span>
                    <span className="text-foreground tabular-nums">{probPct}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Network Triage Summary */}
      <div className="mt-5 border-t border-border/70 pt-4">
        <div
          className={`flex items-start gap-2.5 rounded-xl border p-3 ${
            crowdedCorridorsCount > 0
              ? 'border-risk-medium/30 bg-risk-medium/5 text-foreground'
              : 'border-risk-low/30 bg-risk-low/5 text-foreground'
          }`}
        >
          {crowdedCorridorsCount > 0 ? (
            <AlertTriangle size={15} className="text-risk-medium shrink-0 mt-0.5" />
          ) : (
            <ShieldCheck size={15} className="text-risk-low shrink-0 mt-0.5" />
          )}
          <div className="min-w-0 flex-1 text-xs">
            <div className="font-bold text-foreground">
              {crowdedCorridorsCount > 0
                ? `${crowdedCorridorsCount} corridor${crowdedCorridorsCount > 1 ? 's' : ''} operating under heavy passenger load`
                : 'All corridors operating within comfortable seating & standing headroom'}
            </div>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
              {crowdedCorridorsCount > 0
                ? 'High passenger surge pushes utilization into standing-only thresholds during peak windows.'
                : 'Diurnal demand remains comfortably below vehicle capacity limits across all scheduled trips.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
