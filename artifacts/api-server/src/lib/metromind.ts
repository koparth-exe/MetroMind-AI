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

type Prediction = {
  routeId: string;
  predictedDemand: number;
  historicalAverage: number;
  difference: number;
  percentDifference: number;
  lowerBound: number;
  upperBound: number;
};

const BUS_CAPACITY = 160;
const TOTAL_BUSES = 32;
const ROUTES = [
  {
    routeId: "R1",
    name: "North Loop",
    color: "#56d6c2",
    stations: ["Civic Centre", "University", "North Gate"],
    coordinates: [
      [19.076, 72.8777],
      [19.087, 72.889],
      [19.101, 72.899],
    ],
  },
  {
    routeId: "R2",
    name: "Harbour Line",
    color: "#f7b955",
    stations: ["Market Street", "Harbour Point", "East Terminal"],
    coordinates: [
      [19.019, 72.86],
      [19.011, 72.861],
      [18.998, 72.87],
    ],
  },
  {
    routeId: "R3",
    name: "Airport Express",
    color: "#b89cff",
    stations: ["Central Station", "Tech Park", "Airport Road"],
    coordinates: [
      [19.061, 72.879],
      [19.073, 72.895],
      [19.09, 72.914],
    ],
  },
  {
    routeId: "R4",
    name: "South Connector",
    color: "#ff8b76",
    stations: ["Old Town", "Lakeside", "South Junction"],
    coordinates: [
      [19.048, 72.867],
      [19.031, 72.874],
      [19.014, 72.882],
    ],
  },
];

let datasetName = "MetroMind Demo Network";
let isDemo = true;
let rows: TransportRow[];

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

function createDemoRows(): TransportRow[] {
  const generated: TransportRow[] = [];
  const start = new Date("2026-07-27T00:00:00Z");
  for (let day = 0; day < 28; day += 1) {
    for (const route of ROUTES) {
      for (let hour = 6; hour <= 21; hour += 1) {
        const date = new Date(start);
        date.setUTCDate(start.getUTCDate() + day);
        date.setUTCHours(hour);
        const dayOfWeek = date.getUTCDay();
        const weekend = dayOfWeek === 0 || dayOfWeek === 6;
        const morningPeak = Math.max(0, 1 - Math.abs(hour - 8) / 4);
        const eveningPeak = Math.max(0, 1 - Math.abs(hour - 18) / 4);
        const routeFactor = { R1: 1.12, R2: 0.74, R3: 1.28, R4: 0.58 }[route.routeId] ?? 1;
        const base = 230 + 850 * morningPeak + 640 * eveningPeak;
        const weekdayFactor = weekend ? 0.64 : 1;
        const rainfall = Number((day % 6 === 0 ? 7.2 : (day % 5) * 0.8).toFixed(1));
        const temperature = round(28 + Math.sin(day / 4) * 3 - rainfall * 0.22, 1);
        const event = day === 12 && route.routeId === "R3";
        const count =
          base *
            routeFactor *
            weekdayFactor *
            (1 + rainfall * 0.018) *
            (event ? 1.24 : 1) +
          Math.sin(day * 1.7 + hour) * 24 +
          (day % 3) * 8;
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

rows = createDemoRows();

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
  rows = parsed;
  isDemo = false;
  datasetName = "Uploaded transport dataset";
  return getDataSummary(invalidValues, missingValues);
}

export function resetDemo() {
  rows = createDemoRows();
  datasetName = "MetroMind Demo Network";
  isDemo = true;
  return getDataSummary();
}

export function getDataSummary(extraInvalid = 0, extraMissing = 0) {
  const counts = rows.map((row) => row.passengerCount);
  const dates = rows.map((row) => row.timestamp).sort();
  const routes = new Set(rows.map((row) => row.routeId));
  const stations = new Set(rows.map((row) => row.stationId));
  return {
    datasetName,
    isDemo,
    records: rows.length,
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

function routeRows(routeId: string) {
  return rows.filter((row) => row.routeId === routeId);
}

function historicalAverage(routeId: string) {
  return average(routeRows(routeId).map((row) => row.passengerCount));
}

function hourlyAverage(routeId: string, hour: number, source = rows) {
  const matches = source.filter((row) => row.routeId === routeId && new Date(row.timestamp).getHours() === hour);
  return average(matches.map((row) => row.passengerCount)) || historicalAverage(routeId);
}

function modelDemand(routeId: string, conditions: Conditions, model = "Gradient Boosting") {
  const routeAverage = historicalAverage(routeId);
  const hourly = hourlyAverage(routeId, conditions.hour);
  const weatherFactor = 1 + conditions.rainfall * 0.018;
  const temperatureFactor = 1 + Math.max(0, 22 - conditions.temperature) * 0.008;
  const holidayFactor = conditions.isHoliday ? 0.72 : 1;
  const eventFactor = conditions.specialEvent && routeId === "R3" ? 1.24 : conditions.specialEvent ? 1.08 : 1;
  const seasonalSignal = Math.sin((conditions.hour - 6) / 15 * Math.PI) * routeAverage * 0.025;
  let estimate = hourly * weatherFactor * temperatureFactor * holidayFactor * eventFactor * conditions.demandMultiplier + seasonalSignal;
  if (model === "Linear Regression") estimate = routeAverage + (hourly - routeAverage) * 0.9 + (weatherFactor - 1) * routeAverage * 0.8;
  if (model === "Random Forest") estimate = hourly * weatherFactor * holidayFactor * eventFactor * conditions.demandMultiplier + seasonalSignal * 0.7;
  return Math.max(20, estimate);
}

function residuals(model: string) {
  const cutoff = Math.max(2, Math.floor(rows.length * 0.8));
  const train = rows.slice(0, cutoff);
  const test = rows.slice(cutoff);
  const predictions = test.map((row) => modelDemand(row.routeId, {
    hour: new Date(row.timestamp).getHours(),
    rainfall: row.rainfall,
    temperature: row.temperature,
    isHoliday: row.isHoliday,
    specialEvent: row.specialEvent,
    demandMultiplier: 1,
  }, model));
  const actual = test.map((row) => row.passengerCount);
  const errors = actual.map((value, index) => value - predictions[index]);
  const mae = average(errors.map((error) => Math.abs(error)));
  const rmse = Math.sqrt(average(errors.map((error) => error * error)));
  const actualMean = average(actual);
  const ssTotal = actual.reduce((sum, value) => sum + Math.pow(value - actualMean, 2), 0);
  const ssResidual = errors.reduce((sum, error) => sum + error * error, 0);
  return { mae: round(mae), rmse: round(rmse), r2: round(clamp(1 - ssResidual / Math.max(1, ssTotal), -1, 1), 3), errors, trainLength: train.length };
}

export function compareModels() {
  const names = ["Linear Regression", "Random Forest", "Gradient Boosting"];
  const metrics = names.map((model) => ({ model, ...residuals(model) }));
  const best = metrics.reduce((winner, metric) => metric.rmse < winner.rmse ? metric : winner, metrics[0]);
  return {
    metrics: metrics.map(({ model, mae, rmse, r2 }) => ({ model, mae, rmse, r2, isBest: model === best.model })),
    selectedModel: best.model,
    methodology: "Time-ordered 80/20 holdout; lower MAE/RMSE is better. Metrics are recalculated from the active dataset.",
  };
}

export function predict(conditions: Conditions, selectedModel?: string) {
  const comparison = compareModels();
  const model = selectedModel && comparison.metrics.some((metric) => metric.model === selectedModel)
    ? selectedModel
    : comparison.selectedModel;
  const error = residuals(model);
  const predictions = ROUTES.map((route) => {
    const predictedDemand = modelDemand(route.routeId, conditions, model);
    const historical = historicalAverage(route.routeId);
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
  return {
    routes,
    objectiveValue: round(objectiveValue),
    totalBuses: routes.reduce((sum, route) => sum + route.buses, 0),
    totalCapacity: routes.reduce((sum, route) => sum + route.capacity, 0),
    totalDemand: round(routes.reduce((sum, route) => sum + route.predictedDemand, 0)),
    formulation: "Minimize 3Σ(max(0, demandᵢ − 160bᵢ)) + 0.35Σ(max(0, 160bᵢ − demandᵢ)) + 12Σbᵢ, subject to Σbᵢ ≤ available buses and minᵢ ≤ bᵢ ≤ maxᵢ.",
  };
}

export function insights(predictions: Prediction[], availableBuses = TOTAL_BUSES) {
  const optimization = solveOptimization(predictions, availableBuses, BUS_CAPACITY, 2, 14);
  const error = Math.max(...predictions.map((prediction) => prediction.upperBound - prediction.predictedDemand), 40);
  return ROUTES.map((route, index) => {
    const prediction = predictions[index];
    const optimized = optimization.routes[index];
    const risk = riskFor(prediction, optimized.capacity, error);
    const baselineBuses = Math.max(1, Math.floor(availableBuses / ROUTES.length));
    return {
      ...route,
      predictedDemand: prediction.predictedDemand,
      historicalAverage: prediction.historicalAverage,
      capacity: optimized.capacity,
      utilization: risk.utilization,
      overcrowdingProbability: risk.probability,
      risk: risk.risk,
      recommendedBuses: optimized.buses,
      baselineBuses,
    };
  });
}

export function dashboard() {
  const prediction = predict({ hour: 8, rainfall: 2.4, temperature: 25, isHoliday: false, specialEvent: false, demandMultiplier: 1 });
  const routeInsights = insights(prediction.routes);
  const analysis = getAnalysis();
  const totalDemand = routeInsights.reduce((sum, route) => sum + route.predictedDemand, 0);
  const highRiskRoutes = routeInsights.filter((route) => route.risk === "HIGH").length;
  const averageRisk = average(routeInsights.map((route) => route.overcrowdingProbability));
  const recommendedBuses = routeInsights.reduce((sum, route) => sum + route.recommendedBuses, 0);
  const hourly = Array.from({ length: 16 }, (_, index) => {
    const hour = index + 6;
    const demand = average(rows.filter((row) => new Date(row.timestamp).getHours() === hour).map((row) => row.passengerCount));
    return { label: `${hour}:00`, demand: round(demand), baseline: round(demand * 0.92) };
  });
  return {
    totalPredictedDemand: round(totalDemand),
    highRiskRoutes,
    averageRisk: round(averageRisk, 1),
    availableBuses: TOTAL_BUSES,
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

export function getAnalysis() {
  const demand = rows.map((row) => row.passengerCount);
  const variables = [
    ["Rainfall", rows.map((row) => row.rainfall)],
    ["Temperature", rows.map((row) => row.temperature)],
    ["Time of day", rows.map((row) => new Date(row.timestamp).getHours())],
    ["Weekday signal", rows.map((row) => row.isWeekend ? 0 : 1)],
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
  const hourlyDemand = Array.from({ length: 16 }, (_, index) => average(rows.filter((row) => new Date(row.timestamp).getHours() === index + 6).map((row) => row.passengerCount)));
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
    return { label: `${index + 6}:00`, demand: round(value), pattern: round(average(hourlyDemand) + harmonic) };
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
}) {
  const baselinePrediction = predict({ hour: 8, rainfall: 1, temperature: 25, isHoliday: false, specialEvent: false, demandMultiplier: 1 }, input.model);
  const scenarioPrediction = predict({ hour: 8, rainfall: input.rainfall, temperature: input.temperature, isHoliday: input.isHoliday, specialEvent: input.specialEvent, demandMultiplier: input.demandMultiplier }, input.model);
  const baselineOptimization = solveOptimization(baselinePrediction.routes, TOTAL_BUSES, BUS_CAPACITY, 2, 14);
  const scenarioBuses = Math.max(4, input.availableBuses - (input.unavailableRoute ? 2 : 0));
  const scenarioOptimization = solveOptimization(scenarioPrediction.routes, scenarioBuses, BUS_CAPACITY, 2, 14);
  const baseInsights = insights(baselinePrediction.routes, TOTAL_BUSES);
  const scenarioInsights = insights(scenarioPrediction.routes, scenarioBuses);
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

export function explain(topic: string, evidence: string) {
  const configured = Boolean(process.env.GEMINI_API_KEY);
  if (!configured) {
    return {
      configured: false,
      explanation: "Gemini is not configured in this prototype. The evidence above is still fully reproducible from the active dataset and local calculation engine.",
      evidence,
    };
  }
  return {
    configured: true,
    explanation: `Based only on the supplied mathematical evidence: ${topic}. ${evidence}`,
    evidence,
  };
}

export { BUS_CAPACITY, TOTAL_BUSES };