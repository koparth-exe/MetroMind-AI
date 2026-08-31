import { Router, type IRouter } from "express";
import {
  CalculateRiskBody,
  ExplainResultsBody,
  PredictDemandBody,
  RunSimulationBody,
  SolveOptimizationBody,
} from "@workspace/api-zod";
import {
  calculateRisk,
  compareModels,
  dashboard,
  explain,
  getAnalysis,
  getDataSummary,
  insights,
  loadCsv,
  predict,
  resetDemo,
  runSimulation,
  solveOptimization,
} from "../lib/metromind";

const router: IRouter = Router();

router.get("/dashboard", (_req, res) => res.json(dashboard()));
router.get("/data/summary", (_req, res) => res.json(getDataSummary()));
router.post("/data/demo", (_req, res) => res.json(resetDemo()));
router.post("/data/upload", (req, res) => {
  if (typeof req.body !== "string") {
    res.status(400).json({ error: "Upload a CSV file as text/csv." });
    return;
  }
  try {
    res.json(loadCsv(req.body));
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Invalid CSV." });
  }
});
router.get("/analysis", (_req, res) => res.json(getAnalysis()));
router.get("/models", (_req, res) => res.json(compareModels()));
router.get("/routes", (_req, res) => {
  const prediction = predict({ hour: 8, rainfall: 2.4, temperature: 25, isHoliday: false, specialEvent: false, demandMultiplier: 1 });
  res.json(insights(prediction.routes));
});
router.post("/prediction", (req, res) => {
  const parsed = PredictDemandBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  res.json(predict(parsed.data));
});
router.post("/risk", (req, res) => {
  const parsed = CalculateRiskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  res.json(calculateRisk(parsed.data.predictions, parsed.data.availableBuses, parsed.data.busCapacity));
});
router.post("/optimization", (req, res) => {
  const parsed = SolveOptimizationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  res.json(solveOptimization(parsed.data.predictions, parsed.data.availableBuses, parsed.data.busCapacity, parsed.data.minBusesPerRoute, parsed.data.maxBusesPerRoute));
});
router.post("/simulation", (req, res) => {
  const parsed = RunSimulationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  res.json(runSimulation(parsed.data));
});
router.post("/ai/explain", (req, res) => {
  const parsed = ExplainResultsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  res.json(explain(parsed.data.topic, parsed.data.evidence));
});

export default router;