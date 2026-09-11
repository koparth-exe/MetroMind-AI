import { useState, useMemo, useRef, useCallback } from 'react';
import { TrendingUp, Clock, Zap, Users } from 'lucide-react';
import type { PassengerScrubPoint } from './types';

interface TrendItem {
  label: string;
  demand: number;
  baseline: number;
}

interface PassengerFlowChartProps {
  trend: TrendItem[];
  transportMode: 'RAILWAY' | 'BUS';
  selectedRouteName?: string;
}

export function PassengerFlowChart({ trend, transportMode, selectedRouteName }: PassengerFlowChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const safeTrend = useMemo(() => {
    if (trend && trend.length > 0) return trend;
    return [{ label: '12:00', demand: 100, baseline: 90 }];
  }, [trend]);

  // Calculations: min, max, morning crest, evening crest, deltas
  const {
    maxVal,
    minVal,
    morningPeakIndex,
    morningDeltaPct,
    eveningPeakIndex,
    eveningDeltaPct,
  } = useMemo(() => {
    let max = -Infinity;
    let min = Infinity;

    safeTrend.forEach((item) => {
      if (item.demand > max) max = item.demand;
      if (item.baseline > max) max = item.baseline;
      if (item.demand < min) min = item.demand;
      if (item.baseline < min) min = item.baseline;
    });

    if (min === Infinity) min = 0;
    if (max === -Infinity) max = 100;
    const paddedMax = Math.ceil(max * 1.08);
    const paddedMin = Math.max(0, Math.floor(min * 0.8));

    // Morning window: 06:00 to 11:00
    let mornMax = -1;
    let mornIdx = -1;
    safeTrend.forEach((item, idx) => {
      const h = parseInt(item.label.split(':')[0], 10);
      if (h >= 6 && h <= 11 && item.demand > mornMax) {
        mornMax = item.demand;
        mornIdx = idx;
      }
    });
    if (mornIdx < 0 && safeTrend.length > 0) {
      mornIdx = Math.min(8, safeTrend.length - 1);
    }

    let mornDelta: string | null = null;
    if (mornIdx >= 0 && safeTrend[mornIdx].baseline > 0) {
      const diff = safeTrend[mornIdx].demand - safeTrend[mornIdx].baseline;
      const pct = (diff / safeTrend[mornIdx].baseline) * 100;
      mornDelta = `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`;
    }

    // Evening window: 16:00 to 21:00
    let eveMax = -1;
    let eveIdx = -1;
    safeTrend.forEach((item, idx) => {
      const h = parseInt(item.label.split(':')[0], 10);
      if (h >= 16 && h <= 21 && item.demand > eveMax) {
        eveMax = item.demand;
        eveIdx = idx;
      }
    });
    if (eveIdx < 0 && safeTrend.length > 0) {
      eveIdx = Math.min(18, safeTrend.length - 1);
    }

    let eveDelta: string | null = null;
    if (eveIdx >= 0 && safeTrend[eveIdx].baseline > 0) {
      const diff = safeTrend[eveIdx].demand - safeTrend[eveIdx].baseline;
      const pct = (diff / safeTrend[eveIdx].baseline) * 100;
      eveDelta = `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`;
    }

    return {
      maxVal: paddedMax,
      minVal: paddedMin,
      morningPeakIndex: mornIdx,
      morningDeltaPct: mornDelta,
      eveningPeakIndex: eveIdx,
      eveningDeltaPct: eveDelta,
    };
  }, [safeTrend]);

  const range = maxVal - minVal || 1;
  const numPoints = safeTrend.length;

  const getY = useCallback(
    (val: number) => {
      const norm = (val - minVal) / range;
      return 90 - norm * 76;
    },
    [minVal, range]
  );

  const forecastPoints = useMemo(() => {
    return safeTrend
      .map((item, i) => `${(i / (numPoints - 1)) * 100},${getY(item.demand)}`)
      .join(' ');
  }, [safeTrend, numPoints, getY]);

  const baselinePoints = useMemo(() => {
    return safeTrend
      .map((item, i) => `${(i / (numPoints - 1)) * 100},${getY(item.baseline)}`)
      .join(' ');
  }, [safeTrend, numPoints, getY]);

  const areaPolygon = useMemo(() => {
    if (numPoints < 2) return '';
    return `0,92 ${forecastPoints} 100,92`;
  }, [forecastPoints, numPoints]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || numPoints < 2) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const ratio = x / rect.width;
    const index = Math.round(ratio * (numPoints - 1));
    setHoverIndex(index);
  };

  const handlePointerLeave = () => {
    setHoverIndex(null);
  };

  const formatY = (v: number) => {
    if (v >= 10000) return `${(v / 1000).toFixed(1)}k`;
    if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
    return String(v);
  };

  const mornX = morningPeakIndex >= 0 ? (morningPeakIndex / (numPoints - 1)) * 100 : null;
  const mornY = morningPeakIndex >= 0 ? getY(safeTrend[morningPeakIndex]?.demand ?? 0) : null;

  const eveX = eveningPeakIndex >= 0 ? (eveningPeakIndex / (numPoints - 1)) * 100 : null;
  const eveY = eveningPeakIndex >= 0 ? getY(safeTrend[eveningPeakIndex]?.demand ?? 0) : null;

  const isCrestClose = mornX !== null && eveX !== null && Math.abs(eveX - mornX) < 18;
  const mornBadgeLeft = mornX !== null ? Math.max(12, Math.min(88, mornX)) : 35;
  const eveBadgeLeft = eveX !== null ? Math.max(12, Math.min(88, eveX)) : 78;

  // Active scrub point
  const activeScrub: PassengerScrubPoint | null = useMemo(() => {
    if (hoverIndex === null || hoverIndex < 0 || hoverIndex >= safeTrend.length) {
      return null;
    }
    const item = safeTrend[hoverIndex];
    const diff = item.demand - item.baseline;
    const variancePct = item.baseline > 0 ? (diff / item.baseline) * 100 : 0;
    const h = parseInt(item.label.split(':')[0], 10);
    let flowBand = 'Night Off-Peak';
    if (h >= 7 && h <= 11) flowBand = 'Morning Inflow Surge';
    else if (h > 11 && h < 16) flowBand = 'Midday Shoulder';
    else if (h >= 16 && h <= 21) flowBand = 'Evening Inflow Surge';

    return {
      hour: item.label,
      demand: item.demand,
      baseline: item.baseline,
      variancePct,
      flowBand,
    };
  }, [hoverIndex, safeTrend]);

  return (
    <section
      aria-label="24-Hour Passenger Inflow Trajectory"
      className="signal-card flex flex-col rounded-2xl p-5 sm:p-6"
    >
      {/* Header section with telemetry headline and legend */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-border/70 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
            <h2 className="font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
              24-Hour Diurnal Passenger Inflow Trajectory
            </h2>
            {selectedRouteName && (
              <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono-ui text-[9px] font-bold uppercase text-primary">
                Filtered: {selectedRouteName}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Continuous {transportMode === 'BUS' ? 'BEST Bus' : 'Suburban Rail'} hourly passenger boardings plotted against baseline timetable capacity.
            {eveningDeltaPct && (
              <span className="ml-1 text-foreground font-medium">
                Evening inflow crest exceeds baseline by <span className="text-accent font-bold">{eveningDeltaPct}</span>.
              </span>
            )}
          </p>
        </div>

        {/* Legend & Time-of-Day Bands */}
        <div className="flex flex-wrap items-center gap-4 font-mono-ui text-[10px] uppercase tracking-wider text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="h-1 w-4 rounded-full bg-primary" aria-hidden="true" />
            <span className="font-semibold text-foreground">Passenger Flow</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 border-t border-dashed border-accent" aria-hidden="true" />
            <span>Baseline</span>
          </div>
        </div>
      </div>

      {/* Interactive HUD Readout */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/25 px-3.5 py-2.5">
        {activeScrub ? (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 font-mono-ui text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock size={13} className="text-primary" />
              <span>TIMESTEP:</span>
              <strong className="text-foreground text-sm font-bold">{activeScrub.hour}</strong>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users size={13} className="text-primary" />
              <span>PASSENGER FLOW:</span>
              <strong className="text-primary text-sm font-bold tabular-nums">
                {activeScrub.demand.toLocaleString()} pax/h
              </strong>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span>BASELINE:</span>
              <strong className="text-foreground tabular-nums">{activeScrub.baseline.toLocaleString()}</strong>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span>VARIANCE:</span>
              <span
                className={`font-bold tabular-nums ${
                  activeScrub.variancePct > 0 ? 'text-primary' : 'text-risk-medium'
                }`}
              >
                {activeScrub.variancePct > 0 ? '+' : ''}
                {activeScrub.variancePct.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground ml-auto hidden lg:flex">
              <span className="rounded bg-muted px-2 py-0.5 font-bold uppercase text-foreground text-[9.5px]">
                {activeScrub.flowBand}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 font-mono-ui text-xs text-muted-foreground">
            {morningPeakIndex >= 0 && (
              <div className="flex items-center gap-1.5">
                <Zap size={13} className="text-primary" />
                <span>MORNING INFLOW:</span>
                <strong className="text-foreground font-bold tabular-nums">
                  {safeTrend[morningPeakIndex]?.demand.toLocaleString()} pax/h
                </strong>
                <span>({safeTrend[morningPeakIndex]?.label})</span>
              </div>
            )}
            {eveningPeakIndex >= 0 && (
              <div className="flex items-center gap-1.5">
                <TrendingUp size={13} className="text-accent" />
                <span>EVENING INFLOW:</span>
                <strong className="text-foreground font-bold tabular-nums">
                  {safeTrend[eveningPeakIndex]?.demand.toLocaleString()} pax/h
                </strong>
                <span>({safeTrend[eveningPeakIndex]?.label})</span>
              </div>
            )}
            <span className="text-[10px] text-muted-foreground/70 ml-auto hidden md:inline">
              Hover or touch chart to scrub through hourly passenger flow
            </span>
          </div>
        )}
      </div>

      {/* Main Chart Canvas Area */}
      <div className="relative mt-5 flex-1 flex flex-col justify-between">
        <div className="flex flex-1 min-h-[224px] sm:min-h-[256px] gap-2 sm:gap-3">
          {/* Y-Axis scale */}
          <div
            className="relative w-11 sm:w-14 shrink-0 select-none font-mono-ui text-[9px] text-muted-foreground"
            aria-hidden="true"
          >
            <span className="absolute -top-3 right-0 text-[8.5px] font-bold uppercase tracking-wider text-muted-foreground/80">
              pax/h
            </span>
            <span className="absolute right-0 -translate-y-1/2 tabular-nums" style={{ top: '14%' }}>
              {formatY(maxVal)}
            </span>
            <span className="absolute right-0 -translate-y-1/2 tabular-nums" style={{ top: '50%' }}>
              {formatY(Math.round((maxVal + minVal) / 2))}
            </span>
            <span className="absolute right-0 -translate-y-1/2 tabular-nums" style={{ top: '88%' }}>
              {formatY(minVal)}
            </span>
          </div>

          {/* Interactive Chart Canvas (SVG) */}
          <div
            ref={containerRef}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            className="relative min-w-0 flex-1 h-full cursor-crosshair touch-none select-none"
            data-testid="chart-passenger-flow"
          >
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="h-full w-full overflow-visible"
              aria-label="24-hour passenger flow curve"
            >
              <defs>
                <linearGradient id="passengerFlowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.32" />
                  <stop offset="60%" stopColor="hsl(var(--primary))" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Commute Window Background Highlights */}
              {/* Morning Surge 07:00 (30.4%) to 11:00 (47.8%) */}
              <rect
                x="30.4"
                y="10"
                width="17.4"
                height="80"
                fill="hsl(var(--primary))"
                fillOpacity="0.04"
              />
              {/* Evening Surge 16:00 (69.5%) to 21:00 (91.3%) */}
              <rect
                x="69.5"
                y="10"
                width="21.8"
                height="80"
                fill="hsl(var(--accent))"
                fillOpacity="0.04"
              />

              {/* Grid Lines */}
              <line x1="0" y1="14" x2="100" y2="14" stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.6" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.6" />
              <line x1="0" y1="88" x2="100" y2="88" stroke="hsl(var(--border))" strokeWidth="0.75" opacity="0.8" />

              {/* Gradient Area Polygon */}
              {areaPolygon && <polygon points={areaPolygon} fill="url(#passengerFlowGrad)" />}

              {/* Baseline Polyline (dashed amber) */}
              <polyline
                points={baselinePoints}
                fill="none"
                stroke="hsl(var(--accent))"
                strokeWidth="1.6"
                strokeDasharray="4 3"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.85"
              />

              {/* Forecast Polyline (solid mint/primary) */}
              <polyline
                points={forecastPoints}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2.6"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Morning Crest Leader & Marker */}
              {mornX !== null && mornY !== null && (
                <g>
                  <line
                    x1={mornX}
                    y1={Math.max(6, mornY - 12)}
                    x2={mornX}
                    y2={mornY}
                    stroke="hsl(var(--primary))"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.6"
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle
                    cx={mornX}
                    cy={mornY}
                    r="3.5"
                    fill="hsl(var(--primary))"
                    stroke="hsl(var(--card))"
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              )}

              {/* Evening Crest Leader & Marker */}
              {eveX !== null && eveY !== null && (
                <g>
                  <line
                    x1={eveX}
                    y1={Math.max(6, eveY - 12)}
                    x2={eveX}
                    y2={eveY}
                    stroke="hsl(var(--accent))"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.6"
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle
                    cx={eveX}
                    cy={eveY}
                    r="3.5"
                    fill="hsl(var(--accent))"
                    stroke="hsl(var(--card))"
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              )}

              {/* Active Scrub Line & Cursor Point */}
              {hoverIndex !== null && (
                <g>
                  <line
                    x1={(hoverIndex / (numPoints - 1)) * 100}
                    y1="10"
                    x2={(hoverIndex / (numPoints - 1)) * 100}
                    y2="90"
                    stroke="hsl(var(--foreground))"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.65"
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle
                    cx={(hoverIndex / (numPoints - 1)) * 100}
                    cy={getY(safeTrend[hoverIndex]?.demand ?? 0)}
                    r="4"
                    fill="hsl(var(--primary))"
                    stroke="hsl(var(--card))"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              )}
            </svg>

            {/* Morning Crest Badge */}
            {mornX !== null && mornY !== null && morningPeakIndex >= 0 && (
              <div
                className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-primary/40 bg-card/95 px-2 py-0.5 font-mono-ui text-[8.5px] font-bold uppercase tracking-wider text-primary shadow-xs backdrop-blur-xs flex items-center gap-1.5 transition-all duration-150"
                style={{
                  left: `${mornBadgeLeft}%`,
                  top: `max(6px, calc(${mornY}% - 8px))`,
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" aria-hidden="true" />
                <span>Morning Surge</span>
                <span className="text-muted-foreground font-normal">({safeTrend[morningPeakIndex]?.label})</span>
              </div>
            )}

            {/* Evening Crest Badge */}
            {eveX !== null && eveY !== null && eveningPeakIndex >= 0 && (
              <div
                className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-accent/40 bg-card/95 px-2 py-0.5 font-mono-ui text-[8.5px] font-bold uppercase tracking-wider text-accent shadow-xs backdrop-blur-xs flex items-center gap-1.5 transition-all duration-150"
                style={{
                  left: `${eveBadgeLeft}%`,
                  top: isCrestClose
                    ? `max(28px, calc(${eveY}% - 28px))`
                    : `max(6px, calc(${eveY}% - 8px))`,
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" aria-hidden="true" />
                <span>Evening Surge</span>
                <span className="text-muted-foreground font-normal">({safeTrend[eveningPeakIndex]?.label})</span>
              </div>
            )}
          </div>
        </div>

        {/* X-Axis scale */}
        <div className="flex gap-2 sm:gap-3">
          <div className="w-11 sm:w-14 shrink-0" />
          <div className="relative mt-3 min-w-0 flex-1 overflow-hidden font-mono-ui text-[9.5px] text-muted-foreground h-4" aria-hidden="true">
            {safeTrend.map((x, i) => {
              if (i % 4 !== 0 && i !== safeTrend.length - 1) return null;
              const pct = (i / (numPoints - 1)) * 100;
              return (
                <span
                  key={x.label}
                  className="absolute -translate-x-1/2 select-none font-medium"
                  style={{ left: `${pct}%` }}
                >
                  {x.label}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
