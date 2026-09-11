import { useQueryClient } from '@tanstack/react-query';
import {
  useGetAnalysis,
  useCompareModels,
  useGetDataSummary,
  getGetAnalysisQueryKey,
  getCompareModelsQueryKey,
  getGetDataSummaryQueryKey,
} from '@workspace/api-client-react';
import { useTransportMode } from '@/components/metro-shell';

import { AnalysisHeader } from './analysis-header';
import { AnalysisPrimarySignal } from './analysis-primary-signal';
import { AnalysisCorrelationSection } from './analysis-correlation-section';
import { AnalysisRegressionSection } from './analysis-regression-section';
import { AnalysisPeriodicitySection } from './analysis-periodicity-section';
import { AnalysisModelEvidenceSection } from './analysis-model-evidence-section';
import { AnalysisInterpretationSection } from './analysis-interpretation-section';
import { AnalysisWorkflowProgression } from './analysis-workflow-progression';
import { AnalysisLoadingSkeleton } from './analysis-loading-skeleton';
import { AnalysisErrorState, AnalysisEmptyState } from './analysis-error-state';

export function AnalysisPage() {
  const { transportMode } = useTransportMode();
  const queryClient = useQueryClient();

  // Mode-aware analytical queries
  const analysisQuery = useGetAnalysis(transportMode);
  const modelsQuery = useCompareModels(transportMode);
  const summaryQuery = useGetDataSummary(transportMode);

  const isPending = analysisQuery.isLoading || modelsQuery.isLoading;
  const isFetching = analysisQuery.isFetching || modelsQuery.isFetching;

  // Invalidate and refetch all analytical endpoints for current mode
  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getGetAnalysisQueryKey(transportMode) }),
      queryClient.invalidateQueries({ queryKey: getCompareModelsQueryKey(transportMode) }),
      queryClient.invalidateQueries({ queryKey: getGetDataSummaryQueryKey(transportMode) }),
    ]);
  };

  // Canonical dataset name derived from authoritative data intake summary
  const isBus = transportMode === 'BUS';
  const defaultDataset = isBus ? 'BEST_TRANSIT_2026' : 'MMR_TRANSIT_2026';
  const datasetName = summaryQuery.data?.datasetName || defaultDataset;

  // Handle Loading Skeleton
  if (isPending && !analysisQuery.data) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <AnalysisLoadingSkeleton />
      </div>
    );
  }

  // Handle Error State
  if (analysisQuery.isError || !analysisQuery.data) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <AnalysisHeader
          transportMode={transportMode}
          datasetName={datasetName}
          isPending={isFetching}
          isError={true}
          onRefresh={handleRefresh}
        />
        <AnalysisErrorState
          transportMode={transportMode}
          errorMessage={analysisQuery.error instanceof Error ? analysisQuery.error.message : undefined}
          onRetry={handleRefresh}
          isRetrying={isFetching}
        />
      </div>
    );
  }

  const analysis = analysisQuery.data;

  // Handle Empty / Insufficient Data State
  if (!analysis.correlations || analysis.correlations.length === 0) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <AnalysisHeader
          transportMode={transportMode}
          datasetName={datasetName}
          isPending={isFetching}
          isError={false}
          onRefresh={handleRefresh}
        />
        <AnalysisEmptyState
          transportMode={transportMode}
          datasetName={datasetName}
          onRefresh={handleRefresh}
        />
      </div>
    );
  }

  // Linear regression metrics if returned from compareModels
  const linearMetrics = modelsQuery.data?.metrics.find((m) => m.model === 'Linear Regression');

  return (
    <div className="mx-auto max-w-7xl space-y-7 px-4 py-6 sm:px-6 lg:px-8">
      {/* 1. Header & Live Context Telemetry */}
      <AnalysisHeader
        transportMode={transportMode}
        datasetName={datasetName}
        isPending={isFetching}
        isError={false}
        onRefresh={handleRefresh}
      />

      {/* 2. Primary Analytical Signal (Hero Block) */}
      <section id="analysis-primary-signal" aria-label="Primary Analytical Signal">
        <AnalysisPrimarySignal
          analysis={analysis}
          modelsSummary={modelsQuery.data}
          transportMode={transportMode}
        />
      </section>

      {/* 3. Relationships & Regression Workspace (Bento 2-Column Grid) */}
      <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
        {/* Correlation Intelligence */}
        <section id="analysis-correlation" aria-label="Correlation Analysis">
          <AnalysisCorrelationSection correlations={analysis.correlations} />
        </section>

        {/* Regression Evidence */}
        <section id="analysis-regression" aria-label="Regression Workspace">
          <AnalysisRegressionSection
            regression={analysis.regression}
            formulae={analysis.formulae}
            linearMetrics={linearMetrics}
            transportMode={transportMode}
          />
        </section>
      </div>

      {/* 4. Temporal / Fourier Intelligence (Harmonics & Periodicity) */}
      <section id="analysis-periodicity" aria-label="Temporal Periodicity">
        <AnalysisPeriodicitySection fourier={analysis.fourier} />
      </section>

      {/* 5. Model Evidence (Cross-Model Evaluation) */}
      <section id="analysis-model-evidence" aria-label="Model Evidence">
        <AnalysisModelEvidenceSection
          modelsSummary={modelsQuery.data}
          transportMode={transportMode}
        />
      </section>

      {/* 6. What This Means (Derived Mathematical Interpretation) */}
      <section id="analysis-interpretation" aria-label="Analytical Interpretation">
        <AnalysisInterpretationSection
          analysis={analysis}
          modelsSummary={modelsQuery.data}
          transportMode={transportMode}
        />
      </section>

      {/* 7. Analytical Workflow Progression (Call to Action -> Prediction) */}
      <section id="analysis-progression" aria-label="Workflow Progression">
        <AnalysisWorkflowProgression />
      </section>
    </div>
  );
}
