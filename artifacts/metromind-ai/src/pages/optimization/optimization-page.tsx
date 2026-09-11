import { useState, useEffect, useMemo, useCallback } from 'react';
import { useGetDashboard, useSolveOptimization } from '@workspace/api-client-react';
import type { RouteInsight, OptimizationResult, PredictionRoute } from '@workspace/api-client-react';
import { useTransportMode } from '@/components/metro-shell';

import {
  getModeNomenclature,
  evaluateFeasibility,
  buildBeforeAfterRows,
  type OptimizationScenarioState,
} from './types';

import { OptimizationHeader } from './optimization-header';
import { OptimizationContextHero } from './optimization-context-hero';
import { OptimizationWorkbench } from './optimization-workbench';
import { OptimizationSpatialNetwork } from './optimization-spatial-network';
import { OptimizationCapacityVisual } from './optimization-capacity-visual';
import { OptimizationMatrix } from './optimization-matrix';
import { OptimizationImpactSummary } from './optimization-impact-summary';
import { OptimizationExplainer } from './optimization-explainer';
import { OptimizationProgression } from './optimization-progression';
import { OptimizationLoading } from './optimization-loading';
import { OptimizationError } from './optimization-error';

// Demo fallback routes in case dashboard query is loading or disconnected
const DEMO_RAIL_ROUTES: RouteInsight[] = [
  { routeId: 'R1', name: 'Central Line', color: '#ef4444', predictedDemand: 2437.3, historicalAverage: 2176.2, capacity: 3000, utilization: 0.812, overcrowdingProbability: 0.01, risk: 'Medium', recommendedBuses: 1, baselineBuses: 1, stations: ['CSMT', 'Dadar', 'Kurla', 'Thane'], coordinates: [[18.94, 72.8352], [19.0178, 72.8438], [19.0664, 72.8801], [19.186, 72.9759]] },
  { routeId: 'R2', name: 'Western Line', color: '#3b82f6', predictedDemand: 2308.4, historicalAverage: 2061.1, capacity: 3000, utilization: 0.769, overcrowdingProbability: 0.002, risk: 'Medium', recommendedBuses: 1, baselineBuses: 1, stations: ['Dadar', 'Bandra', 'Andheri', 'Borivali'], coordinates: [[19.0178, 72.8438], [19.0544, 72.8406], [19.1197, 72.8468], [19.2307, 72.8567]] },
  { routeId: 'R3', name: 'Harbour Line', color: '#facc15', predictedDemand: 2071.7, historicalAverage: 1849.7, capacity: 3000, utilization: 0.691, overcrowdingProbability: 0.0, risk: 'Medium', recommendedBuses: 1, baselineBuses: 1, stations: ['CSMT', 'Kurla', 'Vashi', 'Panvel'], coordinates: [[18.94, 72.8352], [19.0664, 72.8801], [19.0745, 72.9986], [18.9902, 73.1172]] },
  { routeId: 'R4', name: 'Trans-Harbour Line', color: '#f97316', predictedDemand: 1749.4, historicalAverage: 1562.0, capacity: 3000, utilization: 0.583, overcrowdingProbability: 0.0, risk: 'Medium', recommendedBuses: 1, baselineBuses: 1, stations: ['Thane', 'Airoli', 'Vashi'], coordinates: [[19.186, 72.9759], [19.1513, 72.9932], [19.0745, 72.9986]] },
];

const DEMO_BUS_ROUTES: RouteInsight[] = [
  { routeId: 'B1', name: 'Vashi–Dadar', color: '#a855f7', predictedDemand: 25.2, historicalAverage: 22.5, capacity: 70, utilization: 0.36, overcrowdingProbability: 0.0, risk: 'Low', recommendedBuses: 1, baselineBuses: 1, stations: ['Vashi', 'Sion', 'Kurla', 'Dadar'], coordinates: [[19.0745, 72.9986], [19.046, 72.862], [19.0664, 72.8801], [19.0178, 72.8438]] },
  { routeId: 'B2', name: 'Panvel–Thane', color: '#14b8a6', predictedDemand: 22.0, historicalAverage: 19.6, capacity: 70, utilization: 0.314, overcrowdingProbability: 0.0, risk: 'Low', recommendedBuses: 1, baselineBuses: 1, stations: ['Panvel', 'Kharghar', 'Vashi', 'Airoli', 'Thane'], coordinates: [[18.9902, 73.1172], [19.0476, 73.0699], [19.0745, 72.9986], [19.1513, 72.9932], [19.186, 72.9759]] },
  { routeId: 'B3', name: 'Kharghar–CBD Belapur', color: '#f59e0b', predictedDemand: 18.0, historicalAverage: 16.1, capacity: 70, utilization: 0.257, overcrowdingProbability: 0.0, risk: 'Low', recommendedBuses: 1, baselineBuses: 1, stations: ['Kharghar', 'Belapur CBD', 'Nerul'], coordinates: [[19.0476, 73.0699], [19.0176, 73.0397], [19.033, 73.0169]] },
  { routeId: 'B4', name: 'Airoli–Vashi', color: '#ec4899', predictedDemand: 22.7, historicalAverage: 20.3, capacity: 70, utilization: 0.324, overcrowdingProbability: 0.0, risk: 'Low', recommendedBuses: 1, baselineBuses: 1, stations: ['Airoli', 'Ghansoli', 'Koparkhairane', 'Vashi'], coordinates: [[19.1513, 72.9932], [19.126, 72.998], [19.102, 72.997], [19.0745, 72.9986]] },
];

function predictionsFromRoutes(routes: RouteInsight[]): PredictionRoute[] {
  return routes.map((route) => ({
    routeId: route.routeId,
    predictedDemand: route.predictedDemand,
    historicalAverage: route.historicalAverage,
    difference: Math.round((route.predictedDemand - route.historicalAverage) * 10) / 10,
    percentDifference: route.historicalAverage
      ? Math.round(((route.predictedDemand / route.historicalAverage) - 1) * 1000) / 10
      : 0,
    lowerBound: Math.round(route.predictedDemand * 0.91 * 10) / 10,
    upperBound: Math.round(route.predictedDemand * 1.1 * 10) / 10,
  }));
}

export function OptimizationPage() {
  const { transportMode } = useTransportMode();
  const mode = getModeNomenclature(transportMode);

  // Authoritative Dashboard Query
  const dashboardQuery = useGetDashboard(transportMode);
  const rawRoutes: RouteInsight[] =
    dashboardQuery.data?.routes ?? (transportMode === 'BUS' ? DEMO_BUS_ROUTES : DEMO_RAIL_ROUTES);

  // Solver Mutation
  const solveMutation = useSolveOptimization();

  // Scenario workstation state
  const [scenario, setScenario] = useState<OptimizationScenarioState>({
    availableVehicles: mode.defaultFleet,
    vehicleCapacity: mode.defaultCapacity,
    minVehiclesPerRoute: mode.defaultMin,
    maxVehiclesPerRoute: mode.defaultMax,
  });

  // Solver result state (null until user explicitly triggers optimization)
  const [result, setResult] = useState<OptimizationResult | null>(null);

  // Reset state when transport mode changes to prevent cross-mode pollution
  useEffect(() => {
    const newMode = getModeNomenclature(transportMode);
    setScenario({
      availableVehicles: newMode.defaultFleet,
      vehicleCapacity: newMode.defaultCapacity,
      minVehiclesPerRoute: newMode.defaultMin,
      maxVehiclesPerRoute: newMode.defaultMax,
    });
    setResult(null);
  }, [transportMode]);

  // Patch scenario state
  const handleScenarioChange = useCallback((patch: Partial<OptimizationScenarioState>) => {
    setScenario((prev) => ({ ...prev, ...patch }));
  }, []);

  // Reset to mode defaults
  const handleResetDefaults = useCallback(() => {
    const defaultMode = getModeNomenclature(transportMode);
    setScenario({
      availableVehicles: defaultMode.defaultFleet,
      vehicleCapacity: defaultMode.defaultCapacity,
      minVehiclesPerRoute: defaultMode.defaultMin,
      maxVehiclesPerRoute: defaultMode.defaultMax,
    });
    setResult(null);
  }, [transportMode]);

  // Mathematical Feasibility Evaluation
  const feasibility = useMemo(() => {
    return evaluateFeasibility(
      scenario.availableVehicles,
      scenario.vehicleCapacity,
      scenario.minVehiclesPerRoute,
      scenario.maxVehiclesPerRoute,
      rawRoutes.length
    );
  }, [
    scenario.availableVehicles,
    scenario.vehicleCapacity,
    scenario.minVehiclesPerRoute,
    scenario.maxVehiclesPerRoute,
    rawRoutes.length,
  ]);

  // Execute Optimization Mutation
  const handleRunOptimization = useCallback(() => {
    if (!feasibility.isFeasible) return;

    solveMutation.mutate(
      {
        mode: transportMode,
        data: {
          predictions: predictionsFromRoutes(rawRoutes),
          availableBuses: scenario.availableVehicles,
          busCapacity: scenario.vehicleCapacity,
          minBusesPerRoute: scenario.minVehiclesPerRoute,
          maxBusesPerRoute: scenario.maxVehiclesPerRoute,
        },
      },
      {
        onSuccess: (data) => {
          setResult(data);
        },
      }
    );
  }, [feasibility.isFeasible, solveMutation, transportMode, rawRoutes, scenario]);

  // Synthesize Authoritative Before/After Rows
  const rows = useMemo(() => {
    return buildBeforeAfterRows(rawRoutes, scenario.vehicleCapacity, result);
  }, [rawRoutes, scenario.vehicleCapacity, result]);

  if (dashboardQuery.isLoading && !dashboardQuery.data) {
    return <OptimizationLoading />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Command Header */}
      <OptimizationHeader transportMode={transportMode} />

      {/* Dashboard Error Alert if backend unreachable */}
      {dashboardQuery.isError && (
        <OptimizationError
          errorTitle="Telemetry Connection Warning"
          errorMessage="Could not refresh live dashboard observations. The workbench is operating on canonical demonstration datasets."
          onRetry={() => dashboardQuery.refetch()}
        />
      )}

      {/* 2. Demand / Resource Context Hero */}
      <OptimizationContextHero
        transportMode={transportMode}
        availableFleet={scenario.availableVehicles}
        vehicleCapacity={scenario.vehicleCapacity}
        rows={rows}
        isSolved={result !== null}
      />

      {/* 3. Constraint Workbench (Inputs, Presets, Feasibility Gate, Run CTA) */}
      <OptimizationWorkbench
        transportMode={transportMode}
        scenario={scenario}
        onChangeScenario={handleScenarioChange}
        onResetDefaults={handleResetDefaults}
        feasibility={feasibility}
        onRunOptimization={handleRunOptimization}
        isPending={solveMutation.isPending}
        routeCount={rawRoutes.length}
      />

      {/* Mutation Error Alert */}
      {solveMutation.isError && (
        <OptimizationError
          errorTitle="Optimization Solver Error"
          errorMessage="The allocation solver rejected the scenario or encountered an unexpected computation failure. Verify your bounds and retry."
          onRetry={handleRunOptimization}
        />
      )}

      {/* 4. Dual-View Visualizer Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 4A. Lightweight 2.5D Isometric Spatial Allocation View */}
        <OptimizationSpatialNetwork
          transportMode={transportMode}
          rows={rows}
          isSolved={result !== null}
        />

        {/* 4B. Capacity vs Demand Headroom / Deficit Visualizer */}
        <OptimizationCapacityVisual
          transportMode={transportMode}
          rows={rows}
          isSolved={result !== null}
        />
      </div>

      {/* 5. Authoritative Before → After Allocation Matrix */}
      <OptimizationMatrix
        transportMode={transportMode}
        rows={rows}
        isSolved={result !== null}
      />

      {/* 6. Impact Summary Telemetry */}
      <OptimizationImpactSummary
        transportMode={transportMode}
        rows={rows}
        result={result}
        availableFleet={scenario.availableVehicles}
      />

      {/* 7. Mathematical & Greedy Heuristic Explainer */}
      <OptimizationExplainer
        transportMode={transportMode}
        formulationText={result?.formulation}
        isSolved={result !== null}
        availableFleet={scenario.availableVehicles}
        minVehicles={scenario.minVehiclesPerRoute}
        maxVehicles={scenario.maxVehiclesPerRoute}
        routeCount={rawRoutes.length}
      />

      {/* 8. Workflow Progression to Simulator (8I) */}
      <OptimizationProgression transportMode={transportMode} />
    </div>
  );
}
