import type {
  PredictionInput,
  PredictionResult,
  PredictionRoute,
  ModelMetric,
  ModelComparison,
  RouteInsight,
  DataSummary,
} from '@workspace/api-client-react';

export type {
  PredictionInput,
  PredictionResult,
  PredictionRoute,
  ModelMetric,
  ModelComparison,
  RouteInsight,
  DataSummary,
};

export interface PredictionScenarioState {
  date: string;
  hour: number;
  rainfall: number;
  temperature: number;
  demandMultiplier: number;
  isHoliday: boolean;
  specialEvent: boolean;
  model: string;
}

export type CorridorSelection = 'ALL' | string;

export interface CorridorDisplayData {
  routeId: string;
  name: string;
  color: string;
  stations: string[];
  predictedDemand: number;
  historicalAverage: number;
  difference: number;
  percentDifference: number;
  lowerBound: number;
  upperBound: number;
  confidenceSpread: number;
  capacity?: number;
  utilization?: number;
}
