import { ArrowUpRight, ArrowDownRight, Eye, Layers, MapPin, Sparkles, Target, TrendingUp } from 'lucide-react';
import type { CorridorDisplayData, CorridorSelection } from './types';
import type { TransportMode } from '@/lib/transport-mode';

interface PredictionCorridorBreakdownProps {
  corridors: CorridorDisplayData[];
  selectedCorridor: CorridorSelection;
  onSelectCorridor: (corridor: CorridorSelection) => void;
  transportMode: TransportMode;
  scenarioHour: number;
}

export function PredictionCorridorBreakdown({
  corridors,
  selectedCorridor,
  onSelectCorridor,
  transportMode,
  scenarioHour,
}: PredictionCorridorBreakdownProps) {
  const maxDemand = Math.max(...corridors.map((c) => Math.max(c.predictedDemand, c.upperBound)), 1);

  return (
    <section
      id="prediction-breakdown"
      aria-label="Multi-Corridor Demand Forecasts"
      className="signal-card overflow-hidden rounded-2xl border border-border/80 bg-card/95 p-5 shadow-xs sm:p-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-primary" />
            <h2 className="font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
              Corridor-Level Demand Forecasts & Variance
            </h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Multi-corridor cross-sectional demand predictions with route-level prediction intervals. Click any corridor to focus.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={() => onSelectCorridor('ALL')}
            className={`rounded-xl border px-3 py-1.5 font-mono-ui text-xs font-semibold transition-all cursor-pointer ${
              selectedCorridor === 'ALL'
                ? 'border-primary bg-primary/10 text-primary font-bold shadow-2xs'
                : 'border-border/70 bg-card text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            }`}
          >
            Show All Corridors
          </button>
        </div>
      </div>

      {/* Corridor Cards Grid */}
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {corridors.map((c) => {
          const isSelected = selectedCorridor === c.routeId;
          const isSurge = c.percentDifference > 0;
          const barWidth = Math.max(8, Math.min(100, (c.predictedDemand / maxDemand) * 100));
          const lowerWidth = Math.max(0, Math.min(100, (c.lowerBound / maxDemand) * 100));
          const upperWidth = Math.max(lowerWidth, Math.min(100, (c.upperBound / maxDemand) * 100));

          return (
            <div
              key={c.routeId}
              onClick={() => onSelectCorridor(c.routeId)}
              data-testid={`card-corridor-prediction-${c.routeId}`}
              className={`group relative rounded-2xl border p-4 sm:p-5 transition-all cursor-pointer ${
                isSelected
                  ? 'border-primary bg-primary/[0.05] shadow-sm ring-1 ring-primary/30'
                  : 'border-border/70 bg-card/70 hover:border-primary/40 hover:bg-card/95 hover:shadow-xs'
              }`}
            >
              {/* Header: Corridor ID, Color Tag, Name */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-3.5 w-3.5 rounded-full ring-2 ring-background shrink-0"
                    style={{ backgroundColor: c.color || 'hsl(var(--primary))' }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-base font-bold text-foreground group-hover:text-primary transition-colors">
                        {c.name || c.routeId}
                      </span>
                      <span className="rounded px-1.5 py-0.5 font-mono-ui text-[9px] font-bold uppercase bg-muted text-muted-foreground">
                        {c.routeId}
                      </span>
                    </div>

                    {c.stations && c.stations.length > 0 && (
                      <div className="mt-0.5 flex items-center gap-1 font-mono-ui text-[10px] text-muted-foreground">
                        <MapPin size={10} className="text-primary/70 shrink-0" />
                        <span className="truncate">
                          {c.stations[0]} ↔ {c.stations[c.stations.length - 1]} ({c.stations.length} stops)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  <div
                    className={`inline-flex items-center gap-0.5 rounded-lg px-2 py-0.5 font-mono-ui text-[11px] font-bold ${
                      isSurge
                        ? 'bg-primary/15 text-primary border border-primary/20'
                        : 'bg-accent/15 text-accent-foreground border border-accent/20'
                    }`}
                  >
                    {isSurge ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    <span>
                      {isSurge ? '+' : ''}
                      {c.percentDifference.toFixed(1)}%
                    </span>
                  </div>

                  {isSelected && (
                    <span className="rounded-full bg-primary/20 p-1 text-primary" title="Currently Focused">
                      <Eye size={12} />
                    </span>
                  )}
                </div>
              </div>

              {/* Demand Telemetry Numbers */}
              <div className="mt-4 grid grid-cols-3 gap-2 border-y border-border/50 py-3 font-mono-ui text-xs">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Forecast</div>
                  <div className="mt-0.5 font-display text-sm font-bold text-foreground">
                    {Math.round(c.predictedDemand).toLocaleString()}
                  </div>
                  <div className="text-[9px] text-muted-foreground">pax/h</div>
                </div>

                <div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Baseline</div>
                  <div className="mt-0.5 font-display text-sm font-semibold text-muted-foreground">
                    {Math.round(c.historicalAverage).toLocaleString()}
                  </div>
                  <div className="text-[9px] text-muted-foreground">pax/h</div>
                </div>

                <div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground">95% PI</div>
                  <div className="mt-0.5 font-mono-ui text-xs font-semibold text-foreground truncate">
                    {Math.round(c.lowerBound)}–{Math.round(c.upperBound)}
                  </div>
                  <div className="text-[9px] text-muted-foreground">pax/h</div>
                </div>
              </div>

              {/* Relative Range Bar */}
              <div className="mt-3.5 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono-ui text-muted-foreground">
                  <span>Relative Corridor Load</span>
                  <span title={`Predicted demand (${Math.round(c.predictedDemand)} pax/h) relative to scenario peak upper bound (${Math.round(maxDemand)} pax/h)`}>
                    {Math.round((c.predictedDemand / maxDemand) * 100)}% of scenario peak envelope
                  </span>
                </div>
                <div className="relative h-2 w-full rounded-full bg-muted/60 overflow-hidden">
                  {/* Uncertainty Band Span */}
                  <div
                    className="absolute h-full bg-primary/25 rounded-full"
                    style={{
                      left: `${lowerWidth}%`,
                      width: `${Math.max(4, upperWidth - lowerWidth)}%`,
                    }}
                  />
                  {/* Forecast Point Bar */}
                  <div
                    className="absolute h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: c.color || 'hsl(var(--primary))',
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
