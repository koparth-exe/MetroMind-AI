import { useMemo } from 'react';
import type { RouteInsight } from '@workspace/api-client-react';
import { MumbaiMap } from '@/components/mumbai-map';
import { MapPin, Users, Navigation } from 'lucide-react';

interface PassengerSpatialPanelProps {
  routes: RouteInsight[];
  selectedRouteId?: string;
  onSelectRoute: (routeId: string) => void;
  transportMode: 'RAILWAY' | 'BUS';
}

export function PassengerSpatialPanel({
  routes,
  selectedRouteId,
  onSelectRoute,
  transportMode,
}: PassengerSpatialPanelProps) {
  const activeRoute = useMemo(
    () => routes.find((r) => r.routeId === selectedRouteId),
    [routes, selectedRouteId]
  );

  const totalStations = useMemo(() => {
    return routes.reduce((acc, cur) => acc + cur.stations.length, 0);
  }, [routes]);

  return (
    <section
      aria-label="Passenger Spatial Flow"
      className="signal-card flex flex-col justify-between rounded-2xl p-5 sm:p-6"
    >
      <div>
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-3.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
            <h2 className="font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
              Passenger Flow Geography
            </h2>
            <span className="rounded-full border border-border/70 bg-muted/50 px-2.5 py-0.5 font-mono-ui text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              {transportMode === 'BUS' ? 'Bus Transit Network' : 'Suburban Rail Network'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono-ui text-muted-foreground">
            <MapPin size={12} className="text-primary" />
            <span>{routes.length} corridors · {totalStations} boarding stations</span>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative mt-4 overflow-hidden rounded-xl border border-border/80 shadow-inner">
          <div className="h-[340px] sm:h-[380px] w-full">
            <MumbaiMap
              routes={routes}
              selectedRouteId={selectedRouteId}
              onSelect={onSelectRoute}
            />
          </div>

          {/* Top-Left Geographic Badge */}
          <div className="pointer-events-none absolute left-3 top-3 z-[400] rounded-lg border border-border/80 bg-card/90 px-2.5 py-1 font-mono-ui text-[9px] font-bold uppercase tracking-widest text-muted-foreground shadow-xs backdrop-blur-md">
            MMR Passenger Grid
          </div>

          {/* Bottom Route Switcher Pills */}
          <div className="absolute bottom-3 left-3 right-3 z-[400] flex flex-wrap items-center gap-1.5 rounded-xl border border-border/80 bg-card/95 p-1.5 shadow-md backdrop-blur-md">
            <button
              type="button"
              onClick={() => onSelectRoute('')}
              className={`rounded-lg px-2.5 py-1 font-mono-ui text-[10px] font-bold transition-colors ${
                !selectedRouteId
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              All Corridors
            </button>
            {routes.map((route) => {
              const active = route.routeId === selectedRouteId;
              return (
                <button
                  type="button"
                  key={route.routeId}
                  onClick={() => onSelectRoute(route.routeId)}
                  data-testid={`button-passenger-map-${route.routeId}`}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono-ui text-[10px] font-bold transition-all ${
                    active
                      ? 'bg-foreground text-background shadow-xs ring-1 ring-border'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: route.color }}
                    aria-hidden="true"
                  />
                  <span>{route.routeId}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Corridor Spatial Inset Card */}
        {activeRoute ? (
          <div className="mt-4 rounded-xl border border-primary/30 bg-primary/[0.04] p-3.5 text-xs transition-all">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: activeRoute.color }}
                  aria-hidden="true"
                />
                <span className="font-display font-bold text-foreground">
                  {activeRoute.routeId} · {activeRoute.name}
                </span>
                <span className="rounded bg-primary/15 px-1.5 py-0.2 font-mono-ui text-[8.5px] font-bold uppercase text-primary">
                  Selected
                </span>
              </div>
              <div className="font-mono-ui text-[11px] text-muted-foreground">
                <span className="font-bold text-foreground tabular-nums">{Math.round(activeRoute.predictedDemand).toLocaleString()}</span> pax/h
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono-ui text-[10.5px] text-muted-foreground">
              <span>{activeRoute.stations.length} stations</span>
              <span>·</span>
              <span>Capacity: {activeRoute.capacity.toLocaleString()} pax</span>
              <span>·</span>
              <span>Utilization: {Math.round(activeRoute.utilization * 100)}%</span>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/70 bg-muted/30 px-3.5 py-2.5 text-xs text-muted-foreground">
            <Navigation size={13} className="text-primary shrink-0" />
            <span>Click any corridor above or polyline on the map to inspect its geographic route stations and passenger load.</span>
          </div>
        )}
      </div>
    </section>
  );
}
