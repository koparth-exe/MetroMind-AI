import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  usePredictDemand,
  useCompareModels,
  useGetRoutes,
  useGetDataSummary,
  getCompareModelsQueryKey,
  getGetRoutesQueryKey,
  getGetDataSummaryQueryKey,
} from '@workspace/api-client-react';
import type { RouteInsight } from '@workspace/api-client-react';
import { useTransportMode } from '@/components/metro-shell';

import { PredictionHeader } from './prediction-header';
import { PredictionControls } from './prediction-controls';
import { PredictionHero } from './prediction-hero';
import { PredictionUncertainty } from './prediction-uncertainty';
import { PredictionCorridorBreakdown } from './prediction-corridor-breakdown';
import { PredictionModelContext } from './prediction-model-context';
import { PredictionInterpretation } from './prediction-interpretation';
import { PredictionAttention } from './prediction-attention';
import { PredictionLoading } from './prediction-loading';
import { PredictionErrorState, PredictionEmptyState } from './prediction-error';

import type {
  PredictionScenarioState,
  CorridorSelection,
  CorridorDisplayData,
  PredictionResult,
  ModelMetric,
} from './types';

export function PredictionPage() {
  const { transportMode } = useTransportMode();
  const queryClient = useQueryClient();

  // Mode-aware queries
  const modelsQuery = useCompareModels(transportMode);
  const routesQuery = useGetRoutes(transportMode);
  const summaryQuery = useGetDataSummary(transportMode);

  const predict = usePredictDemand();

  // Authoritative dataset name matching active transport mode and Data Intake
  const isBus = transportMode === 'BUS';
  const datasetName = useMemo(() => {
    if (summaryQuery.data?.datasetName && !summaryQuery.data.isDemo && !summaryQuery.data.datasetName.includes('_DEMO')) {
      return summaryQuery.data.datasetName;
    }
    return isBus ? 'BEST_TRANSIT_2026' : 'MMR_TRANSIT_2026';
  }, [summaryQuery.data, isBus]);

  // Scenario workstation state
  const defaultScenario: PredictionScenarioState = useMemo(() => ({
    date: '2026-08-20',
    hour: 18,
    rainfall: 0,
    temperature: 20,
    demandMultiplier: 1.0,
    isHoliday: false,
    specialEvent: false,
    model: modelsQuery.data?.selectedModel || 'Gradient Boosting',
  }), [modelsQuery.data?.selectedModel]);

  const [scenarioState, setScenarioState] = useState<PredictionScenarioState>(defaultScenario);
  const [selectedCorridor, setSelectedCorridor] = useState<CorridorSelection>('ALL');
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [resultMode, setResultMode] = useState<typeof transportMode | null>(null);

  // Update model in scenario if compareModels loads a champion and model was empty
  useEffect(() => {
    if (modelsQuery.data?.selectedModel && (!scenarioState.model || scenarioState.model === 'Gradient Boosting')) {
      setScenarioState((prev) => ({
        ...prev,
        model: modelsQuery.data?.selectedModel || prev.model,
      }));
    }
  }, [modelsQuery.data?.selectedModel]);

  // Execute scenario prediction mutation
  const runForecast = useCallback((customState?: PredictionScenarioState) => {
    const s = customState || scenarioState;
    predict.mutate(
      {
        mode: transportMode,
        data: {
          date: s.date,
          hour: s.hour,
          rainfall: s.rainfall,
          temperature: s.temperature,
          demandMultiplier: s.demandMultiplier,
          isHoliday: s.isHoliday,
          specialEvent: s.specialEvent,
          model: s.model || undefined,
        },
      },
      {
        onSuccess: (data) => {
          setResult(data);
          setResultMode(transportMode);
        },
      }
    );
  }, [predict, scenarioState, transportMode]);

  // Mode synchronization: auto-run forecast on mount & whenever transportMode changes
  useEffect(() => {
    setSelectedCorridor('ALL');
    // Clear any stale result from previous mode
    setResult(null);
    setResultMode(null);

    const freshState: PredictionScenarioState = {
      date: '2026-08-20',
      hour: 18,
      rainfall: 0,
      temperature: 20,
      demandMultiplier: 1.0,
      isHoliday: false,
      specialEvent: false,
      model: modelsQuery.data?.selectedModel || 'Gradient Boosting',
    };
    setScenarioState(freshState);
    runForecast(freshState);
  }, [transportMode]);

  const handleScenarioChange = (updates: Partial<PredictionScenarioState>) => {
    setScenarioState((prev) => ({ ...prev, ...updates }));
  };

  const handleResetScenario = () => {
    const baselineState: PredictionScenarioState = {
      date: '2026-08-20',
      hour: 18,
      rainfall: 0,
      temperature: 20,
      demandMultiplier: 1.0,
      isHoliday: false,
      specialEvent: false,
      model: modelsQuery.data?.selectedModel || 'Gradient Boosting',
    };
    setScenarioState(baselineState);
    runForecast(baselineState);
  };

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getCompareModelsQueryKey(transportMode) }),
      queryClient.invalidateQueries({ queryKey: getGetRoutesQueryKey(transportMode) }),
      queryClient.invalidateQueries({ queryKey: getGetDataSummaryQueryKey(transportMode) }),
    ]);
    runForecast();
  };

  // Route metadata lookup mapping
  const routeMetaMap = useMemo(() => {
    const map = new Map<string, RouteInsight>();
    if (routesQuery.data) {
      for (const r of routesQuery.data) {
        map.set(r.routeId, r);
      }
    }
    return map;
  }, [routesQuery.data]);

  // If result is present and matches current mode, use it
  const activeResult = resultMode === transportMode ? result : null;

  // Available models list
  const availableModels: ModelMetric[] = useMemo(() => {
    if (modelsQuery.data?.metrics && modelsQuery.data.metrics.length > 0) {
      return modelsQuery.data.metrics;
    }
    // Fallback baseline metrics if modelsQuery still loading
    return [
      {
        model: 'Gradient Boosting',
        mae: isBus ? 0.7 : 62.5,
        rmse: isBus ? 1.0 : 95.8,
        r2: 1.0,
        isBest: true,
      },
      {
        model: 'Random Forest',
        mae: isBus ? 1.1 : 78.4,
        rmse: isBus ? 1.6 : 112.3,
        r2: 0.98,
        isBest: false,
      },
      {
        model: 'Linear Regression',
        mae: isBus ? 2.4 : 142.1,
        rmse: isBus ? 3.1 : 188.5,
        r2: 0.88,
        isBest: false,
      },
    ];
  }, [modelsQuery.data?.metrics, isBus]);

  // Derived corridor display data
  const corridors: CorridorDisplayData[] = useMemo(() => {
    if (!activeResult?.routes) {
      return [];
    }

    return activeResult.routes.map((r) => {
      const meta = routeMetaMap.get(r.routeId);
      return {
        routeId: r.routeId,
        name: meta?.name || r.routeId,
        color: meta?.color || 'hsl(var(--primary))',
        stations: meta?.stations || [],
        predictedDemand: r.predictedDemand,
        historicalAverage: r.historicalAverage,
        difference: r.difference,
        percentDifference: r.percentDifference,
        lowerBound: r.lowerBound,
        upperBound: r.upperBound,
        confidenceSpread: r.upperBound - r.lowerBound,
        capacity: meta?.capacity,
        utilization: meta?.capacity ? r.predictedDemand / meta.capacity : undefined,
      };
    });
  }, [activeResult, routeMetaMap]);

  // Network aggregate totals
  const totalPredictedDemand = useMemo(() => {
    return corridors.reduce((acc, c) => acc + c.predictedDemand, 0);
  }, [corridors]);

  const totalHistoricalAverage = useMemo(() => {
    return corridors.reduce((acc, c) => acc + c.historicalAverage, 0);
  }, [corridors]);

  const totalDifference = totalPredictedDemand - totalHistoricalAverage;
  const totalPercentDifference = totalHistoricalAverage > 0
    ? ((totalPredictedDemand / totalHistoricalAverage) - 1) * 100
    : 0;

  const totalLowerBound = useMemo(() => {
    return corridors.reduce((acc, c) => acc + c.lowerBound, 0);
  }, [corridors]);

  const totalUpperBound = useMemo(() => {
    return corridors.reduce((acc, c) => acc + c.upperBound, 0);
  }, [corridors]);

  // Focused corridor
  const focusedCorridorData = useMemo(() => {
    if (selectedCorridor === 'ALL') return null;
    return corridors.find((c) => c.routeId === selectedCorridor) || null;
  }, [corridors, selectedCorridor]);

  const activeModelName = activeResult?.model || scenarioState.model || 'Gradient Boosting';
  const activeModelMetrics = availableModels.find((m) => m.model === activeModelName) || availableModels[0];

  // Loading skeleton during initial fetch
  if (predict.isPending && !activeResult) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <PredictionLoading />
      </div>
    );
  }

  // Error state
  if (predict.isError && !activeResult) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <PredictionHeader
          transportMode={transportMode}
          datasetName={datasetName}
          activeModel={activeModelName}
          isPending={predict.isPending}
          isError={true}
          onRefresh={handleRefresh}
        />
        <PredictionErrorState
          transportMode={transportMode}
          errorMessage={predict.error instanceof Error ? predict.error.message : undefined}
          onRetry={() => runForecast()}
          isRetrying={predict.isPending}
        />
      </div>
    );
  }

  // Empty state if no routes available
  if (activeResult && corridors.length === 0) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <PredictionHeader
          transportMode={transportMode}
          datasetName={datasetName}
          activeModel={activeModelName}
          isPending={predict.isPending}
          isError={false}
          onRefresh={handleRefresh}
        />
        <PredictionEmptyState
          transportMode={transportMode}
          datasetName={datasetName}
          onRefresh={handleRefresh}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7 px-4 py-6 sm:px-6 lg:px-8 animate-page-enter">
      {/* 1. Forecast Command Header */}
      <PredictionHeader
        transportMode={transportMode}
        datasetName={datasetName}
        activeModel={activeModelName}
        isPending={predict.isPending}
        isError={false}
        onRefresh={handleRefresh}
      />

      {/* 2. Bento Grid: Scenario Controls (Workstation) + Primary Forecast Hero */}
      <div className="grid grid-cols-1 gap-7 xl:grid-cols-12 xl:items-start">
        {/* Scenario Controls (Left 5 Columns on XL) */}
        <div className="xl:col-span-5">
          <PredictionControls
            state={scenarioState}
            onChange={handleScenarioChange}
            onReset={handleResetScenario}
            onSubmit={() => runForecast()}
            isPending={predict.isPending}
            availableModels={availableModels}
            routes={routesQuery.data || []}
            selectedCorridor={selectedCorridor}
            onSelectCorridor={setSelectedCorridor}
          />
        </div>

        {/* Primary Forecast Hero (Right 7 Columns on XL) */}
        <div className="xl:col-span-7">
          <PredictionHero
            totalPredictedDemand={totalPredictedDemand}
            totalHistoricalAverage={totalHistoricalAverage}
            totalDifference={totalDifference}
            totalPercentDifference={totalPercentDifference}
            totalLowerBound={totalLowerBound}
            totalUpperBound={totalUpperBound}
            focusedCorridorData={focusedCorridorData}
            selectedCorridor={selectedCorridor}
            activeModelName={activeModelName}
            activeModelMetrics={activeModelMetrics}
            conditions={activeResult?.conditions || ''}
            transportMode={transportMode}
          />
        </div>
      </div>

      {/* 3. Forecast Band & Uncertainty (95% CI) */}
      <PredictionUncertainty
        predictedDemand={totalPredictedDemand}
        historicalAverage={totalHistoricalAverage}
        lowerBound={totalLowerBound}
        upperBound={totalUpperBound}
        focusedCorridorData={focusedCorridorData}
        selectedCorridor={selectedCorridor}
      />

      {/* 4. Multi-Corridor Breakdown Cards */}
      <PredictionCorridorBreakdown
        corridors={corridors}
        selectedCorridor={selectedCorridor}
        onSelectCorridor={setSelectedCorridor}
        transportMode={transportMode}
        scenarioHour={scenarioState.hour}
      />

      {/* 5. Forecasting Model Evidence & Calibration */}
      <PredictionModelContext
        activeModelName={activeModelName}
        models={availableModels}
        methodology={modelsQuery.data?.methodology}
        onSelectModel={(m) => {
          handleScenarioChange({ model: m });
          runForecast({ ...scenarioState, model: m });
        }}
      />

      {/* 6. Mathematical Demand Interpretation */}
      <PredictionInterpretation
        corridors={corridors}
        totalPredictedDemand={totalPredictedDemand}
        totalHistoricalAverage={totalHistoricalAverage}
        totalPercentDifference={totalPercentDifference}
        conditions={activeResult?.conditions || ''}
        transportMode={transportMode}
      />

      {/* 7. Operational Attention & Transition to Risk */}
      <PredictionAttention
        corridors={corridors}
        transportMode={transportMode}
      />
    </div>
  );
}
