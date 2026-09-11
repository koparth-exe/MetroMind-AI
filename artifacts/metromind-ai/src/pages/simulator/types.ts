/**
 * Domain & UI Types for MetroMind AI Simulator Workbench (Phase 8I.2)
 *
 * Strict mathematical truth:
 * - Active physical parameters: rainfall, temperature, demandMultiplier, unavailableRoute
 * - Presets encapsulate meaningful operational stress archetypes
 * - Zero fabricated data: all comparisons derived strictly from live dashboard + simulation API
 */

import type { RouteInsight, SimulationResult } from '@workspace/api-client-react';

export type TransportMode = 'RAILWAY' | 'BUS';

export interface ScenarioFormState {
  rainfall: number;
  temperature: number;
  demandMultiplier: number;
  unavailableRoute: string; // '' means none
  specialEvent: boolean;
}

export interface ScenarioPreset {
  id: string;
  name: string;
  shortDesc: string;
  rainfall: number;
  temperature: number;
  demandMultiplier: number;
  specialEvent: boolean;
  requiresRouteSuspension?: boolean; // if true, picks the primary trunk route (R1/B1)
}

export interface SimulatorRouteComparison {
  routeId: string;
  name: string;
  color: string;
  stations: string[];
  coordinates: number[][];
  baselineDemand: number;
  simulatedDemand: number;
  demandDelta: number;
  demandDeltaPct: number;
  baselineCapacity: number;
  capacity: number;
  baselineUtilization: number;
  simulatedUtilization: number | null; // null if capacity === 0
  overloadProbability: number;
  riskBand: string;
  isSuspended: boolean;
}

export interface SimulatorNetworkComparison {
  mode: TransportMode;
  datasetName: string;
  baselineDemand: number;
  simulatedDemand: number;
  demandDelta: number;
  demandDeltaPct: number;
  baselineCapacity: number;
  simulatedCapacity: number;
  capacityDelta: number;
  baselineUnserved: number;
  simulatedUnserved: number;
  unservedDelta: number;
  baselineRisk: number;
  simulatedRisk: number;
  riskDelta: number;
  activeCorridorsCount: number;
  suspendedCorridorsCount: number;
  routes: SimulatorRouteComparison[];
  label: string;
}

export type RouteSortField = 'volumeShift' | 'demand' | 'utilization' | 'probability';
