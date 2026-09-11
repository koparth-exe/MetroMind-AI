import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useGetDashboard, useRunSimulation } from '@workspace/api-client-react';
import { useTransportMode } from '@/components/metro-shell';
import type { TransportMode, ScenarioFormState, ScenarioPreset, SimulatorRouteComparison, SimulatorNetworkComparison } from './types';
import { SimulatorHeader } from './simulator-header';
import { SimulatorPresets, SCENARIO_PRESETS } from './simulator-presets';
import { SimulatorControls } from './simulator-controls';
import { SimulatorContextHero } from './simulator-context-hero';
import { SimulatorResponseChart } from './simulator-response-chart';
import { SimulatorRouteMatrix } from './simulator-route-matrix';
import { SimulatorDisruptionCard } from './simulator-disruption-card';
import { SimulatorExplainer } from './simulator-explainer';
import { SimulatorInterpretation } from './simulator-interpretation';
import { SimulatorProgression } from './simulator-progression';
import { SimulatorLoading } from './simulator-loading';
import { SimulatorError } from './simulator-error';

const DEFAULT_FORM_STATE: ScenarioFormState = {
  rainfall: 0,
  temperature: 20,
  demandMultiplier: 1.0,
  unavailableRoute: '',
  specialEvent: false,
};

export function SimulatorPage() {
  const { transportMode } = useTransportMode();
  const typedMode = transportMode as TransportMode;

  // 1. Authoritative Live Baseline Query
  const dashboardQuery = useGetDashboard(typedMode);

  // 2. Authoritative Simulation Mutation
  const simulationMutation = useRunSimulation();

  // 3. Local Scenario Workstation State
  const [formState, setFormState] = useState<ScenarioFormState>(DEFAULT_FORM_STATE);
  const [activePresetId, setActivePresetId] = useState<string | null>('nominal');
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);

  // 4. CRITICAL RULE 7 & 21: Mode Isolation (Railway <-> Bus)
  // When transportMode changes, immediately purge simulation result, reset inputs, and clear active preset
  useEffect(() => {
    setSimulationResult(null);
    setFormState(DEFAULT_FORM_STATE);
    setActivePresetId('nominal');
    setIsDirty(false);
  }, [typedMode]);

  // Derived primary trunk route ID for disruption preset
  const primaryRouteId = dashboardQuery.data?.routes?.[0]?.routeId ?? (typedMode === 'BUS' ? 'B1' : 'R1');
  const datasetName = dashboardQuery.data ? (typedMode === 'BUS' ? 'BEST_TRANSIT_2026' : 'MMR_TRANSIT_2026') : 'TIMETABLE_OBSERVATIONS';
  const baselineDemand = dashboardQuery.data?.totalPredictedDemand ?? 0;
  const baselineRoutes = dashboardQuery.data?.routes ?? [];
  const baselineCapacity = useMemo(() => {
    return baselineRoutes.reduce((acc, r) => acc + (r.capacity ?? 0), 0);
  }, [baselineRoutes]);

  // Field updater
  const handleUpdateField = useCallback(<K extends keyof ScenarioFormState>(field: K, value: ScenarioFormState[K]) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setActivePresetId(null); // Clear preset selection when custom slider moved
  }, []);

  // Preset selector (prepares scenario, does NOT run simulation)
  const handleSelectPreset = useCallback((preset: ScenarioPreset) => {
    const suspendedId = preset.requiresRouteSuspension ? primaryRouteId : '';
    setFormState({
      rainfall: preset.rainfall,
      temperature: preset.temperature,
      demandMultiplier: preset.demandMultiplier,
      specialEvent: preset.specialEvent,
      unavailableRoute: suspendedId,
    });
    setActivePresetId(preset.id);
    setIsDirty(true);
  }, [primaryRouteId]);

  // Reset to Baseline
  const handleResetToBaseline = useCallback(() => {
    setFormState(DEFAULT_FORM_STATE);
    setActivePresetId('nominal');
    setIsDirty(true);
  }, []);

  // Explicit Run Scenario Execution
  const handleRunSimulation = useCallback(() => {
    simulationMutation.mutate(
      {
        mode: typedMode,
        data: {
          availableBuses: 4, // passed through to summary; does not alter route capacity in backend math
          rainfall: formState.rainfall,
          temperature: formState.temperature,
          demandMultiplier: formState.demandMultiplier,
          isHoliday: false,
          specialEvent: formState.specialEvent,
          unavailableRoute: formState.unavailableRoute || undefined,
        },
      },
      {
        onSuccess: (data) => {
          setSimulationResult(data);
          setIsDirty(false);
        },
      }
    );
  }, [typedMode, formState, simulationMutation]);

  // Derived Joined Route Comparisons
  const routeComparisons: SimulatorRouteComparison[] = useMemo(() => {
    const scenMap = new Map((simulationResult?.routes ?? []).map((r: any) => [r.routeId, r]));

    return baselineRoutes.map((b) => {
      const s = scenMap.get(b.routeId) as any | undefined;
      const isSuspended = b.routeId === formState.unavailableRoute;
      const simDemand = s ? s.predictedDemand : b.predictedDemand;
      const simCap = s ? s.capacity : b.capacity;
      const dDelta = simDemand - b.predictedDemand;
      const dDeltaPct = b.predictedDemand > 0 ? (dDelta / b.predictedDemand) * 100 : 0;
      const simUtil = s
        ? (simCap > 0 ? s.utilization : null)
        : (b.capacity > 0 ? b.utilization : null);
      const prob = s ? s.overcrowdingProbability : b.overcrowdingProbability;
      const risk = s ? s.risk : b.risk;

      return {
        routeId: b.routeId,
        name: b.name,
        color: b.color,
        stations: b.stations,
        coordinates: b.coordinates,
        baselineDemand: b.predictedDemand,
        simulatedDemand: simDemand,
        demandDelta: dDelta,
        demandDeltaPct: dDeltaPct,
        baselineCapacity: b.capacity,
        capacity: simCap,
        baselineUtilization: b.utilization,
        simulatedUtilization: simUtil,
        overloadProbability: prob,
        riskBand: risk,
        isSuspended,
      };
    });
  }, [baselineRoutes, simulationResult?.routes, formState.unavailableRoute]);

  // Derived Macro Network Comparison
  const networkComparison: SimulatorNetworkComparison | null = useMemo(() => {
    if (!simulationResult) return null;

    const simDemand = simulationResult.scenario.demand;
    const dDelta = simDemand - baselineDemand;
    const dDeltaPct = baselineDemand > 0 ? (dDelta / baselineDemand) * 100 : 0;

    const activeRoutes = routeComparisons.filter((r) => !r.isSuspended);
    const simCap = activeRoutes.reduce((acc, r) => acc + r.capacity, 0);
    const capDelta = simCap - baselineCapacity;

    const baseUnserved = simulationResult.baseline.objectiveValue;
    const simUnserved = simulationResult.scenario.objectiveValue;
    const uDelta = simUnserved - baseUnserved;

    const baseRisk = simulationResult.baseline.risk;
    const simRisk = simulationResult.scenario.risk;
    const rDelta = simRisk - baseRisk;

    return {
      mode: typedMode,
      datasetName,
      baselineDemand,
      simulatedDemand: simDemand,
      demandDelta: dDelta,
      demandDeltaPct: dDeltaPct,
      baselineCapacity,
      simulatedCapacity: simCap,
      capacityDelta: capDelta,
      baselineUnserved: baseUnserved,
      simulatedUnserved: simUnserved,
      unservedDelta: uDelta,
      baselineRisk: baseRisk,
      simulatedRisk: simRisk,
      riskDelta: rDelta,
      activeCorridorsCount: activeRoutes.length,
      suspendedCorridorsCount: routeComparisons.length - activeRoutes.length,
      routes: routeComparisons,
      label: simulationResult.label,
    };
  }, [simulationResult, baselineDemand, baselineCapacity, routeComparisons, typedMode, datasetName]);

  const suspendedRoute = useMemo(() => {
    return routeComparisons.find((r) => r.isSuspended) ?? null;
  }, [routeComparisons]);

  // Loading & Error States
  if (dashboardQuery.isLoading && !dashboardQuery.data) {
    return <SimulatorLoading />;
  }

  if (dashboardQuery.isError && !dashboardQuery.data) {
    return <SimulatorError onRetry={() => dashboardQuery.refetch()} />;
  }

  const hasExecutedScenario = Boolean(simulationResult);

  return (
    <div className="min-h-screen pb-16 space-y-6">
      {/* 1. Command Header */}
      <SimulatorHeader
        transportMode={typedMode}
        datasetName={datasetName}
        hasExecutedScenario={hasExecutedScenario}
        isSimulating={simulationMutation.isPending}
      />

      {/* 2. Scenario Presets Row */}
      <SimulatorPresets
        transportMode={typedMode}
        activePresetId={activePresetId}
        onSelectPreset={handleSelectPreset}
        onResetToBaseline={handleResetToBaseline}
        primaryRouteId={primaryRouteId}
      />

      {/* 3. Main Analytical Workstation (2-Column Grid on Desktop) */}
      <div className="grid gap-6 lg:grid-cols-[330px_1fr]">
        {/* Left Column: Parameter Workstation */}
        <div>
          <SimulatorControls
            transportMode={typedMode}
            state={formState}
            routes={baselineRoutes}
            isSimulating={simulationMutation.isPending}
            onUpdateField={handleUpdateField}
            onRunSimulation={handleRunSimulation}
            isDirty={isDirty}
            hasExecutedScenario={hasExecutedScenario}
          />
        </div>

        {/* Right Column: Comparative Analytical Results */}
        <div className="space-y-6 min-w-0">
          {/* 4. Macro Impact Overview Hero */}
          <SimulatorContextHero
            comparison={networkComparison}
            baselineDemand={baselineDemand}
            baselineCapacity={baselineCapacity}
            routeCount={baselineRoutes.length}
            hasExecutedScenario={hasExecutedScenario}
          />

          {/* 5. Suspension Notice Card (if route suspended) */}
          <SimulatorDisruptionCard suspendedRoute={suspendedRoute} />

          {/* 6. 2D Scenario Response Visualizer */}
          <SimulatorResponseChart
            routes={routeComparisons}
            hasExecutedScenario={hasExecutedScenario}
          />

          {/* 7. Authoritative Route Stress Matrix */}
          <SimulatorRouteMatrix
            routes={routeComparisons}
            hasExecutedScenario={hasExecutedScenario}
          />

          {/* 8. Deterministic Operational Briefing */}
          <SimulatorInterpretation
            comparison={networkComparison}
            hasExecutedScenario={hasExecutedScenario}
          />

          {/* 9. Mathematical Model Explainer */}
          <SimulatorExplainer />
        </div>
      </div>

      {/* 10. Decision Progression Footer */}
      <SimulatorProgression transportMode={typedMode} />
    </div>
  );
}
