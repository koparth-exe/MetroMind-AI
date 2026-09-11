import { useState, useEffect } from 'react';
import type { RouteInsight, PredictionResult } from '@workspace/api-client-react';
import { usePredictDemand } from '@workspace/api-client-react';
import { Button } from '@/components/metro-shell';
import { Waypoints, LoaderCircle, Calendar, Clock, Info, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import type { TransportMode } from '@/lib/transport-mode';

interface PassengerJourneyLookupProps {
  routes: RouteInsight[];
  selectedRouteId?: string;
  onSelectRoute: (routeId: string) => void;
  transportMode: TransportMode;
}

export function PassengerJourneyLookup({
  routes,
  selectedRouteId,
  onSelectRoute,
  transportMode,
}: PassengerJourneyLookupProps) {
  const predict = usePredictDemand();
  const [routeId, setRouteId] = useState(selectedRouteId || routes[0]?.routeId || (transportMode === 'BUS' ? 'B1' : 'R1'));
  const [date, setDate] = useState('2026-08-20');
  const [hour, setHour] = useState('18');
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);

  // Sync with outer selectedRouteId when updated from map or ranking
  useEffect(() => {
    if (selectedRouteId && routes.some((r) => r.routeId === selectedRouteId)) {
      setRouteId(selectedRouteId);
    }
  }, [selectedRouteId, routes]);

  // Keep routeId valid if transport mode changes
  useEffect(() => {
    if (routes.length > 0 && !routes.some((r) => r.routeId === routeId)) {
      const defaultId = routes[0].routeId;
      setRouteId(defaultId);
      setPrediction(null);
    }
  }, [routes, routeId]);

  const selectedRoute = routes.find((r) => r.routeId === routeId) ?? routes[0];
  const selectedPrediction = prediction?.routes.find((r) => r.routeId === selectedRoute?.routeId);

  const runPrediction = () => {
    predict.mutate(
      {
        mode: transportMode,
        data: {
          date,
          hour: Number(hour),
          rainfall: 0,
          temperature: 18,
          isHoliday: false,
          specialEvent: false,
          demandMultiplier: 1,
        },
      },
      {
        onSuccess: (data) => {
          setPrediction(data);
          onSelectRoute(routeId);
        },
      }
    );
  };

  // Run initial prediction once on mount or mode change so user has immediate intelligence
  useEffect(() => {
    if (routes.length > 0 && !prediction) {
      predict.mutate(
        {
          mode: transportMode,
          data: {
            date: '2026-08-20',
            hour: 18,
            rainfall: 0,
            temperature: 18,
            isHoliday: false,
            specialEvent: false,
            demandMultiplier: 1,
          },
        },
        {
          onSuccess: (data) => setPrediction(data),
        }
      );
    }
  }, [transportMode, routes]);

  const expectedDemand = selectedPrediction?.predictedDemand ?? selectedRoute?.predictedDemand ?? 0;
  const capacity = selectedRoute?.capacity ?? 1;
  const utilization = expectedDemand / capacity;
  const crowding =
    utilization >= 1.0 ? 'Critical' : utilization >= 0.85 ? 'High' : utilization >= 0.70 ? 'Moderate' : 'Low';

  const suggestion =
    crowding === 'Critical' || crowding === 'High'
      ? 'Travel 30–45 minutes earlier (17:15) or later (19:30); the adjacent shoulder windows provide significantly greater capacity headroom.'
      : crowding === 'Moderate'
      ? 'If your schedule permits, travel outside the peak hour for a more comfortable journey with seated capacity.'
      : 'This departure window operates well below capacity limits. Excellent choice for a quiet, uncrowded journey.';

  return (
    <section
      aria-label="Journey Crowding Lookup"
      className="signal-card flex flex-col justify-between rounded-2xl p-5 sm:p-6"
    >
      <div>
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-3.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
            <h2 className="font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
              Departure Crowding Lookup & Planning
            </h2>
            <span className="rounded-full border border-border/70 bg-muted/50 px-2.5 py-0.5 font-mono-ui text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              ML Inference
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Test a custom corridor and departure timestep against the calibrated model
          </span>
        </div>

        {/* Input Controls Grid */}
        <div className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-4 items-end">
          {/* Corridor Select */}
          <label className="block group">
            <span className="font-mono-ui text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground group-focus-within:text-primary transition-colors">
              Corridor
            </span>
            <select
              value={routeId}
              onChange={(e) => {
                setRouteId(e.target.value);
                onSelectRoute(e.target.value);
              }}
              data-testid="select-passenger-route"
              className="mt-1.5 w-full rounded-lg border border-input bg-background/90 px-3 py-2 text-xs font-semibold text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-2xs"
            >
              {routes.map((route) => (
                <option key={route.routeId} value={route.routeId}>
                  {route.routeId} · {route.name}
                </option>
              ))}
            </select>
          </label>

          {/* Date Picker */}
          <label className="block group">
            <span className="font-mono-ui text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground group-focus-within:text-primary transition-colors">
              Date
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              data-testid="input-passenger-date"
              className="mt-1.5 w-full rounded-lg border border-input bg-background/90 px-3 py-2 text-xs font-semibold font-mono-ui text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-2xs"
            >
            </input>
          </label>

          {/* Departure Time */}
          <label className="block group">
            <span className="font-mono-ui text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground group-focus-within:text-primary transition-colors">
              Departure Time
            </span>
            <input
              type="time"
              value={`${hour.padStart(2, '0')}:00`}
              onChange={(e) => setHour(e.target.value.split(':')[0])}
              data-testid="input-passenger-time"
              className="mt-1.5 w-full rounded-lg border border-input bg-background/90 px-3 py-2 text-xs font-semibold font-mono-ui text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-2xs"
            />
          </label>

          {/* Action Trigger Button */}
          <div>
            <Button
              onClick={runPrediction}
              disabled={predict.isPending}
              testId="button-passenger-predict"
              className="w-full min-h-9 font-mono-ui text-xs font-semibold"
            >
              {predict.isPending ? (
                <LoaderCircle size={13} className="animate-spin text-primary" />
              ) : (
                <Waypoints size={13} />
              )}
              <span>{predict.isPending ? 'Forecasting…' : 'Check Crowding'}</span>
            </Button>
          </div>
        </div>

        {/* Prediction Results HUD */}
        <div className="mt-5 rounded-xl border border-border/80 bg-muted/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: selectedRoute?.color }}
                aria-hidden="true"
              />
              <span className="font-display text-sm font-bold text-foreground">
                {selectedRoute?.routeId} · {selectedRoute?.name} at {hour.padStart(2, '0')}:00
              </span>
            </div>
            <span className="rounded bg-muted px-2 py-0.5 font-mono-ui text-[9px] font-semibold text-muted-foreground uppercase">
              Model: {prediction?.model ?? 'Gradient Boosting'}
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {/* Expected Boardings */}
            <div className="rounded-lg border border-border/60 bg-card/60 p-3.5 shadow-2xs">
              <div className="font-mono-ui text-[9px] uppercase tracking-wider text-muted-foreground">
                Expected Demand
              </div>
              <div className="mt-2 font-display text-3xl font-bold text-foreground tabular-nums">
                {Math.round(expectedDemand).toLocaleString()}
              </div>
              <div className="mt-0.5 font-mono-ui text-[10px] text-muted-foreground">
                passenger boardings
              </div>
            </div>

            {/* Crowding Level */}
            <div className="rounded-lg border border-border/60 bg-card/60 p-3.5 shadow-2xs">
              <div className="font-mono-ui text-[9px] uppercase tracking-wider text-muted-foreground">
                Crowding Level
              </div>
              <div
                className={`mt-2 font-display text-3xl font-bold ${
                  crowding === 'Critical' || crowding === 'High'
                    ? 'text-risk-high'
                    : crowding === 'Moderate'
                    ? 'text-risk-medium'
                    : 'text-risk-low'
                }`}
              >
                {crowding}
              </div>
              <div className="mt-0.5 font-mono-ui text-[10px] text-muted-foreground">
                Capacity signal
              </div>
            </div>

            {/* Utilization Bar */}
            <div className="rounded-lg border border-border/60 bg-card/60 p-3.5 shadow-2xs">
              <div className="flex items-center justify-between font-mono-ui text-[9px] uppercase tracking-wider text-muted-foreground">
                <span>Utilization</span>
                <span className="font-bold text-foreground tabular-nums">{Math.round(utilization * 100)}%</span>
              </div>
              <div className="mt-3.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    crowding === 'Critical' || crowding === 'High'
                      ? 'bg-risk-high'
                      : crowding === 'Moderate'
                      ? 'bg-risk-medium'
                      : 'bg-risk-low'
                  }`}
                  style={{ width: `${Math.min(utilization * 100, 100)}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between font-mono-ui text-[9px] text-muted-foreground">
                <span>Cap: {capacity.toLocaleString()}</span>
                <span>{Math.max(0, capacity - expectedDemand).toLocaleString()} seats/space</span>
              </div>
            </div>
          </div>

          {/* 95% Confidence Interval */}
          {selectedPrediction && (
            <div className="mt-4 rounded-lg border border-border/60 bg-background/50 p-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                <span className="text-muted-foreground font-medium">95% Uncertainty Planning Interval:</span>
                <span className="font-mono-ui font-bold text-foreground">
                  {Math.round(selectedPrediction.lowerBound).toLocaleString()} — {Math.round(selectedPrediction.upperBound).toLocaleString()} passengers
                </span>
              </div>
              <div className="relative mt-2.5 h-2 rounded-full bg-muted">
                <div
                  className="absolute h-2 rounded-full bg-primary/30"
                  style={{
                    left: `${Math.max(0, (selectedPrediction.lowerBound / (selectedPrediction.upperBound || 1)) * 60)}%`,
                    right: '8%',
                  }}
                />
                <div
                  className="absolute top-[-2px] h-3 w-1.5 rounded-full bg-primary shadow-xs"
                  style={{
                    left: `${Math.min(94, (selectedPrediction.predictedDemand / (selectedPrediction.upperBound || 1)) * 82)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Alternate Departure Recommendation */}
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/[0.05] p-3.5">
            <Waypoints size={16} className="mt-0.5 shrink-0 text-primary" />
            <div className="text-xs">
              <div className="font-display font-bold text-foreground">
                Shoulder Window Recommendation
              </div>
              <p className="mt-0.5 leading-relaxed text-muted-foreground">
                {suggestion}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
