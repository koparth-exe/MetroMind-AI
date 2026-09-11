import { useState } from 'react';
import { Target, LoaderCircle, Sliders, RefreshCw, Minus, Plus } from 'lucide-react';
import { Panel, Button } from '@/components/metro-shell';
import type { TransportMode } from '@/lib/transport-mode';
import { getModeNomenclature, type OptimizationScenarioState, type FeasibilityCheckResult } from './types';
import { OptimizationFeasibilityGate } from './optimization-feasibility-gate';

interface OptimizationWorkbenchProps {
  transportMode: TransportMode;
  scenario: OptimizationScenarioState;
  onChangeScenario: (patch: Partial<OptimizationScenarioState>) => void;
  onResetDefaults: () => void;
  feasibility: FeasibilityCheckResult;
  onRunOptimization: () => void;
  isPending: boolean;
  routeCount: number;
}

export function OptimizationWorkbench({
  transportMode,
  scenario,
  onChangeScenario,
  onResetDefaults,
  feasibility,
  onRunOptimization,
  isPending,
  routeCount,
}: OptimizationWorkbenchProps) {
  const mode = getModeNomenclature(transportMode);

  const presets: Array<{
    name: string;
    label: string;
    description: string;
    patch: Partial<OptimizationScenarioState>;
  }> = [
    {
      name: 'baseline',
      label: 'Balanced Baseline',
      description: `4 ${mode.vehiclePlural} with standard capacity (${mode.defaultCapacity} pax)`,
      patch: {
        availableVehicles: 4,
        vehicleCapacity: mode.defaultCapacity,
        minVehiclesPerRoute: 1,
        maxVehiclesPerRoute: 4,
      },
    },
    {
      name: 'deficit',
      label: 'Constrained Pool (min=0)',
      description: `2 ${mode.vehiclePlural} with minimum 0 (tests greedy triage under fleet deficit)`,
      patch: {
        availableVehicles: 2,
        vehicleCapacity: mode.defaultCapacity,
        minVehiclesPerRoute: 0,
        maxVehiclesPerRoute: 2,
      },
    },
    {
      name: 'expansion',
      label: 'Surge Expansion (6)',
      description: `6 ${mode.vehiclePlural} deployed to maximize corridor headroom`,
      patch: {
        availableVehicles: 6,
        vehicleCapacity: mode.defaultCapacity,
        minVehiclesPerRoute: 1,
        maxVehiclesPerRoute: 4,
      },
    },
    {
      name: 'reduced_capacity',
      label: mode.isBus ? 'Microbus (50 pax)' : 'Shorter Rake (2000 pax)',
      description: `Tests operational overcrowding with lower unit vehicle sizing`,
      patch: {
        availableVehicles: 4,
        vehicleCapacity: mode.isBus ? 50 : 2000,
        minVehiclesPerRoute: 1,
        maxVehiclesPerRoute: 4,
      },
    },
  ];

  return (
    <div id="optimization-workbench">
      <Panel
        title="Constraint Workbench"
        meta="OPERATOR SCENARIO INPUTS"
      action={
        <button
          type="button"
          onClick={onResetDefaults}
          className="inline-flex items-center gap-1.5 font-mono-ui text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          data-testid="button-reset-defaults"
        >
          <RefreshCw size={11} /> Reset Defaults
        </button>
      }
    >
      <div className="space-y-5">
        {/* Scenario Provenance Notice distinguishing dataset from user scenario */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-[11px] font-mono-ui">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sliders size={12} className="text-primary shrink-0" />
            <span>Operator Scenario Controls: Inputs evaluate against canonical dataset <strong className="text-foreground">{mode.datasetName}</strong></span>
          </div>
          <span className="text-[10px] text-primary/80 font-semibold">User-Defined Scenario</span>
        </div>

        {/* Scenario Presets Pill Row */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono-ui text-[9.5px] uppercase tracking-wider text-muted-foreground font-semibold">
              Scenario Presets
            </span>
            <span className="font-mono-ui text-[9px] text-muted-foreground/80">1-click test configurations</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {presets.map((p) => {
              const isSelected =
                scenario.availableVehicles === p.patch.availableVehicles &&
                scenario.vehicleCapacity === p.patch.vehicleCapacity &&
                scenario.minVehiclesPerRoute === p.patch.minVehiclesPerRoute &&
                scenario.maxVehiclesPerRoute === p.patch.maxVehiclesPerRoute;

              return (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => onChangeScenario(p.patch)}
                  data-testid={`button-preset-${p.name}`}
                  className={`rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-primary bg-primary/[0.08] shadow-2xs'
                      : 'border-border/70 bg-card/60 hover:bg-muted/40 hover:border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-xs font-bold text-foreground truncate">{p.label}</span>
                    {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  </div>
                  <p className="mt-1 font-mono-ui text-[9px] text-muted-foreground leading-tight line-clamp-2">
                    {p.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Numeric Stepper Form Inputs Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* 1. Available Vehicles */}
          <StepperField
            label={`Available ${mode.vehiclePluralTitleCase}`}
            unit={mode.vehiclePlural}
            value={scenario.availableVehicles}
            min={1}
            max={20}
            step={1}
            onChange={(val) => onChangeScenario({ availableVehicles: val })}
            testId="input-available-vehicles"
          />

          {/* 2. Vehicle Capacity */}
          <StepperField
            label={`Capacity / ${mode.vehicleTitleCase}`}
            unit={mode.capacityUnit}
            value={scenario.vehicleCapacity}
            min={10}
            max={10000}
            step={mode.isBus ? 5 : 250}
            onChange={(val) => onChangeScenario({ vehicleCapacity: val })}
            testId="input-vehicle-capacity"
          />

          {/* 3. Min Vehicles / Route */}
          <StepperField
            label="Min / Corridor"
            unit="vehicles"
            value={scenario.minVehiclesPerRoute}
            min={0}
            max={scenario.maxVehiclesPerRoute}
            step={1}
            onChange={(val) => onChangeScenario({ minVehiclesPerRoute: val })}
            testId="input-min-vehicles"
          />

          {/* 4. Max Vehicles / Route */}
          <StepperField
            label="Max / Corridor"
            unit="vehicles"
            value={scenario.maxVehiclesPerRoute}
            min={Math.max(1, scenario.minVehiclesPerRoute)}
            max={10}
            step={1}
            onChange={(val) => onChangeScenario({ maxVehiclesPerRoute: val })}
            testId="input-max-vehicles"
          />
        </div>

        {/* Feasibility Gate Status Banner */}
        <OptimizationFeasibilityGate
          feasibility={feasibility}
          onApplyRemediation={(patch) => onChangeScenario(patch)}
          routeCount={routeCount}
          availableFleet={scenario.availableVehicles}
          minVehicles={scenario.minVehiclesPerRoute}
        />

        {/* Primary Run Action Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border/60">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sliders size={14} className="text-primary shrink-0" />
            <span>
              Solver allocates <strong className="text-foreground">{scenario.availableVehicles} {mode.vehiclePlural}</strong> across <strong className="text-foreground">{routeCount} corridors</strong> with nominal capacity of <strong className="text-foreground">{scenario.vehicleCapacity} {mode.capacityUnit}</strong>.
            </span>
          </div>

          <Button
            onClick={onRunOptimization}
            disabled={isPending || !feasibility.isFeasible}
            testId="button-solve-optimization"
            className="w-full sm:w-auto px-6"
          >
            {isPending ? (
              <>
                <LoaderCircle size={15} className="animate-spin" />
                <span>Running Optimization...</span>
              </>
            ) : (
              <>
                <Target size={15} />
                <span>Run Fleet Optimization</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </Panel>
    </div>
  );
}

function StepperField({
  label,
  unit,
  value,
  min,
  max,
  step,
  onChange,
  testId,
}: {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  testId: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/60 p-3 shadow-2xs">
      <div className="flex items-center justify-between">
        <label htmlFor={testId} className="font-mono-ui text-[9.5px] uppercase tracking-wider text-muted-foreground font-semibold">
          {label}
        </label>
        <span className="font-mono-ui text-[9px] text-muted-foreground">{unit}</span>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-background/80 text-foreground hover:bg-muted active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <Minus size={13} />
        </button>

        <input
          id={testId}
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const num = Number(e.target.value);
            if (!isNaN(num)) onChange(num);
          }}
          data-testid={testId}
          className="w-full text-center bg-transparent font-mono-ui text-base font-bold text-foreground outline-none tabular-nums"
        />

        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + step))}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-background/80 text-foreground hover:bg-muted active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}
