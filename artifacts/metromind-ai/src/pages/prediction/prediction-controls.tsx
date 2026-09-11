import { Calendar, Clock, CloudRain, Cpu, Filter, LoaderCircle, Play, RotateCcw, Sliders, Sun, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/metro-shell';
import type { ModelMetric, PredictionScenarioState, CorridorSelection } from './types';
import type { RouteInsight } from '@workspace/api-client-react';

interface PredictionControlsProps {
  state: PredictionScenarioState;
  onChange: (updates: Partial<PredictionScenarioState>) => void;
  onReset: () => void;
  onSubmit: () => void;
  isPending: boolean;
  availableModels: ModelMetric[];
  routes: RouteInsight[];
  selectedCorridor: CorridorSelection;
  onSelectCorridor: (corridor: CorridorSelection) => void;
}

export function PredictionControls({
  state,
  onChange,
  onReset,
  onSubmit,
  isPending,
  availableModels,
  routes,
  selectedCorridor,
  onSelectCorridor,
}: PredictionControlsProps) {
  const peakPresets = [
    { label: 'Morning Peak', hour: 9, meta: '09:00' },
    { label: 'Midday', hour: 13, meta: '13:00' },
    { label: 'Evening Peak', hour: 18, meta: '18:00' },
    { label: 'Late Night', hour: 22, meta: '22:00' },
  ];

  return (
    <section
      id="prediction-controls"
      aria-label="Scenario Forecasting Controls"
      className="signal-card overflow-hidden rounded-2xl border border-border/80 bg-card/95 shadow-xs"
    >
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 px-4 py-3.5 sm:px-5 sm:py-4">
        <div className="flex items-center gap-2">
          <Sliders size={16} className="text-primary" />
          <h2 className="font-display text-sm font-bold tracking-tight text-foreground sm:text-base">
            Scenario Control Workstation
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-border/60 bg-muted/50 px-2.5 py-0.5 font-mono-ui text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            INPUT VECTOR
          </span>
          <button
            type="button"
            onClick={onReset}
            data-testid="button-reset-controls"
            title="Reset scenario to standard weekday baseline"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-5">
        {/* Section 1: Temporal Context & Commute Presets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono-ui text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar size={12} className="text-primary" />
              1. Temporal Parameters
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Date Input */}
            <label className="block group">
              <span className="font-mono-ui text-[9.5px] uppercase tracking-wider text-muted-foreground group-focus-within:text-primary transition-colors">
                Scenario Date
              </span>
              <input
                type="date"
                value={state.date}
                onChange={(e) => onChange({ date: e.target.value })}
                data-testid="input-date"
                className="mt-1.5 w-full rounded-lg border border-input bg-background/90 px-3 py-2 text-xs font-semibold font-mono-ui text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-2xs"
              />
            </label>

            {/* Departure Hour */}
            <div className="block">
              <div className="flex items-center justify-between">
                <span className="font-mono-ui text-[9.5px] uppercase tracking-wider text-muted-foreground">
                  Departure Hour
                </span>
                <span className="font-mono-ui text-xs font-bold text-primary">
                  {String(state.hour).padStart(2, '0')}:00
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="23"
                  step="1"
                  value={state.hour}
                  onChange={(e) => onChange({ hour: Number(e.target.value) })}
                  aria-label="Departure hour slider"
                  className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
                />
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={state.hour}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(23, Number(e.target.value)));
                    onChange({ hour: val });
                  }}
                  data-testid="input-hour"
                  className="w-16 rounded-lg border border-input bg-background/90 px-2 py-1 text-center font-mono-ui text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          {/* Quick Crest Presets */}
          <div>
            <div className="text-[10px] font-mono-ui text-muted-foreground mb-1.5">
              Quick Commute Crest Presets:
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {peakPresets.map((preset) => {
                const isSelected = state.hour === preset.hour;
                return (
                  <button
                    key={preset.hour}
                    type="button"
                    onClick={() => onChange({ hour: preset.hour })}
                    className={`rounded-lg border px-2.5 py-1.5 text-left text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-2xs'
                        : 'border-border/70 bg-card/60 text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono-ui text-[9px] uppercase">
                      <span>{preset.meta}</span>
                      {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                    </div>
                    <div className="truncate font-semibold text-[11px]">{preset.label}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 2: Exogenous Covariates (Weather & Multipliers) */}
        <div className="space-y-3 border-t border-border/60 pt-4">
          <span className="font-mono-ui text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <CloudRain size={12} className="text-primary" />
            2. Weather & Demand Factors
          </span>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Rainfall */}
            <label className="block group">
              <span className="flex items-center justify-between font-mono-ui text-[9.5px] uppercase tracking-wider text-muted-foreground group-focus-within:text-primary transition-colors">
                <span>Rainfall</span>
                <span className="text-primary font-bold">{state.rainfall} mm</span>
              </span>
              <div className="mt-1.5 flex items-center rounded-lg border border-input bg-background/90 px-3 py-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 shadow-2xs transition-all">
                <input
                  type="number"
                  min="0"
                  max="150"
                  step="0.5"
                  value={state.rainfall}
                  onChange={(e) => onChange({ rainfall: Math.max(0, Number(e.target.value)) })}
                  data-testid="input-rainfall"
                  className="w-full bg-transparent font-mono-ui text-xs font-semibold text-foreground outline-none"
                />
                <span className="font-mono-ui text-[10px] text-muted-foreground select-none">mm</span>
              </div>
            </label>

            {/* Temperature */}
            <label className="block group">
              <span className="flex items-center justify-between font-mono-ui text-[9.5px] uppercase tracking-wider text-muted-foreground group-focus-within:text-primary transition-colors">
                <span>Temperature</span>
                <span className="text-primary font-bold">{state.temperature}°C</span>
              </span>
              <div className="mt-1.5 flex items-center rounded-lg border border-input bg-background/90 px-3 py-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 shadow-2xs transition-all">
                <input
                  type="number"
                  min="5"
                  max="50"
                  step="0.5"
                  value={state.temperature}
                  onChange={(e) => onChange({ temperature: Number(e.target.value) })}
                  data-testid="input-temperature"
                  className="w-full bg-transparent font-mono-ui text-xs font-semibold text-foreground outline-none"
                />
                <span className="font-mono-ui text-[10px] text-muted-foreground select-none">°C</span>
              </div>
            </label>

            {/* Demand Multiplier */}
            <label className="block group">
              <span className="flex items-center justify-between font-mono-ui text-[9.5px] uppercase tracking-wider text-muted-foreground group-focus-within:text-primary transition-colors">
                <span>Multiplier</span>
                <span className="text-primary font-bold">{state.demandMultiplier.toFixed(2)}x</span>
              </span>
              <div className="mt-1.5 flex items-center rounded-lg border border-input bg-background/90 px-3 py-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 shadow-2xs transition-all">
                <input
                  type="number"
                  min="0.1"
                  max="3.0"
                  step="0.05"
                  value={state.demandMultiplier}
                  onChange={(e) => onChange({ demandMultiplier: Math.max(0.1, Number(e.target.value)) })}
                  data-testid="input-multiplier"
                  className="w-full bg-transparent font-mono-ui text-xs font-semibold text-foreground outline-none"
                />
                <span className="font-mono-ui text-[10px] text-muted-foreground select-none">x</span>
              </div>
            </label>
          </div>

          {/* Calendar Overrides */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 pt-1">
            <label className="flex items-center justify-between rounded-xl border border-border/70 bg-card/60 px-3 py-2 cursor-pointer hover:bg-muted/40 transition-colors">
              <div>
                <div className="text-xs font-semibold text-foreground">Public Holiday</div>
                <div className="font-mono-ui text-[9.5px] text-muted-foreground">Holiday schedule attenuation</div>
              </div>
              <input
                type="checkbox"
                checked={state.isHoliday}
                onChange={(e) => onChange({ isHoliday: e.target.checked })}
                data-testid="input-holiday"
                className="h-4 w-4 rounded accent-primary cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-border/70 bg-card/60 px-3 py-2 cursor-pointer hover:bg-muted/40 transition-colors">
              <div>
                <div className="text-xs font-semibold text-foreground">Special Event Surge</div>
                <div className="font-mono-ui text-[9.5px] text-muted-foreground">+20% event inflow surge</div>
              </div>
              <input
                type="checkbox"
                checked={state.specialEvent}
                onChange={(e) => onChange({ specialEvent: e.target.checked })}
                data-testid="input-special-event"
                className="h-4 w-4 rounded accent-primary cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Section 3: Model Selection & Target Corridor Focus */}
        <div className="space-y-3 border-t border-border/60 pt-4">
          <span className="font-mono-ui text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Cpu size={12} className="text-primary" />
            3. Model Selection & Corridor Focus
          </span>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Model Selector */}
            <div>
              <label htmlFor="select-model-input" className="block font-mono-ui text-[9.5px] uppercase tracking-wider text-muted-foreground mb-1.5">
                Estimator Model
              </label>
              <select
                id="select-model-input"
                value={state.model}
                onChange={(e) => onChange({ model: e.target.value })}
                data-testid="select-model"
                className="w-full rounded-lg border border-input bg-background/90 px-3 py-2 font-mono-ui text-xs font-semibold text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-2xs cursor-pointer"
              >
                {availableModels.map((m) => (
                  <option key={m.model} value={m.model}>
                    {m.model} {m.isBest ? '★ (Champion)' : ''} — R²: {m.r2.toFixed(2)} · RMSE: {m.rmse.toFixed(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Corridor Focus Filter */}
            <div>
              <label htmlFor="select-corridor-input" className="block font-mono-ui text-[9.5px] uppercase tracking-wider text-muted-foreground mb-1.5">
                Inspect Corridor Focus
              </label>
              <select
                id="select-corridor-input"
                value={selectedCorridor}
                onChange={(e) => onSelectCorridor(e.target.value as CorridorSelection)}
                data-testid="select-corridor"
                className="w-full rounded-lg border border-input bg-background/90 px-3 py-2 font-mono-ui text-xs font-semibold text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-2xs cursor-pointer"
              >
                <option value="ALL">All Network Corridors (Total Aggregate)</option>
                {routes.map((r) => (
                  <option key={r.routeId} value={r.routeId}>
                    {r.name || r.routeId} ({r.routeId})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Execution Strip */}
        <div className="border-t border-border/70 pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="text-[11px] text-muted-foreground">
            Forecast recalculates passenger arrivals and prediction interval bands across all corridors.
          </div>

          <Button
            onClick={onSubmit}
            disabled={isPending}
            testId="button-run-prediction"
            className="px-6 py-2.5 text-xs font-bold shadow-sm"
          >
            {isPending ? (
              <>
                <LoaderCircle size={15} className="animate-spin" />
                <span>Running forecast...</span>
              </>
            ) : (
              <>
                <Play size={15} fill="currentColor" />
                <span>Run forecast</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}
