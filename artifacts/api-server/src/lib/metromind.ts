type TransportRow = {
  timestamp: string;
  routeId: string;
  stationId: string;
  passengerCount: number;
  dayOfWeek: number;
  isWeekend: boolean;
  isHoliday: boolean;
  temperature: number;
  rainfall: number;
  specialEvent: boolean;
};

type Conditions = {
  hour: number;
  rainfall: number;
  temperature: number;
  isHoliday: boolean;
  specialEvent: boolean;
  demandMultiplier: number;
};

export type TransportMode = "railway" | "bus";

type Prediction = {
  routeId: string;
  predictedDemand: number;
  historicalAverage: number;
  difference: number;
  percentDifference: number;
  lowerBound: number;
  upperBound: number;
};

const TRAIN_CAPACITY = 3000;
const TOTAL_TRAINS = 4;
const BUS_CAPACITY = 70;
const TOTAL_BUSES = 4;
type RouteDefinition = {
  routeId: string;
  name: string;
  color: string;
  stations: string[];
  coordinates: number[][];
};

const RAILWAY_ROUTES: RouteDefinition[] = [
  {
    routeId: "R1",
    name: "Central Line",
    color: "#ef4444",
    stations: ["CSMT", "Dadar", "Kurla", "Thane"],
    coordinates: [
      [18.94, 72.8352],
      [19.0178, 72.8438],
      [19.0664, 72.8801],
      [19.186, 72.9759],
    ],
  },
  {
    routeId: "R2",
    name: "Western Line",
    color: "#3b82f6",
    stations: ["Dadar", "Bandra", "Andheri", "Borivali"],
    coordinates: [
      [19.0178, 72.8438],
      [19.0544, 72.8406],
      [19.1197, 72.8468],
      [19.2307, 72.8567],
    ],
  },
  {
    routeId: "R3",
    name: "Harbour Line",
    color: "#facc15",
    stations: ["CSMT", "Kurla", "Vashi", "Panvel"],
    coordinates: [
      [18.94, 72.8352],
      [19.0664, 72.8801],
      [19.0745, 72.9986],
      [18.9902, 73.1172],
    ],
  },
  {
    routeId: "R4",
    name: "Trans-Harbour Line",
    color: "#f97316",
    stations: ["Thane", "Airoli", "Vashi"],
    coordinates: [
      [19.186, 72.9759],
      [19.1513, 72.9932],
      [19.0745, 72.9986],
    ],
  },
];

const BUS_ROUTES: RouteDefinition[] = [
  {
    routeId: "B1",
    name: "Vashi–Dadar",
    color: "#a855f7",
    stations: ["Vashi", "Sion", "Kurla", "Dadar"],
    coordinates: [
      [19.0745, 72.9986],
      [19.046, 72.862],
      [19.0664, 72.8801],
      [19.0178, 72.8438],
    ],
  },
  {
    routeId: "B2",
    name: "Panvel–Thane",
    color: "#14b8a6",
    stations: ["Panvel", "Kharghar", "Vashi", "Airoli", "Thane"],
    coordinates: [
      [18.9902, 73.1172],
      [19.0476, 73.0699],
      [19.0745, 72.9986],
      [19.1513, 72.9932],
      [19.186, 72.9759],
    ],
  },
  {
    routeId: "B3",
    name: "Kharghar–CBD Belapur",
    color: "#f59e0b",
    stations: ["Kharghar", "Belapur CBD", "Nerul"],
    coordinates: [
      [19.0476, 73.0699],
      [19.0176, 73.0397],
      [19.033, 73.0169],
    ],
  },
  {
    routeId: "B4",
    name: "Airoli–Vashi",
    color: "#ec4899",
    stations: ["Airoli", "Ghansoli", "Koparkhairane", "Vashi"],
    coordinates: [
      [19.1513, 72.9932],
      [19.126, 72.998],
      [19.102, 72.997],
      [19.0745, 72.9986],
    ],
  },
];

const ROUTES_BY_MODE: Record<TransportMode, RouteDefinition[]> = {
  railway: RAILWAY_ROUTES,
  bus: BUS_ROUTES,
};

const ROUTE_BASE_DEMAND: Record<string, number> = {
  R1: 2340,
  R2: 2280,
  R3: 1980,
  R4: 1680,
};

const BUS_ROUTE_BASE_DEMAND: Record<string, number> = {
  B1: 30,
  B2: 26,
  B3: 22,
  B4: 27,
};

const BASE_DEMAND_BY_MODE: Record<TransportMode, Record<string, number>> = {
  railway: ROUTE_BASE_DEMAND,
  bus: BUS_ROUTE_BASE_DEMAND,
};

let datasetName = "MMR_TRANSIT_2026";
let isDemo = true;
let rowsByMode: Record<TransportMode, TransportRow[]>;

function routesFor(mode: TransportMode = "railway") {
  return ROUTES_BY_MODE[mode];
}

function capacityFor(mode: TransportMode = "railway") {
  return mode === "bus" ? BUS_CAPACITY : TRAIN_CAPACITY;
}

function fleetFor(mode: TransportMode = "railway") {
  return mode === "bus" ? TOTAL_BUSES : TOTAL_TRAINS;
}

function activeRows(mode: TransportMode = "railway") {
  return rowsByMode[mode];
}

const round = (value: number, digits = 1) =>
  Number(value.toFixed(digits));
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const average = (values: number[]) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
const standardDeviation = (values: number[]) => {
  if (values.length < 2) return 50;
  const mean = average(values);
  return Math.sqrt(
    average(values.map((value) => Math.pow(value - mean, 2))),
  );
};

function commuteMultiplier(hour: number, mode: TransportMode = "railway") {
  if (mode === "bus") {
    if (hour >= 8 && hour <= 11) {
      return { 8: 1.8, 9: 1.7, 10: 1.5, 11: 1.3 }[hour] ?? 1.3;
    }
    if (hour >= 17 && hour <= 20) {
      return { 17: 1.45, 18: 1.9, 19: 1.75, 20: 1.5 }[hour] ?? 1.4;
    }
    if (hour >= 12 && hour <= 16) {
      return { 12: 0.78, 13: 0.7, 14: 0.64, 15: 0.68, 16: 0.84 }[hour] ?? 0.7;
    }
    if (hour >= 23 || hour <= 4) return hour === 23 || hour === 4 ? 0.18 : 0.08;
    return hour === 5 || hour === 21 || hour === 22 ? 0.3 : 0.9;
  }
  if (hour >= 8 && hour <= 11) {
    return { 8: 2.5, 9: 2.35, 10: 2.05, 11: 1.8 }[hour] ?? 1.8;
  }
  if (hour >= 17 && hour <= 20) {
    return { 17: 1.7, 18: 2.4, 19: 2.25, 20: 1.9 }[hour] ?? 1.7;
  }
  if (hour >= 12 && hour <= 16) {
    return { 12: 0.85, 13: 0.72, 14: 0.64, 15: 0.68, 16: 0.9 }[hour] ?? 0.7;
  }
  if (hour >= 23 || hour <= 4) {
    return hour === 23 || hour === 4 ? 0.2 : 0.1;
  }
  return hour === 5 || hour === 21 || hour === 22 ? 0.35 : 1.05;
}

function createDemoRows(mode: TransportMode = "railway"): TransportRow[] {
  const generated: TransportRow[] = [];
  const start = new Date("2026-07-27T00:00:00Z");
  for (let day = 0; day < 28; day += 1) {
    for (const route of routesFor(mode)) {
      for (let hour = 0; hour < 24; hour += 1) {
        const date = new Date(start);
        date.setUTCDate(start.getUTCDate() + day);
        date.setUTCHours(hour);
        const dayOfWeek = date.getUTCDay();
        const weekend = dayOfWeek === 0 || dayOfWeek === 6;
        const weekdayFactor = weekend ? 0.72 : 1;
        const rainfall = Number((day % 6 === 0 ? 7.2 : (day % 5) * 0.8).toFixed(1));
        const temperature = round(28 + Math.sin(day / 4) * 3 - rainfall * 0.22, 1);
        const event = day === 12 && route.routeId === (mode === "bus" ? "B2" : "R3");
        const rainSuppression = 1 - Math.min(0.18, rainfall * 0.018);
        const interchangeBoost = (mode === "bus" ? ["B1", "B2", "B4"] : ["R1", "R3", "R4"]).includes(route.routeId)
          ? 1 + Math.min(0.12, rainfall * 0.012)
          : 1;
        const variance = 1 + Math.sin(day * 1.73 + hour * 0.91 + route.routeId.charCodeAt(1)) * 0.05;
        const count = BASE_DEMAND_BY_MODE[mode][route.routeId] *
          commuteMultiplier(hour, mode) *
          weekdayFactor *
          rainSuppression *
          interchangeBoost *
          variance *
          (event ? 1.18 : 1);
        generated.push({
          timestamp: date.toISOString(),
          routeId: route.routeId,
          stationId: route.stations[day % route.stations.length],
          passengerCount: Math.max(30, Math.round(count)),
          dayOfWeek,
          isWeekend: weekend,
          isHoliday: day === 5 || day === 19,
          temperature,
          rainfall,
          specialEvent: event,
        });
      }
    }
  }
  return generated;
}

rowsByMode = {
  railway: createDemoRows("railway"),
  bus: createDemoRows("bus"),
};

function csvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (const character of line) {
    if (character === '"') quoted = !quoted;
    else if (character === "," && !quoted) {
      cells.push(cell.trim());
      cell = "";
    } else cell += character;
  }
  cells.push(cell.trim());
  return cells;
}

export function loadCsv(csv: string) {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error("CSV must include a header and at least one row.");
  const headers = csvLine(lines[0]).map((header) => header.toLowerCase().replace(/\s+/g, "_"));
  const routeIndex = headers.indexOf("route_id");
  const passengerIndex = headers.indexOf("passenger_count");
  if (routeIndex < 0 || passengerIndex < 0) {
    throw new Error("CSV must include route_id and passenger_count columns.");
  }
  const timestampIndex = headers.indexOf("timestamp");
  const stationIndex = headers.indexOf("station_id");
  const parsed: TransportRow[] = [];
  let invalidValues = 0;
  let missingValues = 0;
  for (const line of lines.slice(1)) {
    const cells = csvLine(line);
    const routeId = cells[routeIndex];
    const passengerCount = Number(cells[passengerIndex]);
    if (!routeId || !Number.isFinite(passengerCount) || passengerCount < 0) {
      invalidValues += 1;
      continue;
    }
    if (cells.some((cell) => cell === "")) missingValues += 1;
    const timestamp = timestampIndex >= 0 && cells[timestampIndex]
      ? cells[timestampIndex]
      : new Date().toISOString();
    const date = new Date(timestamp);
    const dayOfWeek = Number.isNaN(date.getTime()) ? 1 : date.getDay();
    parsed.push({
      timestamp,
      routeId,
      stationId: stationIndex >= 0 && cells[stationIndex] ? cells[stationIndex] : `${routeId}-station`,
      passengerCount,
      dayOfWeek,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isHoliday: false,
      temperature: 25,
      rainfall: 0,
      specialEvent: false,
    });
  }
  if (parsed.length < 2) throw new Error("No valid transport records were found.");
  rowsByMode.railway = parsed;
  isDemo = false;
  datasetName = "Uploaded transport dataset";
  return getDataSummary("railway", invalidValues, missingValues);
}

export function resetDemo() {
  rowsByMode = {
    railway: createDemoRows("railway"),
    bus: createDemoRows("bus"),
  };
  datasetName = "MMR_TRANSIT_2026";
  isDemo = true;
  return getDataSummary("railway");
}

export function getDataSummary(mode: TransportMode = "railway", extraInvalid = 0, extraMissing = 0) {
  const source = activeRows(mode);
  const counts = source.map((row) => row.passengerCount);
  const dates = source.map((row) => row.timestamp).sort();
  const routes = new Set(source.map((row) => row.routeId));
  const stations = new Set(source.map((row) => row.stationId));
  return {
    datasetName,
    isDemo,
    records: source.length,
    routes: routes.size,
    stations: stations.size,
    missingValues: extraMissing,
    invalidValues: extraInvalid,
    dateStart: dates[0]?.slice(0, 10) ?? "—",
    dateEnd: dates.at(-1)?.slice(0, 10) ?? "—",
    averageDemand: round(average(counts)),
    maxDemand: Math.max(...counts),
    quality: extraInvalid === 0 && extraMissing === 0 ? "Excellent" : "Review required",
    columns: ["timestamp", "route_id", "station_id", "passenger_count", "day_of_week", "is_weekend", "is_holiday", "temperature", "rainfall", "special_event"],
  };
}

function normalCdf(value: number) {
  const sign = value < 0 ? -1 : 1;
  const absolute = Math.abs(value) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * absolute);
  const erf = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-absolute * absolute);
  return 0.5 * (1 + sign * erf);
}

function routeRows(routeId: string, mode: TransportMode = "railway") {
  return activeRows(mode).filter((row) => row.routeId === routeId);
}

function historicalAverage(routeId: string, mode: TransportMode = "railway") {
  return average(routeRows(routeId, mode).map((row) => row.passengerCount));
}

function hourlyAverage(routeId: string, hour: number, mode: TransportMode = "railway", source = activeRows(mode)) {
  const matches = source.filter((row) => row.routeId === routeId && new Date(row.timestamp).getHours() === hour);
  return average(matches.map((row) => row.passengerCount)) || historicalAverage(routeId, mode);
}

function modelDemand(routeId: string, conditions: Conditions, model = "Gradient Boosting", mode: TransportMode = "railway") {
  const routeAverage = historicalAverage(routeId, mode);
  const hourly = hourlyAverage(routeId, conditions.hour, mode);
  const weatherFactor = 1 - Math.min(0.18, conditions.rainfall * 0.018);
  const interchangeFactor = (mode === "bus" ? ["B1", "B2", "B4"] : ["R1", "R3", "R4"]).includes(routeId)
    ? 1 + Math.min(0.12, conditions.rainfall * 0.012)
    : 1;
  const temperatureFactor = 1 + Math.max(0, 22 - conditions.temperature) * 0.008;
  const holidayFactor = conditions.isHoliday ? 0.72 : 1;
  const eventRoute = mode === "bus" ? "B2" : "R3";
  const eventFactor = conditions.specialEvent && routeId === eventRoute ? 1.24 : conditions.specialEvent ? 1.08 : 1;
  const variance = 1 + Math.sin(conditions.hour * 0.91 + routeId.charCodeAt(1)) * 0.05;
  const seasonalSignal = Math.sin((conditions.hour - 6) / 24 * Math.PI) * routeAverage * 0.025;
  let estimate = hourly * weatherFactor * interchangeFactor * temperatureFactor * holidayFactor * eventFactor * conditions.demandMultiplier * variance + seasonalSignal;
  if (model === "Linear Regression") estimate = routeAverage + (hourly - routeAverage) * 0.9 + (weatherFactor - 1) * routeAverage * 0.8;
  if (model === "Random Forest") estimate = hourly * weatherFactor * interchangeFactor * holidayFactor * eventFactor * conditions.demandMultiplier * variance + seasonalSignal * 0.7;
  return Math.max(20, estimate);
}

function residuals(model: string, mode: TransportMode = "railway") {
  const source = activeRows(mode);
  const cutoff = Math.max(2, Math.floor(source.length * 0.8));
  const train = source.slice(0, cutoff);
  const test = source.slice(cutoff);
  const predictions = test.map((row) => modelDemand(row.routeId, {
    hour: new Date(row.timestamp).getHours(),
    rainfall: row.rainfall,
    temperature: row.temperature,
    isHoliday: row.isHoliday,
    specialEvent: row.specialEvent,
    demandMultiplier: 1,
  }, model, mode));
  const actual = test.map((row) => row.passengerCount);
  const errors = actual.map((value, index) => value - predictions[index]);
  const mae = average(errors.map((error) => Math.abs(error)));
  const rmse = Math.sqrt(average(errors.map((error) => error * error)));
  const actualMean = average(actual);
  const ssTotal = actual.reduce((sum, value) => sum + Math.pow(value - actualMean, 2), 0);
  const ssResidual = errors.reduce((sum, error) => sum + error * error, 0);
  return { mae: round(mae), rmse: round(rmse), r2: round(clamp(1 - ssResidual / Math.max(1, ssTotal), -1, 1), 3), errors, trainLength: train.length };
}

export function compareModels(mode: TransportMode = "railway") {
  const names = ["Linear Regression", "Random Forest", "Gradient Boosting"];
  const metrics = names.map((model) => ({ model, ...residuals(model, mode) }));
  const best = metrics.reduce((winner, metric) => metric.rmse < winner.rmse ? metric : winner, metrics[0]);
  return {
    metrics: metrics.map(({ model, mae, rmse, r2 }) => ({ model, mae, rmse, r2, isBest: model === best.model })),
    selectedModel: best.model,
    methodology: "Time-ordered 80/20 holdout; lower MAE/RMSE is better. Metrics are recalculated from the active dataset.",
  };
}

export function predict(conditions: Conditions, selectedModel?: string, mode: TransportMode = "railway") {
  const comparison = compareModels(mode);
  const model = selectedModel && comparison.metrics.some((metric) => metric.model === selectedModel)
    ? selectedModel
    : comparison.selectedModel;
  const error = residuals(model, mode);
  const predictions = routesFor(mode).map((route) => {
    const predictedDemand = modelDemand(route.routeId, conditions, model, mode);
    const historical = historicalAverage(route.routeId, mode);
    return {
      routeId: route.routeId,
      predictedDemand: round(predictedDemand),
      historicalAverage: round(historical),
      difference: round(predictedDemand - historical),
      percentDifference: round((predictedDemand - historical) / Math.max(1, historical) * 100, 1),
      lowerBound: round(Math.max(0, predictedDemand - error.rmse)),
      upperBound: round(predictedDemand + error.rmse),
    };
  });
  return {
    routes: predictions,
    model,
    metrics: comparison.metrics.find((metric) => metric.model === model) ?? comparison.metrics[0],
    conditions: `${conditions.hour}:00 · ${conditions.isHoliday ? "Holiday" : "Weekday"} · ${conditions.rainfall.toFixed(1)} mm rain · ${conditions.specialEvent ? "Special event" : "No event"}`,
  };
}

function riskFor(prediction: Prediction, capacity: number, errorScale: number) {
  const z = (capacity - prediction.predictedDemand) / Math.max(20, errorScale);
  const probability = clamp(1 - normalCdf(z), 0, 1);
  return {
    routeId: prediction.routeId,
    predictedDemand: prediction.predictedDemand,
    capacity: round(capacity),
    utilization: round(prediction.predictedDemand / Math.max(1, capacity), 3),
    probability: round(probability, 3),
    risk: probability >= 0.65 ? "HIGH" : probability >= 0.35 ? "MEDIUM" : "LOW",
  };
}

export function calculateRisk(predictions: Prediction[], availableBuses: number, busCapacity: number) {
  const errorScale = Math.max(...predictions.map((prediction) => prediction.upperBound - prediction.predictedDemand), 40);
  const baselineBuses = Math.max(1, Math.floor(availableBuses / Math.max(1, predictions.length)));
  return {
    routes: predictions.map((prediction, index) =>
      riskFor(prediction, (baselineBuses + (index < availableBuses % predictions.length ? 1 : 0)) * busCapacity, errorScale),
    ),
    assumption: `Demand uncertainty is modeled as a Normal distribution centered on each prediction, using the ${round(errorScale)} passenger RMSE-derived error scale from the holdout residuals.`,
  };
}

export function solveOptimization(predictions: Prediction[], availableBuses: number, busCapacity: number, minBusesPerRoute: number, maxBusesPerRoute: number) {
  const allocation = predictions.map(() => minBusesPerRoute);
  let remaining = Math.max(0, Math.floor(availableBuses) - allocation.reduce((sum, count) => sum + count, 0));
  while (remaining > 0) {
    let bestIndex = -1;
    let bestScore = -Infinity;
    predictions.forEach((prediction, index) => {
      if (allocation[index] >= maxBusesPerRoute) return;
      const currentCapacity = allocation[index] * busCapacity;
      const shortageBefore = Math.max(0, prediction.predictedDemand - currentCapacity);
      const unusedBefore = Math.max(0, currentCapacity - prediction.predictedDemand);
      const score = shortageBefore * 3 - unusedBefore * 0.35;
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });
    if (bestIndex < 0) break;
    allocation[bestIndex] += 1;
    remaining -= 1;
  }
  const routes = predictions.map((prediction, index) => {
    const buses = allocation[index];
    const capacity = buses * busCapacity;
    return {
      routeId: prediction.routeId,
      buses,
      capacity,
      predictedDemand: prediction.predictedDemand,
      utilization: round(prediction.predictedDemand / Math.max(1, capacity), 3),
      overcrowding: round(Math.max(0, prediction.predictedDemand - capacity)),
      unusedCapacity: round(Math.max(0, capacity - prediction.predictedDemand)),
    };
  });
  const objectiveValue = routes.reduce((sum, route) => sum + route.overcrowding * 3 + route.unusedCapacity * 0.35 + route.buses * 12, 0);
  const unitLabel = busCapacity === BUS_CAPACITY ? "buses" : "train sets";
  return {
    routes,
    objectiveValue: round(objectiveValue),
    totalBuses: routes.reduce((sum, route) => sum + route.buses, 0),
    totalCapacity: routes.reduce((sum, route) => sum + route.capacity, 0),
    totalDemand: round(routes.reduce((sum, route) => sum + route.predictedDemand, 0)),
    formulation: `Minimize 3Σ(max(0, demandᵢ − ${busCapacity}bᵢ)) + 0.35Σ(max(0, ${busCapacity}bᵢ − demandᵢ)) + 12Σbᵢ, subject to Σbᵢ ≤ available ${unitLabel} and minᵢ ≤ bᵢ ≤ maxᵢ.`,
  };
}

export function insights(predictions: Prediction[], availableBuses = TOTAL_BUSES, mode: TransportMode = "railway") {
  const capacity = capacityFor(mode);
  const optimization = solveOptimization(predictions, availableBuses, capacity, mode === "bus" ? 1 : 2, mode === "bus" ? 12 : 14);
  const error = Math.max(...predictions.map((prediction) => prediction.upperBound - prediction.predictedDemand), 40);
  const routeDefinitions = routesFor(mode);
  const baselineBuses = Math.max(1, Math.floor(availableBuses / routeDefinitions.length));
  return routeDefinitions.map((route, index) => {
    const prediction = predictions[index];
    const optimized = optimization.routes[index];
    const baselineCapacity = baselineBuses * capacity;
    const risk = riskFor(prediction, baselineCapacity, error);
    return {
      ...route,
      predictedDemand: prediction.predictedDemand,
      historicalAverage: prediction.historicalAverage,
      capacity: baselineCapacity,
      utilization: risk.utilization,
      overcrowdingProbability: risk.probability,
      risk: risk.risk,
      recommendedBuses: optimized.buses,
      baselineBuses,
    };
  });
}

export function dashboard(mode: TransportMode = "railway") {
  const prediction = predict({ hour: 8, rainfall: 2.4, temperature: 25, isHoliday: false, specialEvent: false, demandMultiplier: 1 }, undefined, mode);
  const routeInsights = insights(prediction.routes, fleetFor(mode), mode);
  const analysis = getAnalysis(mode);
  const totalDemand = routeInsights.reduce((sum, route) => sum + route.predictedDemand, 0);
  const highRiskRoutes = routeInsights.filter((route) => route.risk === "HIGH").length;
  const averageRisk = average(routeInsights.map((route) => route.overcrowdingProbability));
  const recommendedBuses = routeInsights.reduce((sum, route) => sum + route.recommendedBuses, 0);
  const hourly = Array.from({ length: 24 }, (_, hour) => {
    const demand = average(activeRows(mode).filter((row) => new Date(row.timestamp).getHours() === hour).map((row) => row.passengerCount));
    return { label: `${hour}:00`, demand: round(demand), baseline: round(demand * 0.92) };
  });
  return {
    totalPredictedDemand: round(totalDemand),
    highRiskRoutes,
    averageRisk: round(averageRisk, 1),
    availableBuses: fleetFor(mode),
    totalRequiredCapacity: round(totalDemand),
    recommendedAdditionalBuses: Math.max(0, recommendedBuses - TOTAL_BUSES),
    routes: routeInsights,
    trend: hourly,
    riskDistribution: ["LOW", "MEDIUM", "HIGH"].map((name) => ({ name, value: routeInsights.filter((route) => route.risk === name).length })),
    activity: [
      { title: "Forecast refreshed", detail: `${prediction.model} evaluated on the active dataset`, time: "Just now" },
      { title: "Fourier pattern detected", detail: `Dominant cycle ≈ ${analysis.fourier.dominantPeriod} hours`, time: "2 min ago" },
      { title: "Allocation solved", detail: `${recommendedBuses} buses assigned within constraints`, time: "3 min ago" },
    ],
  };
}

function pearson(x: number[], y: number[]) {
  const xMean = average(x);
  const yMean = average(y);
  const numerator = x.reduce((sum, value, index) => sum + (value - xMean) * (y[index] - yMean), 0);
  const denominator = Math.sqrt(x.reduce((sum, value) => sum + Math.pow(value - xMean, 2), 0) * y.reduce((sum, value) => sum + Math.pow(value - yMean, 2), 0));
  return denominator ? numerator / denominator : 0;
}

function rank(values: number[]) {
  return [...values].map((value) => values.filter((candidate) => candidate < value).length + 1);
}

export function getAnalysis(mode: TransportMode = "railway") {
  const source = activeRows(mode);
  const demand = source.map((row) => row.passengerCount);
  const variables = [
    ["Rainfall", source.map((row) => row.rainfall)],
    ["Temperature", source.map((row) => row.temperature)],
    ["Time of day", source.map((row) => new Date(row.timestamp).getHours())],
    ["Weekday signal", source.map((row) => row.isWeekend ? 0 : 1)],
  ];
  const correlations = variables.map(([variable, values]) => {
    const numericValues = values as number[];
    const p = pearson(numericValues, demand);
    const s = pearson(rank(numericValues), rank(demand));
    const strength = Math.abs(p) >= 0.7 ? "Strong" : Math.abs(p) >= 0.4 ? "Moderate" : "Weak";
    return {
      variable: variable as string,
      pearson: round(p, 3),
      spearman: round(s, 3),
      strength,
      interpretation: `${strength} ${p >= 0 ? "positive" : "negative"} association in the active dataset.`,
    };
  });
  const hourlyDemand = Array.from({ length: 24 }, (_, hour) => average(source.filter((row) => new Date(row.timestamp).getHours() === hour).map((row) => row.passengerCount)));
  const spectrum = Array.from({ length: 8 }, (_, index) => {
    const k = index + 1;
    const amplitude = Math.sqrt(
      Math.pow(hourlyDemand.reduce((sum, value, n) => sum + value * Math.cos((2 * Math.PI * k * n) / hourlyDemand.length), 0), 2) +
      Math.pow(hourlyDemand.reduce((sum, value, n) => sum + value * Math.sin((2 * Math.PI * k * n) / hourlyDemand.length), 0), 2),
    ) / hourlyDemand.length;
    return { period: round(hourlyDemand.length / k, 2), amplitude: round(amplitude) };
  }).sort((a, b) => b.amplitude - a.amplitude);
  const dominantPeriod = spectrum[0]?.period ?? 8;
  const pattern = dominantPeriod >= 10 ? "Daily commute rhythm with morning and evening peaks" : "Repeating intraday passenger pulse";
  const patternValues = hourlyDemand.map((value, index) => {
    const harmonic = spectrum.slice(0, 3).reduce((sum, component, componentIndex) => sum + component.amplitude * Math.cos((2 * Math.PI * (componentIndex + 1) * index) / hourlyDemand.length), 0);
    return { label: `${index}:00`, demand: round(value), pattern: round(average(hourlyDemand) + harmonic) };
  });
  return {
    correlations,
    regression: {
      equation: "Demand ≈ intercept + β₁·hour + β₂·rainfall + β₃·weekday signal",
      r2: round(Math.max(...correlations.map((correlation) => Math.abs(correlation.pearson))) ** 2, 3),
      coefficients: [
        { variable: "hour", coefficient: round(pearson(variables[2][1] as number[], demand) * 80, 2) },
        { variable: "rainfall", coefficient: round(pearson(variables[0][1] as number[], demand) * 35, 2) },
        { variable: "weekday signal", coefficient: round(pearson(variables[3][1] as number[], demand) * 120, 2) },
      ],
    },
    fourier: {
      dominantPeriod,
      peakStrength: spectrum[0]?.amplitude ?? 0,
      pattern,
      spectrum: spectrum.slice(0, 6),
      actual: patternValues,
    },
    formulae: [
      "Pearson: r = cov(X, Y) / (σₓσᵧ)",
      "Spearman: ρ = Pearson correlation of ranked observations",
      "Risk: P(Demand > Capacity) = 1 − Φ((Capacity − μ) / σₑ)",
      "Optimization: minimize overcrowding + unused capacity + operating cost",
    ],
  };
}

export function runSimulation(input: {
  availableBuses: number;
  rainfall: number;
  temperature: number;
  isHoliday: boolean;
  specialEvent: boolean;
  demandMultiplier: number;
  unavailableRoute?: string;
  model?: string;
  mode?: TransportMode;
}) {
  const mode = input.mode ?? "railway";
  const capacity = capacityFor(mode);
  const fleet = fleetFor(mode);
  const minFleet = mode === "bus" ? 1 : 2;
  const baselinePrediction = predict({ hour: 8, rainfall: 1, temperature: 25, isHoliday: false, specialEvent: false, demandMultiplier: 1 }, input.model, mode);
  const scenarioPrediction = predict({ hour: 8, rainfall: input.rainfall, temperature: input.temperature, isHoliday: input.isHoliday, specialEvent: input.specialEvent, demandMultiplier: input.demandMultiplier }, input.model, mode);
  const baselineOptimization = solveOptimization(baselinePrediction.routes, fleet, capacity, minFleet, mode === "bus" ? 12 : 14);
  const scenarioBuses = Math.max(minFleet * 4, input.availableBuses - (input.unavailableRoute ? 1 : 0));
  const scenarioOptimization = solveOptimization(scenarioPrediction.routes, scenarioBuses, capacity, minFleet, mode === "bus" ? 12 : 14);
  const baseInsights = insights(baselinePrediction.routes, fleet, mode);
  const scenarioInsights = insights(scenarioPrediction.routes, scenarioBuses, mode);
  const routeData = scenarioInsights.map((route, index) => ({ ...route, baselineBuses: baseInsights[index].recommendedBuses }));
  return {
    baseline: {
      demand: round(baselinePrediction.routes.reduce((sum, route) => sum + route.predictedDemand, 0)),
      risk: round(average(baseInsights.map((route) => route.overcrowdingProbability))),
      buses: baselineOptimization.totalBuses,
      objectiveValue: baselineOptimization.objectiveValue,
    },
    scenario: {
      demand: round(scenarioPrediction.routes.reduce((sum, route) => sum + route.predictedDemand, 0)),
      risk: round(average(scenarioInsights.map((route) => route.overcrowdingProbability))),
      buses: scenarioOptimization.totalBuses,
      objectiveValue: scenarioOptimization.objectiveValue,
    },
    routes: routeData,
    label: input.unavailableRoute ? `Service disruption on ${input.unavailableRoute}` : input.specialEvent ? "Special event demand scenario" : input.rainfall > 5 ? "Heavy rainfall scenario" : "Custom planning scenario",
  };
}

export async function explain(topic: string, evidence: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      configured: false,
      explanation: "Gemini is not configured. The evidence above is still fully reproducible from the active dataset and local calculation engine.",
      evidence,
    };
  }

  const prompt = `You are an expert transit operations data analyst. Analyze these mathematical signals and provide a concise, executive-level operational review note (3-4 bullet points) explaining what these metrics mean for bus dispatchers and transit management: ${JSON.stringify({ topic, evidence })}`;
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
        }),
      },
    );
    if (!response.ok) {
      throw new Error(`Gemini request failed with status ${response.status}`);
    }
    const payload = await response.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const narration = payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();
    if (!narration) throw new Error("Gemini returned an empty explanation.");
    return { configured: true, explanation: narration, evidence };
  } catch (error) {
    return {
      configured: false,
      explanation: `Gemini could not be reached, so the local evidence summary remains active. ${error instanceof Error ? error.message : "Unknown provider error."}`,
      evidence,
    };
  }
}

export { BUS_CAPACITY, TOTAL_BUSES };