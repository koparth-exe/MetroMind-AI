/**
 * Canonical calculation of capacity coverage percentage across transit corridors.
 *
 * Formula:
 *   coverage_percent = (total_allocated_capacity / total_predicted_demand) * 100
 *
 * Canonical representation:
 * - ratio: raw mathematical quotient (e.g. 280 / 76 = 3.6842)
 * - percent: converted percentage (e.g. 368.421...)
 * - formatted: rounded integer display with percent sign (e.g. "368%")
 *
 * Rules:
 * - Values are NOT artificially capped at 100%.
 * - If demand is <= 0 or not finite, returns 0 / "0%".
 * - Guards against double-multiplication and fallback division-by-one errors.
 */
export function calculateCapacityCoverage(
  totalCapacity: number,
  totalDemand: number
): {
  ratio: number;
  percent: number;
  formatted: string;
} {
  if (!Number.isFinite(totalCapacity) || !Number.isFinite(totalDemand) || totalDemand <= 0) {
    return {
      ratio: 0,
      percent: 0,
      formatted: '0%',
    };
  }

  const ratio = totalCapacity / totalDemand;
  const percent = ratio * 100;
  const formatted = `${Math.round(percent)}%`;

  return {
    ratio,
    percent,
    formatted,
  };
}
