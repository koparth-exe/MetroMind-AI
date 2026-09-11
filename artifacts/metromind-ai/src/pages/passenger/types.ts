import type { RouteInsight } from '@workspace/api-client-react';

export interface BusiestRouteInfo {
  routeId: string;
  name: string;
  color: string;
  demand: number;
  utilization: number;
  crowdingLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
}

export interface InterchangeHubInfo {
  name: string;
  corridorCount: number;
  corridorNames: string[];
}

export interface PassengerTelemetry {
  totalDemand: number;
  peakDemand: number;
  peakHour: string;
  morningPeakDemand: number;
  morningPeakHour: string;
  eveningPeakDemand: number;
  eveningPeakHour: string;
  averageUtilization: number;
  busiestRoute: BusiestRouteInfo;
  keyInterchangeHub: InterchangeHubInfo;
  datasetName: string;
  recordsCount: number;
  stationsCount: number;
  corridorsCount: number;
  fleetUnitLabel: string;
  vehicleCapacity: number;
}

export interface PassengerScrubPoint {
  hour: string;
  demand: number;
  baseline: number;
  variancePct: number;
  flowBand: string;
}

export interface CorridorPassengerProfile {
  routeId: string;
  name: string;
  color: string;
  predictedDemand: number;
  historicalAverage: number;
  capacity: number;
  headroom: number; // capacity - predictedDemand
  utilization: number;
  crowdingLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  overcrowdingProbability: number;
  stations: string[];
  recommendedBuses: number;
  baselineBuses: number;
  vehicleBuffer: number;
}
