import { useMemo } from 'react';
import { Link } from 'wouter';
import type { RouteInsight } from '@workspace/api-client-react';
import { MumbaiMap } from '@/components/mumbai-map';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';

interface OverviewSpatialPanelProps {
  routes: RouteInsight[];
  selectedRouteId?: string;
  onSelectRoute: (routeId: string) => void;
  transportMode: 'RAILWAY' | 'BUS';
}

export function OverviewSpatialPanel({
  routes,
  selectedRouteId,
  onSelectRoute,
  transportMode,
}: OverviewSpatialPanelProps) {
  const activeRoute = useMemo(
    () => routes.find((r) => r.routeId === selectedRouteId),
    [routes, selectedRouteId]
  );

  const totalStations = useMemo(() => {
    return routes.reduce((acc, cur) => acc + cur.stations.length, 0);
  }, [routes]);

  return (
    <section
      aria-label="Mumbai Spatial Network Context"
      className="signal-card flex flex-col justify-between rounded-2xl p-5 sm:p-6"
    >
      <div>
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-3.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
            <h2 className="font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
              Mumbai Spatial Topology
            </h2>
            <span className="rounded-full border border-border/70 bg-muted/50 px-2.5 py-0.5 font-mono-ui text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              {transportMode === 'BUS' ? 'Bus Feeder Grid' : 'Suburban Rail Grid'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono-ui text-muted-foreground">
            <MapPin size={12} className="text-primary" />
            <span>{routes.length} corridors · {totalStations} station nodes</span>
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

          {/* Map Top-Left Badge */}
          <div className="pointer-events-none absolute left-3 top-3 z-[400] rounded-lg border border-border/80 bg-card/90 px-2.5 py-1 font-mono-ui text-[9px] font-bold uppercase tracking-widest text-muted-foreground shadow-xs backdrop-blur-md">
            MMR Live Coordinates
          </div>

          {/* Map Bottom-Left Route Switcher Pills */}
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
              All Lines
            </button>
            {routes.map((route) => {
              const active = route.routeId === selectedRouteId;
              return (
                <button
                  type="button"
                  key={route.routeId}
                  onClick={() => onSelectRoute(route.routeId)}
                  data-testid={`button-overview-map-${route.routeId}`}
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
      </div>

      {/* Selected Corridor Info & Link to Routes Page */}
      <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3.5">
        <div className="text-xs">
          {activeRoute ? (
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: activeRoute.color }} />
              <span className="font-bold text-foreground">{activeRoute.name}</span>
              <span className="font-mono-ui text-[11px] text-muted-foreground">
                ({activeRoute.stations.length} stops · {activeRoute.predictedDemand.toLocaleString()} pax)
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground text-[11px]">
              Click a line above or on the map to inspect corridor details
            </span>
          )}
        </div>

        <Link
          href="/routes"
          className="inline-flex items-center gap-1 font-mono-ui text-[11px] font-bold text-primary hover:underline"
        >
          <span>Full Route Geometry</span>
          <ExternalLink size={12} />
        </Link>
      </div>
    </section>
  );
}
