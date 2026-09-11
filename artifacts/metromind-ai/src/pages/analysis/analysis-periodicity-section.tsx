import { useState } from 'react';
import { Waypoints, Activity, Calendar, Zap, Sparkles } from 'lucide-react';
import type { AnalysisFourier, AnalysisFourierActualItem, AnalysisFourierSpectrumItem } from '@workspace/api-client-react';

interface AnalysisPeriodicitySectionProps {
  fourier: AnalysisFourier;
}

export function AnalysisPeriodicitySection({ fourier }: AnalysisPeriodicitySectionProps) {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [hoveredHarmonic, setHoveredHarmonic] = useState<number | null>(null);

  // Day of week points for SVG line curve
  const days = fourier.actual;
  const maxDemand = Math.max(...days.map((d: AnalysisFourierActualItem) => Math.max(d.demand, d.pattern)), 1);
  const minDemand = Math.min(...days.map((d: AnalysisFourierActualItem) => Math.min(d.demand, d.pattern)), 0);
  const range = maxDemand - minDemand || 1;

  // Normalized points across 0-100 coordinate space
  const demandPoints = days
    .map((d: AnalysisFourierActualItem, i: number) => `${(i / (days.length - 1)) * 100},${90 - ((d.demand - minDemand) / range) * 75}`)
    .join(' ');

  const patternPoints = days
    .map((d: AnalysisFourierActualItem, i: number) => `${(i / (days.length - 1)) * 100},${90 - ((d.pattern - minDemand) / range) * 75}`)
    .join(' ');

  return (
    <section
      aria-label="Temporal Periodicity Intelligence"
      className="signal-card rounded-2xl border border-border/80 bg-card/95 p-5 sm:p-6 shadow-xs"
    >
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
            <h2 className="font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
              Temporal Periodicity & Fourier Decomposition
            </h2>
            <span className="rounded-full border border-border/70 bg-muted/50 px-2.5 py-0.5 font-mono-ui text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              Fast Fourier Transform (FFT)
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Decomposes timetable arrivals into discrete harmonic components to isolate recurrent commute cycles from stochastic noise.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono-ui text-[10px] text-muted-foreground">
          <span>Sampling: <strong className="text-foreground">1.0h hourly intervals</strong></span>
          <span className="text-muted-foreground/40">·</span>
          <span>Top Harmonics: <strong className="text-foreground">8 extracted</strong></span>
        </div>
      </div>

      {/* Main Grid: Left KPI + Harmonic Spectrum | Right Day-of-Week profile */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_1.35fr]">
        {/* Left Card: Harmonic Parameters & Discrete FFT Spectrum */}
        <div className="rounded-xl border border-border/70 bg-card/60 p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono-ui text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                Cyclical Energy Distribution
              </span>
              <span className="rounded bg-primary/10 px-2 py-0.5 font-mono-ui text-[9px] font-semibold text-primary">
                Frequency Domain
              </span>
            </div>

            {/* Dominant Cycle Metric */}
            <div className="mt-3.5 grid grid-cols-2 gap-3 rounded-lg border border-border/50 bg-muted/20 p-3">
              <div>
                <div className="font-mono-ui text-[10px] text-muted-foreground">Dominant Period</div>
                <div className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-0.5 tabular-nums">
                  {fourier.dominantPeriod.toFixed(0)}
                  <span className="ml-1 text-xs font-sans font-medium text-muted-foreground">hours</span>
                </div>
                <div className="text-[10px] text-primary font-mono-ui mt-0.5 font-semibold">
                  Bimodal commute resonance
                </div>
              </div>

              <div className="border-l border-border/50 pl-3">
                <div className="font-mono-ui text-[10px] text-muted-foreground">Spectral Energy Concentration</div>
                <div className="font-display text-2xl sm:text-3xl font-bold text-primary mt-0.5 tabular-nums">
                  {(fourier.peakStrength * 100).toFixed(0)}%
                </div>
                <div className="text-[10px] text-muted-foreground font-mono-ui mt-0.5">
                  Variance in fundamental mode
                </div>
              </div>
            </div>

            {/* Cyclical Pattern Qualitative Takeaway */}
            <div className="mt-3 text-xs text-muted-foreground font-sans leading-relaxed border-b border-border/50 pb-3">
              {fourier.pattern}
            </div>

            {/* Discrete Spectrum Bar Visual */}
            <div className="mt-4">
              <div className="flex items-center justify-between font-mono-ui text-[10px] text-muted-foreground mb-2">
                <span>Discrete Harmonic Spectrum (H1–H8)</span>
                <span>Relative Power (P / P_max)</span>
              </div>

              <div className="flex h-36 items-end gap-1.5 sm:gap-2 rounded-lg border border-border/50 bg-background/50 p-2.5 pb-1">
                {fourier.spectrum.map((h: AnalysisFourierSpectrumItem, i: number) => {
                  const isHovered = hoveredHarmonic === i;
                  const pctHeight = Math.max(8, Math.round(h.amplitude * 100));

                  return (
                    <div
                      key={h.period}
                      onMouseEnter={() => setHoveredHarmonic(i)}
                      onMouseLeave={() => setHoveredHarmonic(null)}
                      className="group flex flex-1 flex-col items-center gap-1.5 h-full justify-end cursor-pointer"
                    >
                      {/* Bar */}
                      <div
                        className={`w-full rounded-t-sm transition-all duration-200 ${
                          i === 0
                            ? 'bg-primary shadow-xs'
                            : isHovered
                            ? 'bg-primary/90'
                            : 'bg-primary/50 group-hover:bg-primary/80'
                        }`}
                        style={{ height: `${pctHeight}%` }}
                      />

                      {/* Label */}
                      <span
                        className={`font-mono-ui text-[8.5px] transition-colors ${
                          isHovered || i === 0
                            ? 'font-bold text-foreground'
                            : 'text-muted-foreground'
                        }`}
                      >
                        H{h.period}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Spectrum Detail Footer */}
              <div className="mt-2 flex items-center justify-between font-mono-ui text-[10px] text-muted-foreground">
                <span>
                  {hoveredHarmonic !== null
                    ? `Harmonic H${fourier.spectrum[hoveredHarmonic].period}: ${(fourier.spectrum[hoveredHarmonic].amplitude * 100).toFixed(0)}% relative spectral power`
                    : 'Hover over harmonic bars to inspect relative spectral density'}
                </span>
                <span className="text-primary font-semibold">H1 Dominant</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Day of Week Actual vs Fitted Harmonic Pattern */}
        <div className="rounded-xl border border-border/70 bg-card/60 p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono-ui text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                Temporal Periodicity Validation
              </span>
              <div className="flex items-center gap-3 font-mono-ui text-[10px]">
                <span className="flex items-center gap-1.5 text-foreground font-semibold">
                  <span className="h-2 w-2 rounded-full bg-primary" /> Observed Average
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-0.5 w-3 border-t border-dashed border-accent" /> Fitted Periodic
                </span>
              </div>
            </div>

            <div className="mt-1 text-xs text-muted-foreground">
              Evaluates weekly demand persistence: regular Monday–Friday business commute vs weekend holiday suppression.
            </div>

            {/* SVG Curve Canvas */}
            <div className="mt-4 relative h-48 w-full rounded-lg border border-border/50 bg-background/50 p-3 pt-4">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible select-none">
                <defs>
                  <linearGradient id="fourier-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.28" />
                    <stop offset="70%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Guide Lines */}
                <line x1="0" y1="20" x2="100" y2="20" stroke="hsl(var(--border))" strokeWidth=".5" strokeDasharray="3 3" opacity=".5" />
                <line x1="0" y1="55" x2="100" y2="55" stroke="hsl(var(--border))" strokeWidth=".5" strokeDasharray="3 3" opacity=".5" />
                <line x1="0" y1="90" x2="100" y2="90" stroke="hsl(var(--border))" strokeWidth=".7" opacity=".7" />

                {/* Filled Area below Observed Demand */}
                <polygon points={`0,90 ${demandPoints} 100,90`} fill="url(#fourier-grad)" />

                {/* Fitted Periodic Line (dashed) */}
                <polyline
                  points={patternPoints}
                  fill="none"
                  stroke="hsl(var(--accent))"
                  strokeWidth="1.6"
                  strokeDasharray="3 2"
                  opacity=".85"
                />

                {/* Observed Demand Line (solid primary) */}
                <polyline
                  points={demandPoints}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Points on each day */}
                {days.map((d: AnalysisFourierActualItem, i: number) => {
                  const x = (i / (days.length - 1)) * 100;
                  const y = 90 - ((d.demand - minDemand) / range) * 75;
                  const isHovered = hoveredDay === i;

                  return (
                    <g key={d.label} className="cursor-pointer">
                      <circle
                        cx={x}
                        cy={y}
                        r={isHovered ? 4.5 : 3}
                        fill="hsl(var(--card))"
                        stroke="hsl(var(--primary))"
                        strokeWidth="2"
                        className="transition-all"
                      />
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* X-Axis Day Labels with Hover State */}
            <div className="mt-3 grid grid-cols-7 gap-1 text-center font-mono-ui text-[10.5px]">
              {days.map((d: AnalysisFourierActualItem, i: number) => {
                const isHovered = hoveredDay === i;
                const isWeekend = d.label === 'Sat' || d.label === 'Sun';

                return (
                  <button
                    key={d.label}
                    type="button"
                    onMouseEnter={() => setHoveredDay(i)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className={`rounded-md py-1 transition-all ${
                      isHovered
                        ? 'bg-primary/20 text-primary font-bold'
                        : isWeekend
                        ? 'text-muted-foreground/70 bg-muted/20'
                        : 'text-foreground hover:bg-muted/40'
                    }`}
                  >
                    <div>{d.label}</div>
                    <div className="text-[9.5px] tabular-nums font-semibold mt-0.5">
                      {d.demand.toFixed(0)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Day Details Banner */}
          <div className="mt-4 rounded-lg border border-border/50 bg-muted/20 p-2.5 flex items-center justify-between text-xs font-mono-ui">
            <div className="text-muted-foreground">
              {hoveredDay !== null ? (
                <span>
                  <strong className="text-foreground">{days[hoveredDay].label}</strong>: Observed demand{' '}
                  <strong className="text-primary">{days[hoveredDay].demand.toLocaleString()} pax</strong> · Harmonic fit{' '}
                  <strong className="text-accent">{days[hoveredDay].pattern.toLocaleString()} pax</strong>
                </span>
              ) : (
                <span>Hover over days to inspect observed mean vs sinusoidal fitted pattern</span>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground font-semibold uppercase">
              Mon–Sun Diurnal Cycle
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
