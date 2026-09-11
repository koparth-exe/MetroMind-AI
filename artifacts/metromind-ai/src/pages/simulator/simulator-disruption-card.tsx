import React from 'react';
import { Ban, AlertTriangle, Info } from 'lucide-react';
import type { SimulatorRouteComparison } from './types';

interface SimulatorDisruptionCardProps {
  suspendedRoute: SimulatorRouteComparison | null;
}

export function SimulatorDisruptionCard({ suspendedRoute }: SimulatorDisruptionCardProps) {
  if (!suspendedRoute) return null;

  return (
    <div
      role="alert"
      className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 sm:p-5 shadow-sm space-y-3 animate-in fade-in duration-150"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-destructive/30 pb-2.5">
        <div className="flex items-center gap-2">
          <Ban size={16} className="text-destructive shrink-0" />
          <span className="font-mono-ui text-xs font-bold uppercase tracking-wider text-destructive">
            Corridor Service Offline: {suspendedRoute.routeId} · {suspendedRoute.name}
          </span>
        </div>
        <span className="rounded bg-destructive/20 px-2 py-0.5 font-mono-ui text-[10px] font-bold text-destructive">
          Out of Service · Single Line Isolation
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 font-mono-ui text-xs">
        <div className="rounded-lg border border-destructive/30 bg-background/60 p-3">
          <span className="text-muted-foreground text-[10px] uppercase">Service Capacity</span>
          <div className="font-display text-lg font-bold text-destructive mt-0.5">
            0 <span className="text-xs font-normal text-muted-foreground font-mono-ui">seats</span>
          </div>
          <span className="text-[10px] text-muted-foreground">All vehicles withdrawn from this line</span>
        </div>

        <div className="rounded-lg border border-destructive/30 bg-background/60 p-3">
          <span className="text-muted-foreground text-[10px] uppercase">Simulated Local Demand</span>
          <div className="font-display text-lg font-bold text-destructive mt-0.5">
            0.0 <span className="text-xs font-normal text-muted-foreground font-mono-ui">pax/h</span>
          </div>
          <span className="text-[10px] text-muted-foreground">Local corridor throughput set to zero</span>
        </div>
      </div>

      {/* Mandatory Mathematical Truth Notice */}
      <div className="flex items-start gap-2 rounded-lg border border-border/70 bg-card/80 p-3 text-[11px] leading-relaxed text-muted-foreground">
        <Info size={14} className="text-primary shrink-0 mt-0.5" />
        <div>
          <strong className="text-foreground">Mathematical Disruption Notice:</strong> Corridor suspension isolates the selected line and sets local throughput to zero. MetroMind's current simulation engine evaluates single-corridor capacity isolation. <em>Passenger redistribution or dynamic rerouting along alternative parallel corridors is not modeled by this calculation.</em>
        </div>
      </div>
    </div>
  );
}
