import React from 'react';
import { CloudRain, Thermometer, TrendingUp, Ban, ShieldCheck, Play, LoaderCircle, Info, Sparkles } from 'lucide-react';
import type { ScenarioFormState, TransportMode } from './types';
import type { RouteInsight } from '@workspace/api-client-react';

interface SimulatorControlsProps {
  transportMode: TransportMode;
  state: ScenarioFormState;
  routes: RouteInsight[];
  isSimulating: boolean;
  onUpdateField: <K extends keyof ScenarioFormState>(field: K, value: ScenarioFormState[K]) => void;
  onRunSimulation: () => void;
  isDirty: boolean;
  hasExecutedScenario: boolean;
}

export function SimulatorControls({
  transportMode,
  state,
  routes,
  isSimulating,
  onUpdateField,
  onRunSimulation,
  isDirty,
  hasExecutedScenario,
}: SimulatorControlsProps) {
  const isBus = transportMode === 'BUS';
  const fleetUnit = isBus ? 'buses' : 'train sets';
  const nominalCapPerVeh = isBus ? '70 seats/bus' : '3,000 seats/train set';

  const multiplierPresets = [0.8, 1.0, 1.2, 1.5];

  return (
    <section
      id="simulator-controls"
      aria-label="Simulator Scenario Controls Workstation"
      className="rounded-xl border border-border/70 bg-card/75 p-4 sm:p-5 shadow-sm space-y-5"
    >
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div>
          <span className="font-mono-ui text-[10px] font-semibold uppercase tracking-wider text-primary">
            Scenario Workstation
          </span>
          <h2 className="font-display text-base font-bold text-foreground mt-0.5">
            Operating Conditions Vector
          </h2>
        </div>
        <div className="flex items-center gap-1.5 font-mono-ui text-[11px]">
          <span
            className={`h-2 w-2 rounded-full ${
              isSimulating ? 'animate-pulse bg-accent' : hasExecutedScenario ? 'bg-primary' : 'bg-muted-foreground/60'
            }`}
          />
          <span className="text-muted-foreground text-[10px]">
            {isSimulating ? 'Simulating...' : hasExecutedScenario ? 'Evaluated' : 'Ready'}
          </span>
        </div>
      </div>

      {/* 1. Rainfall Control */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="input-rainfall" className="flex items-center gap-1.5 font-mono-ui text-xs font-semibold text-foreground">
            <CloudRain size={14} className="text-cyan-400" />
            <span>Rainfall</span>
          </label>
          <span className="font-mono-ui text-xs font-bold text-cyan-400">
            {state.rainfall} <span className="text-[10px] text-muted-foreground">mm</span>
          </span>
        </div>
        <input
          id="input-rainfall"
          type="range"
          min={0}
          max={80}
          step={1}
          value={state.rainfall}
          onChange={(e) => onUpdateField('rainfall', Number(e.target.value))}
          data-testid="slider-rainfall"
          className="w-full accent-cyan-400 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between font-mono-ui text-[9px] text-muted-foreground">
          <span>0 mm (Clear)</span>
          <span>40 mm (Monsoon)</span>
          <span>80 mm (Max)</span>
        </div>
        <p className="font-mono-ui text-[9.5px] text-muted-foreground/80 leading-relaxed">
          Linear attenuation factor: <strong className="text-foreground">−1% demand</strong> per mm rainfall.
        </p>
      </div>

      {/* 2. Temperature Control */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="input-temperature" className="flex items-center gap-1.5 font-mono-ui text-xs font-semibold text-foreground">
            <Thermometer size={14} className="text-amber-400" />
            <span>Temperature</span>
          </label>
          <span className="font-mono-ui text-xs font-bold text-amber-400">
            {state.temperature} <span className="text-[10px] text-muted-foreground">°C</span>
          </span>
        </div>
        <input
          id="input-temperature"
          type="range"
          min={10}
          max={40}
          step={1}
          value={state.temperature}
          onChange={(e) => onUpdateField('temperature', Number(e.target.value))}
          data-testid="slider-temperature"
          className="w-full accent-amber-400 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between font-mono-ui text-[9px] text-muted-foreground">
          <span>10°C (Mild)</span>
          <span>20°C (Baseline Ref)</span>
          <span>40°C (Heatwave)</span>
        </div>
        <p className="font-mono-ui text-[9.5px] text-muted-foreground/80 leading-relaxed">
          Thermal sensitivity: <strong className="text-foreground">+0.5% demand</strong> per °C deviation above 20°C.
        </p>
      </div>

      {/* 3. Demand Multiplier Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="input-multiplier" className="flex items-center gap-1.5 font-mono-ui text-xs font-semibold text-foreground">
            <TrendingUp size={14} className="text-primary" />
            <span>Demand Multiplier</span>
          </label>
          <span className="font-mono-ui text-xs font-bold text-primary">
            {state.demandMultiplier.toFixed(2)}x
          </span>
        </div>
        <input
          id="input-multiplier"
          type="range"
          min={0.5}
          max={2.5}
          step={0.05}
          value={state.demandMultiplier}
          onChange={(e) => onUpdateField('demandMultiplier', Number(e.target.value))}
          data-testid="slider-demand-multiplier"
          className="w-full accent-primary h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex items-center gap-1.5">
          {multiplierPresets.map((mult) => (
            <button
              key={mult}
              type="button"
              onClick={() => onUpdateField('demandMultiplier', mult)}
              data-testid={`chip-multiplier-${mult}`}
              className={`flex-1 rounded border py-1 font-mono-ui text-[10px] font-semibold transition-all ${
                Math.abs(state.demandMultiplier - mult) < 0.01
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border/60 bg-card text-muted-foreground hover:border-border hover:text-foreground'
              }`}
            >
              {mult.toFixed(1)}x
            </button>
          ))}
        </div>
        <p className="font-mono-ui text-[9.5px] text-muted-foreground/80 leading-relaxed">
          Direct scalar applied across all active route timetable volumes.
        </p>
      </div>

      {/* 4. Corridor Suspension Dropdown */}
      <div className="space-y-1.5">
        <label htmlFor="select-unavailable-route" className="flex items-center gap-1.5 font-mono-ui text-xs font-semibold text-foreground">
          <Ban size={14} className="text-risk-high" />
          <span>Corridor Suspension</span>
        </label>
        <select
          id="select-unavailable-route"
          value={state.unavailableRoute}
          onChange={(e) => onUpdateField('unavailableRoute', e.target.value)}
          data-testid="select-unavailable-route"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary shadow-2xs cursor-pointer"
        >
          <option value="">None (All Corridors Operational)</option>
          {routes.map((route) => (
            <option key={route.routeId} value={route.routeId}>
              {route.routeId} · {route.name}
            </option>
          ))}
        </select>
        <p className="font-mono-ui text-[9.5px] text-muted-foreground/80 leading-relaxed">
          Sets selected line's simulated throughput and capacity to 0. <strong className="text-foreground">Passenger redistribution is not modeled.</strong>
        </p>
      </div>

      {/* 5. Passive Fleet Context (Mathematical Honesty: Demoted from editable inputs) */}
      <div className="rounded-lg border border-border/50 bg-muted/20 p-2.5 text-[10.5px] font-mono-ui text-muted-foreground space-y-1">
        <div className="flex items-center justify-between font-semibold text-foreground">
          <span className="flex items-center gap-1">
            <ShieldCheck size={12} className="text-primary" />
            <span>Nominal Fleet Context</span>
          </span>
          <span>4 {fleetUnit} (1/corridor)</span>
        </div>
        <p className="text-[9.5px] leading-tight text-muted-foreground">
          Nominal capacity: {nominalCapPerVeh}. Fleet reallocation is modeled exclusively in 8H Optimization.
        </p>
      </div>

      {/* Execution CTA Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onRunSimulation}
          disabled={isSimulating}
          data-testid="button-run-simulation"
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-mono-ui text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:pointer-events-none active:scale-[0.99]"
        >
          {isSimulating ? (
            <>
              <LoaderCircle size={15} className="animate-spin" />
              <span>Simulating Operational Vector...</span>
            </>
          ) : (
            <>
              <Play size={15} className="fill-current" />
              <span>Run Scenario Simulation</span>
            </>
          )}
        </button>
        <div className="mt-2 text-center" aria-live="polite">
          <span className="font-mono-ui text-[9.5px] text-muted-foreground">
            {isSimulating
              ? 'Evaluating Gaussian exceedance equations...'
              : hasExecutedScenario
              ? isDirty
                ? 'Parameters modified — click to re-run scenario.'
                : 'Scenario executed and synchronized.'
              : 'Prepare scenario conditions, then click to evaluate.'}
          </span>
        </div>
      </div>
    </section>
  );
}
