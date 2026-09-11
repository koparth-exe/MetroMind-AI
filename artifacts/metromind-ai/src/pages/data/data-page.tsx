import { useState, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetDataSummary,
  useLoadDemoDataset,
  useUploadDataset,
  getGetDataSummaryQueryKey,
} from '@workspace/api-client-react';
import type { DataSummary } from '@workspace/api-client-react';
import { useTransportMode, QueryState } from '@/components/metro-shell';
import type { TransportMode } from '@/lib/transport-mode';

import { DataHeader } from './data-header';
import { DataActiveCard } from './data-active-card';
import { DataUploadWorkspace } from './data-upload-workspace';
import { DataQualityGate } from './data-quality-gate';
import { DataSchemaInspection } from './data-schema-inspection';
import { DataDemoDatasets } from './data-demo-datasets';
import { DataNextSteps } from './data-next-steps';

export function DataPage() {
  const { transportMode, setTransportMode } = useTransportMode();
  const queryClient = useQueryClient();

  const summaryQuery = useGetDataSummary(transportMode);
  const loadDemo = useLoadDemoDataset();
  const upload = useUploadDataset();

  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadErrorMsg, setUploadErrorMsg] = useState<string>('');
  const [isSuccessToast, setIsSuccessToast] = useState<boolean>(false);

  // Authoritative active dataset summary directly from mode-aware query
  const summary: DataSummary | undefined = summaryQuery.data;

  const isBus = transportMode === 'BUS';

  // Reset upload transient state and mutations when transport mode changes
  useEffect(() => {
    setUploadedFileName('');
    setUploadErrorMsg('');
    setIsSuccessToast(false);
    upload.reset();
    loadDemo.reset();
  }, [transportMode]);

  // Resolve canonical dataset name matching active transport mode
  const resolvedDatasetName = useMemo(() => {
    if (summary?.datasetName && !summary.isDemo && !summary.datasetName.includes('_DEMO')) {
      return summary.datasetName;
    }
    return isBus ? 'BEST_TRANSIT_2026' : 'MMR_TRANSIT_2026';
  }, [summary, isBus]);

  // File upload mutation handler
  const handleFileUpload = (file: File) => {
    setUploadedFileName(file.name);
    setUploadErrorMsg('');
    setIsSuccessToast(false);

    const reader = new FileReader();
    reader.onload = () => {
      upload.mutate(
        {
          mode: transportMode,
          data: { data: String(reader.result ?? '') },
        },
        {
          onSuccess: (data: DataSummary) => {
            setIsSuccessToast(true);
            queryClient.setQueryData(getGetDataSummaryQueryKey(transportMode), data);
            queryClient.invalidateQueries({ queryKey: getGetDataSummaryQueryKey(transportMode) });
            queryClient.invalidateQueries({ queryKey: [`/api/data/dashboard/${transportMode}`] });
            queryClient.invalidateQueries({ queryKey: [`/api/math/analysis/${transportMode}`] });
          },
          onError: (err: any) => {
            const msg =
              err?.response?.data?.detail ??
              err?.data?.detail ??
              err?.message ??
              'CSV validation failed: required columns missing or row format invalid.';
            setUploadErrorMsg(msg);
          },
        }
      );
    };
    reader.readAsText(file);
  };

  // Reset to canonical demonstration baseline & synchronize global transport mode
  const handleLoadDemo = (targetMode: TransportMode = transportMode) => {
    setUploadErrorMsg('');
    setIsSuccessToast(false);

    if (targetMode !== transportMode) {
      setTransportMode(targetMode);
    }

    loadDemo.mutate(
      { mode: targetMode },
      {
        onSuccess: (data: DataSummary) => {
          queryClient.setQueryData(getGetDataSummaryQueryKey(targetMode), data);
          queryClient.invalidateQueries({ queryKey: getGetDataSummaryQueryKey(targetMode) });
          queryClient.invalidateQueries({ queryKey: [`/api/data/dashboard/${targetMode}`] });
          queryClient.invalidateQueries({ queryKey: [`/api/math/analysis/${targetMode}`] });
        },
        onError: (err: any) => {
          const msg =
            err?.response?.data?.detail ??
            err?.data?.detail ??
            err?.message ??
            'Failed to reset to demonstration baseline.';
          setUploadErrorMsg(msg);
        },
      }
    );
  };

  const handleRefresh = () => {
    summaryQuery.refetch();
  };

  const isPending = upload.isPending || loadDemo.isPending;
  const isError = upload.isError || summaryQuery.isError;

  return (
    <div className="space-y-6 lg:space-y-7 animate-page-enter">
      {/* 1. Command Header */}
      <DataHeader
        transportMode={transportMode}
        datasetName={resolvedDatasetName}
        isDemo={summary?.isDemo ?? true}
        isPending={isPending}
        isError={isError}
        onLoadDemo={() => handleLoadDemo(transportMode)}
        onRefresh={handleRefresh}
        recordsCount={summary?.records ?? 0}
      />

      {/* Query error alert if any */}
      {summaryQuery.isError && (
        <div className="mb-4">
          <QueryState loading={false} error={true} retry={handleRefresh} />
        </div>
      )}

      {/* 2. Active Dataset Status Banner */}
      <DataActiveCard
        summary={summary}
        transportMode={transportMode}
        resolvedDatasetName={resolvedDatasetName}
        isLoading={summaryQuery.isLoading || isPending}
      />

      {/* 3. Primary Ingestion & Quality Gate Grid */}
      <div className="grid gap-5 xl:grid-cols-[1.1fr_1.35fr]">
        <DataUploadWorkspace
          transportMode={transportMode}
          onFileUpload={handleFileUpload}
          isPending={upload.isPending}
          isSuccess={isSuccessToast || upload.isSuccess}
          isError={upload.isError}
          errorMessage={uploadErrorMsg}
          uploadedFileName={uploadedFileName}
          onResetDemo={() => handleLoadDemo(transportMode)}
          onClearState={() => {
            setIsSuccessToast(false);
            setUploadErrorMsg('');
          }}
        />

        <DataQualityGate
          summary={summary}
          transportMode={transportMode}
          isLoading={summaryQuery.isLoading || isPending}
        />
      </div>

      {/* 4. Schema & Field Contract Inspection */}
      <DataSchemaInspection />

      {/* 5. Demonstration Datasets & Offline Evaluation */}
      <DataDemoDatasets
        transportMode={transportMode}
        onActivateDemo={(mode) => handleLoadDemo(mode)}
        isPending={loadDemo.isPending}
      />

      {/* 6. Downstream Pipeline Workflow Dispatch */}
      <DataNextSteps />
    </div>
  );
}
