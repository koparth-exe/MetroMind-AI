/**
 * MetroMind AI — Guided Tutorial Mode
 *
 * Architecture:
 *   TutorialContext  — shared state (step index, active flag)
 *   TutorialProvider — mounts at App root; wraps children
 *   useTutorial()    — hook for any component to start/control the tutorial
 *   TutorialOverlay  — the actual rendered overlay (inside Router so it can navigate)
 *
 * Tutorial steps: 11 pages in the order defined in TUTORIAL_STEPS.
 * Navigation: automatic route change on Next/Previous via wouter useLocation.
 * Keyboard: Escape exits; Tab cycles within card (focus trap).
 * Accessibility: role="dialog", aria-modal, aria-label, focus management.
 * Motion: respects prefers-reduced-motion — transitions set to 0ms via existing CSS.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, ArrowRight, BookOpen, CheckCheck, GraduationCap, X } from 'lucide-react';

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

interface TutorialStep {
  route: string;
  title: string;
  subtitle: string;
  body: string;
  tip?: string;
  sections?: Array<{ label: string; selector: string }>;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    route: '/',
    title: 'Overview · Command Center',
    subtitle: 'AI Transportation Operations Command Center for Mumbai Transit.',
    body: 'The Overview page is the flagship real-time command center for Mumbai transportation surveillance.\n\nA. Network Context & Header: The top navigation confirms your location (METROMIND / MONITOR / OVERVIEW), provides the segmented transport toggle to switch between Suburban Railway and BEST Bus networks, and validates the active timetable dataset (MMR_TRANSIT_2026 or BEST_TRANSIT_2026).\n\nB. Command Center Hero: Establishes operational state at a glance. The pulsing beacon verifies service calibration, while the "Refresh signal" button refetches real-time timetable observations and forecasts.\n\nC. Core Network Telemetry: 5 high-density signal cards report Records Analyzed (validated timetable rows), Network Footprint (active lines and stations), Forecast Peak Load (passenger volume against baseline), Risk Surveillance (high-risk corridor count and average network utilization), and Fleet Deployment (available vs advised vehicles).\n\nD. 24-Hour Demand Trajectory: Compares hourly forecast passenger demand (solid line) against historical baseline (dashed line). Morning and evening commute crests are flagged dynamically. Hover or touch anywhere on the chart to scrub through all 24 hourly timesteps and inspect real-time variance (+/-%) in the HUD.\n\nE. Risk Distribution: Evaluates route vulnerability across Low, Medium, High, and Critical regimes with semantic colors (mint, amber, coral, crimson). The central ring displays the network average capacity utilization.\n\nF. Route Attention Watchlist: Corridors are ranked by operational urgency. Review forecast demand, overcrowding probability, capacity utilization bars, and vehicle buffer adjustments. Clicking any route focuses and isolates it across the overview.\n\nG. Mumbai Spatial Topology: Live OpenStreetMap integration displays active geographic corridor polylines and station nodes. Selecting a route in the watchlist highlights it on the map, and clicking a line or station on the map synchronizes back to the watchlist.\n\nH. Operational Signal Synthesis: A deterministic operational briefing synthesizes bottleneck constraints and recommends vehicle reallocation protocols directly from live mathematical data — without fabricated output.\n\nI. Recent Operations Log: An audit stream of recent analytical events, including timetable ingest, rainfall sensitivity sweeps, and model recalibrations.\n\nJ. Operational Workflow Dispatch: Four fast-action triage cards route directly into downstream workspaces: Predictive Modeling (/prediction), Risk Assessment (/risk), Fleet Optimization (/optimization), and Disruption Simulation (/simulator).',
    tip: 'Switch between Railway and Bus modes in the header control to evaluate each transit grid independently, or click any corridor card in the Route Watchlist to isolate its route geometry on the Mumbai map.',
    sections: [
      { label: 'Mode Control', selector: '[data-testid="control-transport-mode"]' },
      { label: 'Command Hero', selector: '[aria-label="Network Command Context"]' },
      { label: 'Telemetry', selector: '[aria-label="Core Network Telemetry"]' },
      { label: '24h Demand Chart', selector: '[data-testid="chart-demand-signal"]' },
      { label: 'Risk Distribution', selector: '[aria-label="Network Risk & Health Distribution"]' },
      { label: 'Route Watchlist', selector: '[aria-label="Route Attention & Watchlist"]' },
      { label: 'Spatial Topology', selector: '[aria-label="Mumbai Spatial Network Context"]' },
      { label: 'Signal & Audit Log', selector: '[aria-label="Analytical Intelligence Signal & Operational Activity"]' },
      { label: 'Workflow Dispatch', selector: '[aria-label="Workflow Actions"]' },
    ],
  },
  {
    route: '/passenger',
    title: 'Passenger Flow & Crowding Intelligence',
    subtitle: 'High-density passenger demand surveillance and capacity headroom monitoring.',
    body: 'The Passenger View answers: "Where are passengers experiencing the greatest demand and crowding right now, and how is that changing across the network?"\n\nA. Passenger Command Header: Confirms the active network scope (Railway vs Bus), displays real-time flow status, links to the active timetable dataset, and allows live signal refreshes.\n\nB. Passenger Telemetry Grid: 5 operational signals track Total Hourly Demand (aggregate hourly arrival rate across corridors), Peak Inflow Surge (maximum hourly passenger arrival rate), Crowding Pressure (corridors in Critical/High regimes vs average utilization), Busiest Corridor (top passenger volume route), and Primary Transfer Hub (interchange station carrying the greatest corridor connectivity).\n\nC. 24-Hour Passenger Flow Curve: Hourly passenger boarding volume across all 24 diurnal timesteps. Visualizes morning and evening peak commute crests with independent peak timestamps. Interactive scrubbing displays exact hourly volume and delta against daily mean.\n\nD. Crowding & Headroom Analysis: Evaluates capacity headroom per corridor. Visualizes spare seat capacity vs overcrowding deficit, semantic crowding classification (Low, Moderate, High, Critical), and Gaussian exceedance probability P(demand > capacity).\n\nE. Corridor Priority Watchlist: Operational ranking of transit corridors by passenger volume. Displays corridor route ID, start/end terminal stations, peak passenger volume, and capacity status.\n\nF. Spatial Passenger Context: Real-time Mumbai transit topology highlighting active transit corridors and station nodes. Selecting a corridor highlights its route geometry across Mumbai.\n\nG. Journey Crowding Lookup: Commuter departure planner powered by the active ML model. Generates expected passenger boardings, confidence interval bands, and shoulder-window departure suggestions.\n\nH. Operational Passenger Takeaway: Deterministic mathematical briefing synthesizing peak demand distribution and capacity surplus/deficit directly from timetable telemetry.',
    tip: 'Select any corridor in the ranking or on the map to filter passenger flow geometry, or test departure windows in the Journey Lookup tool to find shoulder windows with spare capacity.',
    sections: [
      { label: 'Mode Control', selector: '[data-testid="control-transport-mode"]' },
      { label: 'Command Header', selector: '[aria-label="Passenger Flow Command Context"]' },
      { label: 'Passenger Telemetry', selector: '[aria-label="Passenger Network Telemetry"]' },
      { label: '24h Flow Chart', selector: '[data-testid="chart-passenger-flow"]' },
      { label: 'Crowding & Headroom', selector: '[aria-label="Corridor Crowding & Headroom"]' },
      { label: 'Corridor Priority', selector: '[aria-label="Passenger Corridor Ranking"]' },
      { label: 'Spatial Flow Map', selector: '[aria-label="Passenger Spatial Flow"]' },
      { label: 'Journey Lookup', selector: '[aria-label="Journey Crowding Lookup"]' },
      { label: 'Operational Takeaway', selector: '[aria-label="Operational Passenger Takeaway"]' },
    ],
  },
  {
    route: '/data',
    title: 'Data Intake & Quality Control',
    subtitle: 'Telemetry pipeline ingestion, schema validation, and quality gate surveillance.',
    body: 'The Data Intake page is the operational entry point for MetroMind AI, governing the ingest and validation of timetable observation streams.\n\nA. Command Header: Confirms active transit mode (Suburban Railway vs BEST Bus), live pipeline validation status beacon, quick "Load Demo Baseline" trigger, and signal refresh.\n\nB. Active Dataset Status Banner: Instantly displays what data MetroMind is evaluating. Reports dataset identity (MMR_TRANSIT_2026 / BEST_TRANSIT_2026 / custom CSV), mode provenance, total records (2,688), network corridors (4), stations (16), and observation window (28 calendar days).\n\nC. Data Ingestion Workspace: Professional drag-and-drop CSV upload zone. Supports UTF-8 encoded transit observations, validates required schema invariants, and provides real-time state feedback (uploading, validating, success toast, or structured error diagnostics).\n\nD. Quality Gate & Telemetry: Real-time validation metrics showing total ingested rows, 100% accepted clean records, zero missing null values, zero schema violations, average demand rates, and peak surge capacity.\n\nE. Schema & Field Inspection: Interactive 10-column contract specification detailing all required columns (timestamp, route_id, station_id, passenger_count) and exogenous covariates (temperature, rainfall, special_event, day_of_week, is_weekend, is_holiday) with analytical roles.\n\nF. Demonstration Datasets: Ready-to-use canonical benchmark files with direct one-click CSV download and one-click baseline activation.\n\nG. Next-Step Workflow Dispatch: Direct operational dispatch into downstream analytics (Analysis, Prediction, Risk, Fleet Optimization, Simulator, Passenger View).',
    tip: 'Download a canonical demo CSV to inspect its schema offline, introduce custom stress scenarios, and drop it back into the workspace to observe downstream model recalibration.',
    sections: [
      { label: 'Mode Control', selector: '[data-testid="control-transport-mode"]' },
      { label: 'Command Header', selector: '[aria-label="Data Ingestion Command Context"]' },
      { label: 'Active Dataset', selector: '[aria-label="Active Dataset Pipeline Status"]' },
      { label: 'Upload Workspace', selector: '[aria-label="Data Ingestion Workspace"]' },
      { label: 'Quality Gate', selector: '[aria-label="Data Quality Gate"]' },
      { label: 'Schema Contract', selector: '[aria-label="Data Schema & Field Inspection"]' },
      { label: 'Demo Benchmarks', selector: '[aria-label="Demonstration Datasets"]' },
      { label: 'Workflow Dispatch', selector: '[aria-label="Pipeline Workflow Dispatch"]' },
    ],
  },
  {
    route: '/analysis',
    title: 'Statistical Intelligence Workbench',
    subtitle: 'Measure relationships, trends, and periodic structure behind passenger demand.',
    body: 'The Analysis workbench provides mathematical evidence on what governs demand before moving to Prediction and Risk:\n\n1. Statistical Signal: The headline hero establishes the strongest correlation feature, dominant Fourier periodic cycle, OLS goodness-of-fit (R²), and the top held-out estimator.\n\n2. Correlation Analysis: Evaluates both Pearson (linear association) and Spearman (monotonic rank association) coefficients across departure hour, temperature, rainfall, and holiday flags with diverging magnitude bars.\n\n3. Regression Evidence: Displays the empirical OLS demand equation, R² variance explained, marginal feature slopes (β), and theoretical variance formulas.\n\n4. Temporal Periodicity: Discrete Fast Fourier Transform (FFT) reveals harmonic energy across 8 spectrum frequencies alongside a 7-day diurnal actual vs. sinusoidal fitted curve.\n\n5. Model Evidence: Cross-model benchmark comparing Linear Regression, Random Forest, and Gradient Boosting on held-out test records across MAE, RMSE, and R².\n\n6. What the Data Says: Grounded mathematical synthesis translating correlation, periodic structure, and model fit into clear operational takeaways.\n\n7. Workflow Progression: Guides the analytical flow through Understand → Fit → Detect → Compare → Forecast, routing directly into Prediction.',
    tip: 'Spearman correlation measures monotonic rank association and is robust against non-linear peaks, whereas Pearson measures strictly linear relationships.',
    sections: [
      { label: 'Mode Control', selector: '[data-testid="control-transport-mode"]' },
      { label: 'Command Header', selector: '[aria-label="Analysis Command Context"]' },
      { label: 'Statistical Signal', selector: '#analysis-primary-signal' },
      { label: 'Correlation', selector: '#analysis-correlation' },
      { label: 'Regression', selector: '#analysis-regression' },
      { label: 'Periodicity (FFT)', selector: '#analysis-periodicity' },
      { label: 'Model Evidence', selector: '#analysis-model-evidence' },
      { label: 'Interpretation', selector: '#analysis-interpretation' },
      { label: 'Continue to Prediction', selector: '#analysis-progression' },
    ],
  },
  {
    route: '/prediction',
    title: 'Demand Forecasting Workbench',
    subtitle: 'Estimate future passenger pressure and prediction bounds across the transit network.',
    body: 'The Prediction workbench answers: "Given what we know from historical data, what demand is likely to occur next?"\n\nA. Command Header: Displays active network scope (Suburban Railway vs BEST Bus), active timetable dataset, calibration beacon, and active mathematical model.\n\nB. Scenario Control Workstation: Set exogenous planning conditions — target date, departure hour with quick commute crest presets (09:00, 13:00, 18:00, 22:00), rainfall, temperature, demand multiplier, holiday schedules, special event surges, and forecasting estimator selection.\n\nC. Primary Forecast Hero: Dominant projected passenger demand readout with historical delta (+/- pax/h and %), baseline comparison, and condition chips. Focuses on total network aggregate or an isolated corridor.\n\nD. 95% Prediction Interval Band: Visualizes the parametric prediction interval (±1.96σ) derived from held-out residual standard deviation, establishing explicit mathematical bounds rather than artificial certainty.\n\nE. Corridor Demand Breakdown: Multi-corridor cross-sectional forecasts comparing predicted volume against historical baseline, relative corridor load bars, and click-to-focus corridor isolation.\n\nF. Model Evidence & Calibration: Holdout evaluation metrics (MAE, RMSE, R²) for candidate models, validating why the champion model was chosen.\n\nG. Mathematical Interpretation: Deterministic analytical briefing synthesizing volume pinch points, surge rates, and weather sensitivities directly from API results.\n\nH. Operational Attention & Risk: Highlights critical corridors requiring surveillance and transitions directly into Phase 8G (Risk) to evaluate capacity exceedance probability.',
    tip: 'Use the quick commute presets in the scenario workstation to simulate morning or evening rush hours, or click any corridor card to isolate its specific demand and prediction interval envelope.',
    sections: [
      { label: 'Mode Control', selector: '[data-testid="control-transport-mode"]' },
      { label: 'Command Header', selector: '#prediction-header' },
      { label: 'Scenario Controls', selector: '#prediction-controls' },
      { label: 'Forecast Hero', selector: '#prediction-hero' },
      { label: 'Uncertainty Band', selector: '#prediction-uncertainty' },
      { label: 'Corridor Forecasts', selector: '#prediction-breakdown' },
      { label: 'Model Evidence', selector: '#prediction-model-context' },
      { label: 'Interpretation', selector: '#prediction-interpretation' },
      { label: 'Continue to Risk', selector: '#prediction-attention' },
    ],
  },
  {
    route: '/risk',
    title: 'Capacity Exceedance Workbench',
    subtitle: 'Translate forecast passenger demand into capacity exposure, overload probability, and operational risk.',
    body: 'The Risk workbench addresses: "How likely is predicted demand to create a capacity problem, and how severe is that exposure?"\n\n1. Command Header: Authoritative telemetry validates the active transport network (Suburban Railway vs BEST Bus), active timetable dataset, champion model, and residual uncertainty (±σ pax/h). Use the Fleet Assumptions panel to adjust available vehicles and nominal capacity per vehicle, then click "Recalculate Risk".\n\n2. Network Risk Status: The dominant hero card reports the overall network risk score (0–100) and categorical exposure tier (LOW, MEDIUM, HIGH, CRITICAL), supported by four key metrics: Capacity Utilization, Overload Probability, Predicted Demand, and Available Capacity.\n\n3. Risk Score Scale: Visual segmented continuous gauge mapping the composite score against calibrated thresholds (0–25 Low, 25–50 Medium, 50–75 High, 75–100 Critical) with dynamic needle positioning and elevation callouts.\n\n4. Utilization vs. Overload Probability: Crucial analytical contrast distinguishing directly observable volume loading (60% weight) from stochastic Gaussian tail risk (40% weight). Probabilities between 0% and 0.5% are displayed as "<1%" to ensure small tail exposures remain legible.\n\n5. Corridor Risk Matrix: Interactive operational drill-down displaying all network corridors with predicted demand, assigned capacity, utilization progress, tail probability, composite risk score, and risk badge. Click any corridor row to isolate its telemetry across the workbench.\n\n6. Risk Distribution: Dynamic breakdown showing exact corridor counts and percentage shares across Critical, High, Medium, and Low severity regimes.\n\n7. Highest Exposure Spotlight: Automatically isolates the primary operational pinch point (e.g., Central Line R1), analyzing peak demand, nominal capacity deficit, and why it commands priority fleet attention.\n\n8. Mathematical Basis & Strategic Briefing: Full mathematical transparency displaying composite equations, normal survival functions, and deterministic briefings guiding immediate transit actions.\n\n9. Continue to Optimization: Direct transition into Phase 8H to solve constrained integer programming vehicle reallocations.',
    tip: 'Never equate capacity utilization directly with risk score — high utilization with tight residual uncertainty preserves a low overload probability, while wide dispersion can elevate risk even at moderate utilization.',
    sections: [
      { label: 'Mode Control', selector: '[data-testid="control-transport-mode"]' },
      { label: 'Command Header', selector: '#risk-header' },
      { label: 'Network Risk', selector: '#risk-network-status' },
      { label: 'Risk Scale', selector: '#risk-score-scale' },
      { label: 'Util vs Probability', selector: '#risk-util-prob' },
      { label: 'Corridor Matrix', selector: '#risk-corridor-matrix' },
      { label: 'Risk Distribution', selector: '#risk-distribution' },
      { label: 'Highest Exposure', selector: '#risk-exposure' },
      { label: 'Methodology', selector: '#risk-methodology' },
      { label: 'Continue to Optimization', selector: '#risk-progression' },
    ],
  },
  {
    route: '/optimization',
    title: 'Fleet Optimization Workbench',
    subtitle: 'Constrained greedy marginal allocation balancing residual overcrowding against unused capacity.',
    body: 'The Optimization workbench answers: "Given predicted passenger demand and available fleet constraints, how should vehicles be allocated across routes?"\n\n1. Command Header: Validates active transport mode (Suburban Railway vs BEST Bus), authoritative timetable dataset, and calibration status.\n\n2. Resource Context: Establishes total predicted network demand and nominal fleet capacity before adjusting constraints.\n\n3. Constraint Workbench: Interactively adjust available fleet pool, single-vehicle passenger capacity, and per-corridor minimum and maximum bounds.\n\n4. Feasibility Gate: Real-time validator ensuring fleet constraints are mathematically solvable (Available Fleet ≥ Route Count × Min/Route). Disables execution and provides instant remediation shortcuts if infeasible.\n\n5. 2.5D Allocation Blueprint: Lightweight 2.5D operational blueprint of Mumbai transit corridors displaying allocated fleet quotas, capacity coverage, and terminal envelopes.\n\n6. Capacity vs. Demand Breakdown: Route-by-route visualization showing predicted demand markers against allocated vehicle capacity bars.\n\n7. Before → After Allocation Matrix: Authoritative decision cockpit comparing baseline 1-vehicle allocations against optimized recommendations with prominent delta indicators.\n\n8. Mathematical Objective & Heuristic Explainer: Transparent breakdown of the constrained greedy marginal allocation algorithm and the objective function (minimizing overcrowding + 5% unused capacity penalty).\n\n9. Continue to Simulator: Seamlessly transition into Phase 8I to stress-test recommended fleet allocations under disruptive weather and demand conditions.',
    tip: 'Adding vehicles is not always optimal — the solver applies a 5% penalty to surplus unused capacity to prevent deploying empty vehicles on low-demand corridors.',
    sections: [
      { label: 'Mode Control', selector: '[data-testid="control-transport-mode"]' },
      { label: 'Command Header', selector: '#optimization-header' },
      { label: 'Resource Context', selector: '#optimization-context-hero' },
      { label: 'Constraint Controls', selector: '#optimization-workbench' },
      { label: 'Feasibility Gate', selector: '#optimization-feasibility-gate' },
      { label: '2.5D Blueprint', selector: '#optimization-spatial-network' },
      { label: 'Capacity Visualizer', selector: '#optimization-capacity-visual' },
      { label: 'Allocation Matrix', selector: '#optimization-matrix' },
      { label: 'Solver Explainer', selector: '#optimization-explainer' },
      { label: 'Simulator Progression', selector: '#optimization-progression' },
    ],
  },
  {
    route: '/simulator',
    title: 'Scenario Simulator',
    subtitle: 'Stress-test transit demand and service capacity under changing operating conditions.',
    body: 'The Simulator runs a what-if scenario analysis: you adjust exogenous factors (rainfall, temperature, demand multiplier, or suspend a corridor), and MetroMind recalculates network demand, capacity saturation, and residual unserved passengers against the nominal timetable baseline.\n\n1. Command Header: Displays active transport mode (Suburban Railway vs BEST Bus), active timetable dataset, and calibration status.\n\n2. Scenario Presets: Quick-action operational archetypes (Nominal Baseline, Monsoon Downpour, Peak Commute Crest, Major Festival Surge, Mainline Disruption) with one-click reset.\n\n3. Parameter Workstation: Fine-tune linear rainfall attenuation (0–80mm), thermal sensitivity (10–40°C), demand multipliers (0.5–2.5x), and select corridor suspensions.\n\n4. Impact Overview: Multi-dimensional telemetry hero comparing baseline vs simulated demand, service capacity, residual overcrowding, and exceedance risk.\n\n5. Scenario Response: 2D comparative bar visualizer contrasting route-by-route volume shifts against capacity thresholds.\n\n6. Route Stress Matrix: Authoritative sortable corridor matrix showing exact passenger deltas, capacity saturation, and operational risk bands.\n\n7. Mathematical Model: Transparent breakdown of the compound linear scalar equations and Gaussian exceedance formulation.\n\n8. Decision Progression: Return to Fleet Optimization (8H) or proceed forward to Model Inspection (8J).',
    tip: 'Clicking a preset prepares the parameter workstation but does not auto-execute — click "Run Scenario Simulation" to evaluate. Corridor suspension isolates local throughput; passenger redistribution is not modeled.',
    sections: [
      { label: 'Command Header', selector: '#simulator-header' },
      { label: 'Scenario Presets', selector: '#simulator-presets' },
      { label: 'Parameter Workstation', selector: '#simulator-controls' },
      { label: 'Impact Overview', selector: '#simulator-context-hero' },
      { label: 'Scenario Response Graph', selector: '#simulator-response-chart' },
      { label: 'Route Stress Matrix', selector: '#simulator-route-matrix' },
      { label: 'Mathematical Model', selector: '#simulator-explainer' },
      { label: 'Workflow Dispatch', selector: '#simulator-progression' },
    ],
  },
  {
    route: '/models',
    title: 'Models',
    subtitle: 'Understand which model is active and why.',
    body: 'The Models page shows a side-by-side comparison of three estimators trained on the same 80/20 chronological train/test split:\n\n• Linear Regression — interpretable baseline, assumes linear feature-demand relationships.\n• Random Forest — ensemble of 100 trees, no distributional assumptions.\n• Gradient Boosting — sequential additive model, typically lowest RMSE on this dataset.\n\nMetrics: MAE (mean absolute error, same unit as demand), RMSE (penalises large errors more), R² (proportion of variance explained; 1.0 = perfect).\n\nHow to use: The "active" badge marks the best model by lowest held-out RMSE. Low R² (< 0.5) usually means the dataset is too short or too noisy.',
    tip: 'Model selection uses held-out test data (the last 20% chronologically) — never training data — to prevent leakage.',
  },
  {
    route: '/routes',
    title: 'Routes',
    subtitle: 'Explore the network geographically.',
    body: "The Routes page overlays Mumbai's corridor map with per-route risk indicators. Each polyline is colour-coded by risk level. Click any route to see its metrics: predicted demand, capacity, utilisation, overcrowding probability, and recommended vs. baseline fleet.\n\nHow to use: Use the route list on the left to filter or jump to a specific corridor. The map gives spatial context — routes sharing interchange stations tend to have correlated risk peaks. Use the geospatial view to identify bottleneck stations that appear in multiple high-risk routes.",
    tip: 'The map tiles adjust to dark mode automatically — toggle the theme in the sidebar to check both views.',
  },
  {
    route: '/insights',
    title: 'Insights',
    subtitle: 'Mathematical evidence + Gemini operational review.',
    body: 'Insights has two distinct layers:\n\n1. Mathematical evidence — hard numbers computed from the dataset: top correlations, model performance, risk distribution, and optimization outcome. These are always present and do not depend on any external AI service.\n\n2. Gemini operational review — when the Gemini API is configured and reachable, the AI synthesises the mathematical evidence into an executive-level operational narrative. This is clearly labelled as AI-generated.\n\nHow to use: Start with the mathematical evidence — it is the ground truth. The Gemini review adds narrative interpretation but should never override your own reading of the data. If the API is unavailable, a deterministic local summary is shown instead.',
    tip: 'The "configured: true" badge in the Insights header confirms the Gemini API connection is active.',
  },
];

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface TutorialContextValue {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  startTutorial: (step?: number) => void;
  exitTutorial: () => void;
  nextStep: () => void;
  previousStep: () => void;
}

const TutorialContext = createContext<TutorialContextValue | null>(null);

export function useTutorial(): TutorialContextValue {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error('useTutorial must be used within TutorialProvider');
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const startTutorial = useCallback((step?: number) => {
    if (typeof step === 'number') {
      setCurrentStep(step);
    } else {
      const idx = TUTORIAL_STEPS.findIndex((s) => s.route === window.location.pathname);
      setCurrentStep(idx >= 0 ? idx : 0);
    }
    setIsActive(true);
  }, []);

  const exitTutorial = useCallback(() => {
    setIsActive(false);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((s) => {
      const next = s + 1;
      if (next >= TUTORIAL_STEPS.length) {
        setIsActive(false);
        return s;
      }
      return next;
    });
  }, []);

  const previousStep = useCallback(() => {
    setCurrentStep((s) => Math.max(0, s - 1));
  }, []);

  const value: TutorialContextValue = {
    isActive,
    currentStep,
    totalSteps: TUTORIAL_STEPS.length,
    startTutorial,
    exitTutorial,
    nextStep,
    previousStep,
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Overlay (rendered inside WouterRouter so useLocation works)
// ---------------------------------------------------------------------------

export function TutorialOverlay() {
  const { isActive, currentStep, totalSteps, exitTutorial, nextStep, previousStep } = useTutorial();
  const [, navigate] = useLocation();
  const cardRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const step = TUTORIAL_STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  // Navigate to the step's route whenever the step changes while active
  useEffect(() => {
    if (!isActive || !step) return;
    navigate(step.route);
  }, [isActive, currentStep, step, navigate]);

  // Focus the close button when the overlay becomes active or step changes
  useEffect(() => {
    if (!isActive) return;
    const tid = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 120);
    return () => clearTimeout(tid);
  }, [isActive, currentStep]);

  // Escape to exit
  useEffect(() => {
    if (!isActive) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        exitTutorial();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isActive, exitTutorial]);

  // Focus trap inside the card
  useEffect(() => {
    if (!isActive) return;
    const card = cardRef.current;
    if (!card) return;
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = Array.from(
        card.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute('disabled'));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isActive]);

  if (!isActive || !step) return null;

  const progressPercent = ((currentStep + 1) / totalSteps) * 100;

  return (
    <>
      {/* Dim backdrop — clicking it exits the tutorial */}
      <div
        className="tutorial-backdrop"
        aria-hidden="true"
        onClick={exitTutorial}
      />

      {/* Floating tutorial card */}
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Tutorial step ${currentStep + 1} of ${totalSteps}: ${step.title}`}
        className="tutorial-card"
      >
        {/* Header */}
        <div className="tutorial-card-header">
          <div className="flex items-center gap-2.5">
            <div className="tutorial-icon-badge">
              <GraduationCap size={14} strokeWidth={2.2} aria-hidden="true" />
            </div>
            <div>
              <div className="tutorial-eyebrow">Guided Tour</div>
              <div className="tutorial-step-label">{step.title}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="tutorial-progress-label"
              aria-label={`Step ${currentStep + 1} of ${totalSteps}`}
            >
              {currentStep + 1} / {totalSteps}
            </span>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={exitTutorial}
              aria-label="Exit tutorial"
              className="tutorial-close-btn"
            >
              <X size={14} strokeWidth={2.4} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div
          className="tutorial-progress-track"
          role="progressbar"
          aria-valuenow={currentStep + 1}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-label="Tutorial progress"
        >
          <div
            className="tutorial-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Body */}
        <div className="tutorial-card-body">
          <p className="tutorial-subtitle">{step.subtitle}</p>
          {step.sections && step.sections.length > 0 && (
            <div className="mb-4 rounded-xl border border-sidebar-border/70 bg-sidebar-accent/30 p-2.5">
              <div className="mb-1.5 font-mono-ui text-[9px] font-bold uppercase tracking-wider text-sidebar-primary">
                Quick Region Focus:
              </div>
              <div className="flex flex-wrap items-center gap-1.5 font-mono-ui text-[9.5px]">
                {step.sections.map((sec) => (
                  <button
                    key={sec.selector}
                    type="button"
                    onClick={() => {
                      const el = document.querySelector(sec.selector);
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'transition-all');
                        setTimeout(() => {
                          el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
                        }, 2200);
                      }
                    }}
                    className="rounded-md border border-sidebar-border/80 bg-sidebar-accent/60 px-2 py-1 text-sidebar-foreground/85 hover:bg-sidebar-primary/20 hover:text-sidebar-primary transition-colors cursor-pointer"
                  >
                    {sec.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="tutorial-body">
            {step.body.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          {step.tip && (
            <div className="tutorial-tip">
              <BookOpen size={12} className="tutorial-tip-icon shrink-0" aria-hidden="true" />
              <span>{step.tip}</span>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="tutorial-card-footer">
          <button
            type="button"
            onClick={exitTutorial}
            className="tutorial-btn-skip"
          >
            Skip tutorial
          </button>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={previousStep}
                className="tutorial-btn-nav"
                aria-label="Previous step"
              >
                <ArrowLeft size={13} strokeWidth={2.2} aria-hidden="true" />
                Previous
              </button>
            )}
            {isLast ? (
              <button
                type="button"
                onClick={exitTutorial}
                className="tutorial-btn-primary"
                aria-label="Finish tutorial"
              >
                <CheckCheck size={13} strokeWidth={2.2} aria-hidden="true" />
                Finish Tutorial
              </button>
            ) : (
              <button
                type="button"
                onClick={nextStep}
                className="tutorial-btn-primary"
                aria-label={`Next: ${TUTORIAL_STEPS[currentStep + 1]?.title ?? 'next step'}`}
              >
                Next
                <ArrowRight size={13} strokeWidth={2.2} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
