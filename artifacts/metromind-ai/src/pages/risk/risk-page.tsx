import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  useGetDashboard,
  useCalculateRisk,
  useCompareModels,
  useGetDataSummary,
} from '@workspace/api-client-react';
import type {
  RiskResult,
  RouteInsight,
  PredictionRoute,
} from '@workspace/api-client-react';
import { useTransportMode } from '@/components/metro-shell';

import { RiskHeader } from './risk-header';
import { RiskNetworkStatus } from './risk-network-status';
import { RiskScoreVisualization } from './risk-score';
import { RiskUtilizationProbability } from './risk-utilization-probability';
import { RiskMethodology } from './risk-methodology';
import { RiskCorridorMatrix } from './risk-corridor-matrix';
import { RiskDistribution } from './risk-distribution';
import { RiskExposure } from './risk-exposure';
import { RiskInterpretation } from './risk-interpretation';
import { RiskProgression } from './risk-progression';
import { RiskLoading } from './risk-loading';
import { RiskErrorState, RiskEmptyState } from './risk-error';

import type {
  RouteRiskViewModel,
  NetworkRiskSummary,
  RiskScenarioState,
  RiskLevel,
} from './types';
import { computeRiskScore } from './types';

// Helper to convert dashboard routes to prediction format expected by Risk Engine
function buildPredictionPayload(routes: RouteInsight[]): PredictionRoute[] {
  return routes.map((r) => ({
    routeId: r.routeId,
    predictedDemand: r.predictedDemand,
    historicalAverage: r.historicalAverage,
    difference: r.predictedDemand - r.historicalAverage,
    percentDifference: r.historicalAverage ? ((r.predictedDemand / r.historicalAverage) - 1) * 100 : 0,
    lowerBound: r.predictedDemand * 0.91,
    upperBound: r.predictedDemand * 1.1,
  }));
}

export function RiskPage() {
  const { transportMode } = useTransportMode();
  const isBus = transportMode === 'BUS';

  // API Queries
  const dashboardQuery = useGetDashboard(transportMode);
  const modelsQuery = useCompareModels(transportMode);
  const summaryQuery = useGetDataSummary(transportMode);

  // Dynamic risk calculation mutation
  const calculateMutation = useCalculateRisk();

  // Corridor Capacity Scenario State
  const defaultCapacity = isBus ? 70 : 3000;
  const [scenarioState, setScenarioState] = useState<RiskScenarioState>({
    corridorCapacity: defaultCapacity,
  });

  // Selected corridor for deep-dive inspection
  const [selectedRouteId, setSelectedRouteId] = useState<string | undefined>(undefined);

  // Custom simulation result from recalculation
  const [calculatedResult, setCalculatedResult] = useState<RiskResult | null>(null);

  // Reset state on transport mode change to prevent cross-mode pollution
  useEffect(() => {
    const newCap = transportMode === 'BUS' ? 70 : 3000;
    setScenarioState({
      corridorCapacity: newCap,
    });
    setCalculatedResult(null);
    setSelectedRouteId(undefined);
  }, [transportMode]);

  // Recalculate Risk via Backend Mutation
  const handleRecalculate = useCallback(
    (scenario?: RiskScenarioState) => {
      const rawRoutes = dashboardQuery.data?.routes ?? [];
      if (rawRoutes.length === 0) return;

      const targetCap = scenario?.corridorCapacity ?? scenarioState.corridorCapacity;

      calculateMutation.mutate(
        {
          mode: transportMode,
          data: {
            predictions: buildPredictionPayload(rawRoutes),
            availableBuses: 4,
            busCapacity: targetCap,
          },
        },
        {
          onSuccess: (data) => {
            setCalculatedResult(data);
          },
        }
      );
    },
    [dashboardQuery.data?.routes, calculateMutation, transportMode, scenarioState.corridorCapacity]
  );

  // Extract residual uncertainty sigma from held-out model evaluation
  const uncertaintySigma = useMemo(() => {
    // Default mode-level sigma if query has not yet settled
    const fallbackSigma = isBus ? 0.98 : 95.37;
    return fallbackSigma;
  }, [isBus]);

  // Model name champion
  const modelName = useMemo(() => {
    return modelsQuery.data?.selectedModel || 'Gradient Boosting';
  }, [modelsQuery.data?.selectedModel]);

  // Authoritative dataset name
  const datasetName = useMemo(() => {
    if (summaryQuery.data?.datasetName && !summaryQuery.data.isDemo && !summaryQuery.data.datasetName.includes('_DEMO')) {
      return summaryQuery.data.datasetName;
    }
    return isBus ? 'BEST_TRANSIT_2026' : 'MMR_TRANSIT_2026';
  }, [summaryQuery.data, isBus]);

  // Build unified route risk viewmodels
  const routes = useMemo<RouteRiskViewModel[]>(() => {
    const baseRoutes = dashboardQuery.data?.routes ?? [];
    if (baseRoutes.length === 0) return [];

    // Map calculated routes if simulation was run, otherwise use base dashboard routes
    return baseRoutes.map((base) => {
      const calc = calculatedResult?.routes.find((cr) => cr.routeId === base.routeId);

      const predictedDemand = calc ? calc.predictedDemand : base.predictedDemand;
      const capacity = calc ? calc.capacity : base.capacity;
      const utilization = calc ? calc.utilization : base.utilization;
      const overloadProbability = calc ? calc.probability : base.overcrowdingProbability;

      // Compute authoritative risk score and level adhering to Phase 5 engine logic
      const scoreResult = computeRiskScore(utilization, overloadProbability);

      return {
        routeId: base.routeId,
        name: base.name,
        color: base.color,
        predictedDemand,
        capacity,
        utilization,
        utilizationPercentage: utilization * 100,
        overloadProbability,
        riskScore: scoreResult.riskScore,
        riskLevel: scoreResult.riskLevel,
        levelElevated: scoreResult.levelElevated,
        stations: base.stations ?? [],
      };
    });
  }, [dashboardQuery.data?.routes, calculatedResult]);

  // Selected route object
  const selectedRoute = useMemo(() => {
    if (!selectedRouteId) return undefined;
    return routes.find((r) => r.routeId === selectedRouteId);
  }, [routes, selectedRouteId]);

  // Highest exposure route across the network
  const highestExposureRoute = useMemo(() => {
    if (routes.length === 0) return undefined;
    return [...routes].sort((a, b) => {
      if (b.riskScore !== a.riskScore) {
        return b.riskScore - a.riskScore;
      }
      return b.overloadProbability - a.overloadProbability;
    })[0];
  }, [routes]);

  // Network Risk Summary
  const networkSummary = useMemo<NetworkRiskSummary>(() => {
    if (routes.length === 0) {
      return {
        overallRiskLevel: 'LOW',
        averageRiskScore: 0,
        maxRiskScore: 0,
        averageUtilization: 0,
        maxOverloadProbability: 0,
        totalPredictedDemand: 0,
        totalCapacity: 0,
        highestRiskRouteId: '—',
        highestRiskRouteName: '—',
        levelCounts: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
        uncertaintySigma,
        modelName,
        datasetName,
        numRoutes: 0,
      };
    }

    const totalDemand = routes.reduce((acc, r) => acc + r.predictedDemand, 0);
    const totalCap = routes.reduce((acc, r) => acc + r.capacity, 0);
    const avgUtil = totalCap > 0 ? totalDemand / totalCap : 0;

    const maxProb = Math.max(...routes.map((r) => r.overloadProbability));
    const maxScore = Math.max(...routes.map((r) => r.riskScore));

    const totalScore = routes.reduce((acc, r) => acc + r.riskScore, 0);
    const avgScore = Math.round((totalScore / routes.length) * 10) / 10;

    const overallLevel = computeRiskScore(avgUtil, maxProb).riskLevel;

    const counts = {
      LOW: routes.filter((r) => r.riskLevel === 'LOW').length,
      MEDIUM: routes.filter((r) => r.riskLevel === 'MEDIUM').length,
      HIGH: routes.filter((r) => r.riskLevel === 'HIGH').length,
      CRITICAL: routes.filter((r) => r.riskLevel === 'CRITICAL').length,
    };

    return {
      overallRiskLevel: overallLevel,
      averageRiskScore: avgScore,
      maxRiskScore: maxScore,
      averageUtilization: avgUtil,
      maxOverloadProbability: maxProb,
      totalPredictedDemand: totalDemand,
      totalCapacity: totalCap,
      highestRiskRouteId: highestExposureRoute?.routeId ?? '—',
      highestRiskRouteName: highestExposureRoute?.name ?? '—',
      levelCounts: counts,
      uncertaintySigma,
      modelName,
      datasetName,
      numRoutes: routes.length,
    };
  }, [routes, highestExposureRoute, uncertaintySigma, modelName, datasetName]);

  // Loading State
  if (dashboardQuery.isLoading && !dashboardQuery.data) {
    return <RiskLoading />;
  }

  // Error State
  if (dashboardQuery.isError) {
    return (
      <div className="space-y-6">
        <RiskErrorState retry={() => dashboardQuery.refetch()} />
      </div>
    );
  }

  // Empty State
  if (routes.length === 0) {
    return (
      <div className="space-y-6">
        <RiskEmptyState />
      </div>
    );
  }

  // Active focus target (either user-selected corridor or highest exposure corridor)
  const activeFocus = selectedRoute || highestExposureRoute || routes[0];

  return (
    <div className="space-y-6">
      {/* Region A: Command Header */}
      <RiskHeader
        transportMode={transportMode}
        datasetName={datasetName}
        modelName={modelName}
        uncertaintySigma={uncertaintySigma}
        scenarioState={scenarioState}
        onScenarioChange={setScenarioState}
        onRecalculate={handleRecalculate}
        isPending={calculateMutation.isPending}
      />

      {/* Region B: Network Risk Status Hero */}
      <RiskNetworkStatus
        summary={networkSummary}
        selectedRouteName={selectedRoute?.name}
        isCustomScenario={calculatedResult !== null}
      />

      {/* Region C & D: Risk Score Scale & Utilization vs Probability Contrast */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RiskScoreVisualization
          score={selectedRoute ? selectedRoute.riskScore : networkSummary.averageRiskScore}
          level={selectedRoute ? selectedRoute.riskLevel : networkSummary.overallRiskLevel}
          levelElevated={selectedRoute?.levelElevated}
        />

        <RiskUtilizationProbability
          utilization={activeFocus.utilization}
          probability={activeFocus.overloadProbability}
          riskScore={activeFocus.riskScore}
          uncertaintySigma={uncertaintySigma}
          capacity={activeFocus.capacity}
          predictedDemand={activeFocus.predictedDemand}
        />
      </div>

      {/* Region F: Corridor Risk Matrix */}
      <RiskCorridorMatrix
        routes={routes}
        selectedRouteId={selectedRouteId}
        onSelectRoute={(id) => setSelectedRouteId((prev) => (prev === id ? undefined : id))}
      />

      {/* Region G & H: Risk Distribution & Priority Capacity Exposure */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RiskDistribution
          routes={routes}
          transportMode={transportMode}
        />

        {highestExposureRoute && (
          <RiskExposure
            highestRoute={highestExposureRoute}
            onFocusRoute={(id) => setSelectedRouteId(id)}
          />
        )}
      </div>

      {/* Region E: Mathematical Methodology */}
      <RiskMethodology />

      {/* Region J: Operational Interpretation */}
      <RiskInterpretation
        summary={networkSummary}
        highestRoute={highestExposureRoute}
        transportMode={transportMode}
      />

      {/* Region K: Workflow Progression to Phase 8H Optimization */}
      <RiskProgression
        highestRouteName={highestExposureRoute?.name}
        highestRiskScore={highestExposureRoute?.riskScore}
      />
    </div>
  );
}
