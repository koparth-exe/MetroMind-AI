import type { TransportMode } from '@/lib/transport-mode';

export type UploadState = 'idle' | 'dragover' | 'uploading' | 'validating' | 'success' | 'error';

export interface SchemaFieldDefinition {
  field: string;
  type: string;
  required: boolean;
  category: 'core' | 'exogenous';
  example: string;
  description: string;
  analyticalRole: string;
}

export interface IngestedFileRecord {
  name: string;
  size: number;
  lastModified: number;
  rowCount?: number;
}

export interface PipelineVitalStats {
  datasetName: string;
  transportMode: TransportMode;
  isDemo: boolean;
  records: number;
  routes: number;
  stations: number;
  missingValues: number;
  invalidValues: number;
  dateStart: string;
  dateEnd: string;
  averageDemand: number;
  maxDemand: number;
  quality: string;
  columnsCount: number;
}
