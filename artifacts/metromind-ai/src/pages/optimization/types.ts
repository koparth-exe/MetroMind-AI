import type { TransportMode } from '@/lib/transport-mode';
import type { RouteInsight, OptimizationResult } from '@workspace/api-client-react';

export interface OptimizationScenarioState {
  availableVehicles: number;
  vehicleCapacity: number;
  minVehiclesPerRoute: number;
  maxVehiclesPerRoute: number;
}

export interface FeasibilityCheckResult {
  isFeasible: boolean;
  code?: 'FLEET_DEFICIT' | 'BOUNDS_INVERTED' | 'INVALID_CAPACITY' | 'INVALID_FLEET' | 'INVALID_MAX';
  title?: string;
  message?: string;
  remediationLabel?: string;
  remediationPatch?: Partial<OptimizationScenarioState>;
}

export interface BeforeAfterRouteComparison {
  routeId: string;
  name: string;
  color: string;
  stations: string[];
  coordinates: number[][];
  predictedDemand: number;
  historicalAverage: number;

  // BASELINE (Current State derived from Dashboard)
  baselineBuses: number;
  baselineCapacity: number;
  baselineUtilization: number;
  baselineOvercrowding: number;
  baselineUnusedCapacity: number;

  // RECOMMENDED (Post-Optimization from Solver)
  recommendedBuses: number;
  recommendedCapacity: number;
  recommendedUtilization: number;
  recommendedOvercrowding: number;
  recommendedUnusedCapacity: number;

  // OPERATIONAL DELTAS
  vehicleDelta: number; // recommended - baseline
  capacityDelta: number; // recommendedCapacity - baselineCapacity
  overcrowdingDelta: number; // recommendedOvercrowding - baselineOvercrowding
  isZeroVehicleRoute: boolean; // buses === 0
}

export interface NetworkOptimizationSummary {
  totalPredictedDemand: number;
  baselineTotalCapacity: number;
  recommendedTotalCapacity: number;
  baselineTotalVehicles: number;
  recommendedTotalVehicles: number;
  availableVehicles: number;
  baselineOvercrowding: number;
  recommendedOvercrowding: number;
  baselineUnusedCapacity: number;
  recommendedUnusedCapacity: number;
  baselineObjectiveValue: number;
  recommendedObjectiveValue: number;
  overcrowdingReductionPercent: number;
  capacityCoveragePercent: number;
  solverFormulation: string;
  isSolved: boolean;
}

/**
 * Validates constraints mathematically before invoking the optimization engine.
 * Specifically prevents the backend greedy over-allocation defect where
 * availableVehicles < routeCount * minVehiclesPerRoute.
 */
export function evaluateFeasibility(
  fleet: number,
  capacity: number,
  min: number,
  max: number,
  routeCount: number
): FeasibilityCheckResult {
  if (fleet < 1 || isNaN(fleet)) {
    return {
      isFeasible: false,
      code: 'INVALID_FLEET',
      title: 'Fleet Pool Invalid',
      message: 'Available vehicle fleet must be at least 1.',
      remediationLabel: 'Set Fleet to 4',
      remediationPatch: { availableVehicles: 4 },
    };
  }

  if (capacity < 1 || isNaN(capacity)) {
    return {
      isFeasible: false,
      code: 'INVALID_CAPACITY',
      title: 'Capacity Invalid',
      message: 'Vehicle capacity must be greater than zero.',
      remediationLabel: 'Set Nominal Capacity',
      remediationPatch: { vehicleCapacity: 70 },
    };
  }

  if (min > max) {
    return {
      isFeasible: false,
      code: 'BOUNDS_INVERTED',
      title: 'Constraint Bounds Inverted',
      message: `Minimum vehicles per route (${min}) cannot exceed maximum (${max}).`,
      remediationLabel: `Set Max to ${min}`,
      remediationPatch: { maxVehiclesPerRoute: min },
    };
  }

  const minRequired = routeCount * min;
  if (fleet < minRequired) {
    return {
      isFeasible: false,
      code: 'FLEET_DEFICIT',
      title: 'Scenario Infeasible · Fleet Deficit',
      message: `Minimum allocation requires ${minRequired} vehicles (${routeCount} corridors × ${min} min/route), but available fleet is set to ${fleet}. The optimizer cannot guarantee route coverage without exceeding fleet pool.`,
      remediationLabel: `Increase Fleet to ${minRequired}`,
      remediationPatch: { availableVehicles: minRequired },
    };
  }

  return { isFeasible: true };
}

/**
 * Mode-aware vocabulary and configuration constants.
 */
export function getModeNomenclature(mode: TransportMode) {
  const isBus = mode === 'BUS';
  return {
    isBus,
    vehicleSingular: isBus ? 'bus' : 'train set',
    vehiclePlural: isBus ? 'buses' : 'train sets',
    vehicleTitleCase: isBus ? 'Bus' : 'Train Set',
    vehiclePluralTitleCase: isBus ? 'Buses' : 'Train Sets',
    capacityUnit: isBus ? 'pax / bus' : 'pax / train',
    corridorNoun: isBus ? 'bus route' : 'rail line',
    networkTitle: isBus ? 'BEST Suburban Bus Network' : 'Mumbai Suburban Railway Grid',
    datasetName: isBus ? 'BEST_TRANSIT_2026' : 'MMR_TRANSIT_2026',
    defaultCapacity: isBus ? 70 : 3000,
    defaultFleet: 4,
    defaultMin: 1,
    defaultMax: 4,
  };
}

/**
 * Synthesizes authoritative Before (Baseline) and After (Optimized) comparison rows.
 */
export function buildBeforeAfterRows(
  dashboardRoutes: RouteInsight[],
  capacityNum: number,
  result: OptimizationResult | null
): BeforeAfterRouteComparison[] {
  const resultMap = new Map(result?.routes.map((r) => [r.routeId, r]) ?? []);

  return dashboardRoutes.map((route) => {
    const demand = route.predictedDemand;
    // Authoritative baseline allocation: use route.baselineBuses (which is 1)
    const baseVehicles = Math.max(1, route.baselineBuses ?? 1);
    const baseCapacity = baseVehicles * capacityNum;
    const baseUtilization = baseCapacity > 0 ? demand / baseCapacity : 0;
    const baseOvercrowd = Math.max(0, Math.round((demand - baseCapacity) * 10) / 10);
    const baseUnused = Math.max(0, Math.round((baseCapacity - demand) * 10) / 10);

    const opt = resultMap.get(route.routeId);
    // If solved, use solver result; otherwise pre-run recommended mirrors baseline
    const recVehicles = opt ? opt.buses : baseVehicles;
    const recCapacity = opt ? opt.capacity : baseCapacity;
    const isZeroVeh = recVehicles === 0;

    // Guard against zero-capacity denominator
    const recUtilization = recCapacity > 0 ? demand / recCapacity : 0;
    const recOvercrowd = opt ? opt.overcrowding : baseOvercrowd;
    const recUnused = opt ? opt.unusedCapacity : baseUnused;

    return {
      routeId: route.routeId,
      name: route.name,
      color: route.color,
      stations: route.stations,
      coordinates: route.coordinates,
      predictedDemand: demand,
      historicalAverage: route.historicalAverage,

      baselineBuses: baseVehicles,
      baselineCapacity: baseCapacity,
      baselineUtilization: Math.round(baseUtilization * 1000) / 1000,
      baselineOvercrowding: baseOvercrowd,
      baselineUnusedCapacity: baseUnused,

      recommendedBuses: recVehicles,
      recommendedCapacity: recCapacity,
      recommendedUtilization: Math.round(recUtilization * 1000) / 1000,
      recommendedOvercrowding: recOvercrowd,
      recommendedUnusedCapacity: recUnused,

      vehicleDelta: recVehicles - baseVehicles,
      capacityDelta: recCapacity - baseCapacity,
      overcrowdingDelta: Math.round((recOvercrowd - baseOvercrowd) * 10) / 10,
      isZeroVehicleRoute: isZeroVeh,
    };
  });
}
