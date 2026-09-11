/**
 * Phase 8G — Risk Engine ViewModels & Mathematical Definitions
 * Authoritative source: backend/app/mathematics/risk/
 */

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RouteRiskViewModel {
  routeId: string;
  name: string;
  color: string;
  predictedDemand: number;
  capacity: number;
  utilization: number; // ratio, e.g. 0.81
  utilizationPercentage: number; // 0..100+
  overloadProbability: number; // 0..1
  riskScore: number; // 0..100 composite
  riskLevel: RiskLevel;
  levelElevated: boolean; // true if elevated to HIGH by P(overload) >= 0.50
  stations: string[];
}

export interface NetworkRiskSummary {
  overallRiskLevel: RiskLevel;
  averageRiskScore: number;
  maxRiskScore: number;
  averageUtilization: number;
  maxOverloadProbability: number;
  totalPredictedDemand: number;
  totalCapacity: number;
  highestRiskRouteId: string;
  highestRiskRouteName: string;
  levelCounts: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
  uncertaintySigma: number;
  modelName: string;
  datasetName: string;
  numRoutes: number;
}

export interface RiskScenarioState {
  corridorCapacity: number;
}

/**
 * Deterministic calculation of composite risk score and classification.
 * Matches backend app/mathematics/risk/scoring.py exactly:
 * - utilization_score = min(utilization_ratio * 100, 100)
 * - probability_score = overload_probability * 100
 * - risk_score = 0.60 * utilization_score + 0.40 * probability_score
 * - Thresholds: LOW [0, 25), MEDIUM [25, 50), HIGH [50, 75), CRITICAL [75, 100]
 * - Elevation rule: if overload_probability >= 0.50, elevate LOW/MEDIUM to HIGH.
 */
export function computeRiskScore(
  utilizationRatio: number,
  overloadProbability: number
): {
  utilizationScore: number;
  probabilityScore: number;
  riskScore: number;
  riskLevel: RiskLevel;
  levelElevated: boolean;
} {
  const prob = Math.max(0, Math.min(1, overloadProbability));
  const util = Math.max(0, utilizationRatio);

  const utilizationScore = Math.min(util * 100, 100);
  const probabilityScore = prob * 100;

  const rawScore = 0.6 * utilizationScore + 0.4 * probabilityScore;
  const riskScore = Math.round(Math.max(0, Math.min(100, rawScore)) * 10) / 10;

  let baseLevel: RiskLevel = 'LOW';
  if (riskScore < 25) {
    baseLevel = 'LOW';
  } else if (riskScore < 50) {
    baseLevel = 'MEDIUM';
  } else if (riskScore < 75) {
    baseLevel = 'HIGH';
  } else {
    baseLevel = 'CRITICAL';
  }

  let levelElevated = false;
  let finalLevel = baseLevel;

  if (prob >= 0.5 && (baseLevel === 'LOW' || baseLevel === 'MEDIUM')) {
    finalLevel = 'HIGH';
    levelElevated = true;
  }

  return {
    utilizationScore: Math.round(utilizationScore * 10) / 10,
    probabilityScore: Math.round(probabilityScore * 10) / 10,
    riskScore,
    riskLevel: finalLevel,
    levelElevated,
  };
}

/**
 * Formats probability with high numerical integrity:
 * Shows '<1%' for small non-zero probabilities instead of a misleading '0%'.
 */
export function formatProbability(prob: number): string {
  if (prob <= 0) return '0%';
  if (prob < 0.005) return '<1%';
  return `${Math.round(prob * 100)}%`;
}

/**
 * Formats percentage ratio.
 */
export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}
