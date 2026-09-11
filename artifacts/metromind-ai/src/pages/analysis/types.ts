import type { Analysis, ModelComparison, DataSummary } from '@workspace/api-client-react';
import type { TransportMode } from '@/lib/transport-mode';

export interface AnalysisPageProps {
  transportMode: TransportMode;
}

export interface StatisticalHeadlineSignal {
  topFeature: string;
  topPearson: number;
  topSpearman: number;
  topStrength: string;
  topInterpretation: string;
  dominantPeriod: number;
  peakStrength: number;
  r2: number;
  bestModelName: string;
  bestModelRmse: number;
}
