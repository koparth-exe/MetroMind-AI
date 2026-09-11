import type { Dashboard, RouteInsight, DataSummary } from '@workspace/api-client-react';

export interface OverviewTelemetry {
  records: number;
  stations: number;
  routesCount: number;
  totalPredictedDemand: number;
  peakDemand: number;
  peakHour: string;
  morningPeakHour?: string | null;
  eveningPeakHour: string | null;
  eveningPeakDeltaPct: string | null;
  averageUtilization: number;
  averageRisk?: number;
  highRiskCount: number;
  availableFleet: number;
  recommendedAdditionalFleet: number;
  fleetUnitLabel: string;
  datasetName: string;
}

export interface OverviewScrubPoint {
  hour: string;
  demand: number;
  baseline: number;
  variancePct: number;
}
