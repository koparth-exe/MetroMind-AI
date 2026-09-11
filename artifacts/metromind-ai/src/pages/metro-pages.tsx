import { useState, useEffect, useMemo } from 'react';
import { Link } from 'wouter';
import ReactMarkdown from 'react-markdown';
import {
  useGetDashboard,
  useGetDataSummary,
  useLoadDemoDataset,
  useUploadDataset,
  useGetAnalysis,
  usePredictDemand,
  useCompareModels,
  useCalculateRisk,
  useSolveOptimization,
  useRunSimulation,
  useGetRoutes,
  useExplainInsights,
} from '@workspace/api-client-react';
import type {
  Analysis,
  Dashboard,
  DataSummary,
  PredictionResult,
  PredictionRoute,
  RiskResult,
  OptimizationResult,
  SimulationResult,
  RouteInsight,
} from '@workspace/api-client-react';
import {
  ArrowUpRight,
  BarChart3,
  Check,
  CircleAlert,
  CloudUpload,
  FlaskConical,
  GraduationCap,
  Info,
  LoaderCircle,
  Play,
  RefreshCw,
  Sigma,
  Sparkles,
  Target,
  Upload,
  Waypoints,
} from 'lucide-react';
import {
  Button,
  PageIntro,
  Panel,
  QueryState,
  RiskBadge,
  Skeleton,
  Stat,
  useTransportMode,
  InsetPanel,
} from '@/components/metro-shell';
import { useTutorial } from '@/components/tutorial-overlay';
import { calculateCapacityCoverage } from '@/lib/capacity-coverage';
import { MumbaiMap } from '@/components/mumbai-map';

const demoRoutes: RouteInsight[] = [
  { routeId: 'R1', name: 'Central Line', color: '#ef4444', predictedDemand: 5100, historicalAverage: 3500, capacity: 3000, utilization: 1.7, overcrowdingProbability: 0.92, risk: 'High', recommendedBuses: 2, baselineBuses: 1, stations: ['CSMT', 'Dadar', 'Kurla', 'Thane'], coordinates: [[18.94, 72.8352], [19.0178, 72.8438], [19.0664, 72.8801], [19.186, 72.9759]] },
  { routeId: 'R2', name: 'Western Line', color: '#3b82f6', predictedDemand: 4950, historicalAverage: 3400, capacity: 3000, utilization: 1.65, overcrowdingProbability: 0.89, risk: 'High', recommendedBuses: 2, baselineBuses: 1, stations: ['Dadar', 'Bandra', 'Andheri', 'Borivali'], coordinates: [[19.0178, 72.8438], [19.0544, 72.8406], [19.1197, 72.8468], [19.2307, 72.8567]] },
  { routeId: 'R3', name: 'Harbour Line', color: '#facc15', predictedDemand: 4250, historicalAverage: 3000, capacity: 3000, utilization: 1.42, overcrowdingProbability: 0.72, risk: 'High', recommendedBuses: 2, baselineBuses: 1, stations: ['CSMT', 'Kurla', 'Vashi', 'Panvel'], coordinates: [[18.94, 72.8352], [19.0664, 72.8801], [19.0745, 72.9986], [18.9902, 73.1172]] },
  { routeId: 'R4', name: 'Trans-Harbour Line', color: '#f97316', predictedDemand: 3600, historicalAverage: 2600, capacity: 3000, utilization: 1.2, overcrowdingProbability: 0.58, risk: 'Medium', recommendedBuses: 2, baselineBuses: 1, stations: ['Thane', 'Airoli', 'Vashi'], coordinates: [[19.186, 72.9759], [19.1513, 72.9932], [19.0745, 72.9986]] },
];

const demoBusRoutes: RouteInsight[] = [
  { routeId: 'B1', name: 'Colaba-Worli feeder', color: '#06b6d4', predictedDemand: 82, historicalAverage: 75, capacity: 70, utilization: 1.17, overcrowdingProbability: 0.65, risk: 'Medium', recommendedBuses: 2, baselineBuses: 1, stations: ['Regal', 'Churchgate', 'Haji Ali', 'Worli Depot'], coordinates: [[18.9220, 72.8310], [18.9322, 72.8264], [18.9774, 72.8125], [19.0144, 72.8182]] },
  { routeId: 'B2', name: 'Bandra-BKC express', color: '#10b981', predictedDemand: 95, historicalAverage: 80, capacity: 70, utilization: 1.36, overcrowdingProbability: 0.82, risk: 'High', recommendedBuses: 2, baselineBuses: 1, stations: ['Bandra Station', 'Kalanagar', 'BKC Connector', 'BKC Diamond Market'], coordinates: [[19.0544, 72.8406], [19.0600, 72.8470], [19.0650, 72.8550], [19.0680, 72.8680]] },
  { routeId: 'B3', name: 'Andheri-SEEPZ link', color: '#8b5cf6', predictedDemand: 88, historicalAverage: 72, capacity: 70, utilization: 1.26, overcrowdingProbability: 0.74, risk: 'High', recommendedBuses: 2, baselineBuses: 1, stations: ['Andheri East', 'Chakala', 'Marol Naka', 'SEEPZ Gate 1'], coordinates: [[19.1197, 72.8468], [19.1130, 72.8610], [19.1080, 72.8730], [19.1230, 72.8810]] },
  { routeId: 'B4', name: 'Borivali-Kandivali east', color: '#f59e0b', predictedDemand: 65, historicalAverage: 60, capacity: 70, utilization: 0.93, overcrowdingProbability: 0.35, risk: 'Low', recommendedBuses: 1, baselineBuses: 1, stations: ['Borivali Station East', 'Magathane', 'Akurli', 'Kandivali East Depot'], coordinates: [[19.2307, 72.8567], [19.2210, 72.8640], [19.2100, 72.8680], [19.2040, 72.8650]] },
];

const demoDashboard: Dashboard = {
  totalPredictedDemand: 17900,
  highRiskRoutes: 3,
  averageRisk: 0.778,
  availableBuses: 4,
  totalRequiredCapacity: 12000,
  recommendedAdditionalBuses: 4,
  routes: demoRoutes,
  trend: ['00:00','01:00','02:00','03:00','04:00','05:00','06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00'].map((label, i) => ({
    label,
    demand: [720,720,720,720,1440,1440,7560,7560,17900,16500,14000,12200,5500,4700,4200,4400,6000,12200,17100,16000,12500,7200,1400,1400][i],
    baseline: [650,650,650,650,1300,1300,6800,6800,16000,14800,12600,11000,5000,4200,3800,4000,5500,11000,15300,14400,11200,6500,1300,1300][i]
  })),
  riskDistribution: [{ name: 'Low', value: 2 }, { name: 'Medium', value: 2 }, { name: 'High', value: 0 }],
  activity: [
    { title: 'Morning peak forecast refreshed', detail: 'Central and Western corridors are the pressure points', time: '08 min ago' },
    { title: 'Rainfall sensitivity checked', detail: 'Interchange crowding remains elevated on wet days', time: '42 min ago' },
    { title: 'Mumbai network loaded', detail: 'MMR_TRANSIT_2026 · 4 lines · 16 stations', time: 'Yesterday' }
  ],
};

const demoBusDashboard: Dashboard = {
  totalPredictedDemand: 330,
  highRiskRoutes: 2,
  averageRisk: 0.64,
  availableBuses: 4,
  totalRequiredCapacity: 280,
  recommendedAdditionalBuses: 3,
  routes: demoBusRoutes,
  trend: ['00:00','01:00','02:00','03:00','04:00','05:00','06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00'].map((label, i) => ({
    label,
    demand: [12,10,8,8,15,25,85,90,110,95,70,65,55,50,55,60,80,105,115,100,75,45,25,18][i],
    baseline: [10,8,7,7,12,20,75,80,95,85,60,55,48,45,50,55,70,95,100,90,65,40,20,15][i]
  })),
  riskDistribution: [{ name: 'Low', value: 1 }, { name: 'Medium', value: 1 }, { name: 'High', value: 2 }],
  activity: [
    { title: 'Bus feeder forecast refreshed', detail: 'BKC and SEEPZ corridors are the peak pressure points', time: '12 min ago' },
    { title: 'Rainfall sensitivity checked', detail: 'Surface road congestion elevates bus travel time variance', time: '35 min ago' },
    { title: 'Mumbai bus network loaded', detail: 'BEST_TRANSIT_2026 · 4 routes · 16 stops', time: 'Yesterday' }
  ],
};

const demoSummary: DataSummary = {
  datasetName: 'MMR_TRANSIT_2026',
  isDemo: true,
  records: 2688,
  routes: 4,
  stations: 15,
  missingValues: 0,
  invalidValues: 0,
  dateStart: '2026-07-27',
  dateEnd: '2026-08-23',
  averageDemand: 3940,
  maxDemand: 7090,
  quality: 'Excellent',
  columns: ['timestamp', 'route_id', 'station_id', 'passenger_count', 'day_of_week', 'is_weekend', 'is_holiday', 'temperature', 'rainfall', 'special_event']
};

const demoBusSummary: DataSummary = {
  datasetName: 'BEST_TRANSIT_2026',
  isDemo: true,
  records: 2688,
  routes: 4,
  stations: 16,
  missingValues: 0,
  invalidValues: 0,
  dateStart: '2026-07-27',
  dateEnd: '2026-08-23',
  averageDemand: 72,
  maxDemand: 135,
  quality: 'Excellent',
  columns: ['timestamp', 'route_id', 'station_id', 'passenger_count', 'day_of_week', 'is_weekend', 'is_holiday', 'temperature', 'rainfall', 'special_event']
};

const demoAnalysis: Analysis = {
  correlations: [
    { variable: 'hour', pearson: 0.71, spearman: 0.69, strength: 'Strong', interpretation: 'Demand rises consistently through commute windows.' },
    { variable: 'temperature', pearson: 0.18, spearman: 0.22, strength: 'Weak', interpretation: 'Warm days have a modest positive association.' },
    { variable: 'rainfall', pearson: -0.34, spearman: -0.31, strength: 'Moderate', interpretation: 'Rain shifts demand away from surface routes.' },
    { variable: 'is_holiday', pearson: -0.27, spearman: -0.24, strength: 'Moderate', interpretation: 'Holiday schedules suppress commuter peaks.' }
  ],
  regression: {
    equation: 'ŷ = 284.6 + 81.2h − 14.7r + 36.8t',
    r2: 0.74,
    coefficients: [
      { variable: 'hour', coefficient: 81.2 },
      { variable: 'rainfall', coefficient: -14.7 },
      { variable: 'temperature', coefficient: 36.8 }
    ]
  },
  fourier: {
    dominantPeriod: 24,
    peakStrength: 0.81,
    pattern: 'Strong daily periodicity with a secondary weekly harmonic.',
    spectrum: [1, 0.42, 0.18, 0.12, 0.09, 0.07, 0.05, 0.04].map((amplitude, i) => ({ period: i + 1, amplitude })),
    actual: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((label, i) => ({
      label,
      demand: [1120,1240,1290,1260,1380,890,760][i],
      pattern: [1080,1210,1270,1290,1350,920,730][i]
    }))
  },
  formulae: ['ŷ = β₀ + β₁x₁ + ε', 'P(demand > capacity) = 1 − Φ(z)']
};

function getDemoRoutes(mode: 'RAILWAY' | 'BUS'): RouteInsight[] {
  return mode === 'BUS' ? demoBusRoutes : demoRoutes;
}

function getDemoDashboard(mode: 'RAILWAY' | 'BUS'): Dashboard {
  return mode === 'BUS' ? demoBusDashboard : demoDashboard;
}

function getDemoSummary(mode: 'RAILWAY' | 'BUS'): DataSummary {
  return mode === 'BUS' ? demoBusSummary : demoSummary;
}

function predictionsFromRoutes(routes: RouteInsight[]): PredictionRoute[] {
  return routes.map((route) => ({
    routeId: route.routeId,
    predictedDemand: route.predictedDemand,
    historicalAverage: route.historicalAverage,
    difference: route.predictedDemand - route.historicalAverage,
    percentDifference: route.historicalAverage ? ((route.predictedDemand / route.historicalAverage) - 1) * 100 : 0,
    lowerBound: route.predictedDemand * 0.91,
    upperBound: route.predictedDemand * 1.1,
  }));
}

function EmptyNotice({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-8 text-center text-xs text-muted-foreground font-medium">
      {text}
    </div>
  );
}

function ErrorNote({ retry }: { retry?: () => void }) {
  return <QueryState loading={false} error retry={retry} />;
}

function MiniLine({
  values,
  baseline,
  color = 'hsl(var(--primary))',
  baselineColor = 'hsl(var(--accent))',
  fill = false,
}: {
  values: number[];
  baseline?: number[];
  color?: string;
  baselineColor?: string;
  fill?: boolean;
}) {
  const allValues = baseline && baseline.length > 0 ? [...values, ...baseline] : values;
  const max = Math.max(...allValues), min = Math.min(...allValues);
  const range = max - min || 1;
  const points = values.map((v, i) => `${(i / (values.length - 1)) * 100},${92 - ((v - min) / range) * 68}`).join(' ');
  const baselinePoints = baseline && baseline.length > 0
    ? baseline.map((v, i) => `${(i / (baseline.length - 1)) * 100},${92 - ((v - min) / range) * 68}`).join(' ')
    : null;

  const peakVal = Math.max(...values);
  const peakIdx = values.indexOf(peakVal);
  const peakX = (peakIdx / (values.length - 1)) * 100;
  const peakY = 92 - ((peakVal - min) / range) * 68;

  const gradId = useMemo(() => `forecast-grad-${Math.random().toString(36).slice(2, 7)}`, []);

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible select-none">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="65%" stopColor={color} stopOpacity="0.06" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Horizontal grid guide lines at tick levels: max (24), mid (58), baseline (92) */}
      <line x1="0" y1="24" x2="100" y2="24" stroke="hsl(var(--border))" strokeWidth=".5" strokeDasharray="3 3" opacity=".6" />
      <line x1="0" y1="58" x2="100" y2="58" stroke="hsl(var(--border))" strokeWidth=".5" strokeDasharray="3 3" opacity=".6" />
      <line x1="0" y1="92" x2="100" y2="92" stroke="hsl(var(--border))" strokeWidth=".7" opacity=".85" />

      {/* Forecast fill */}
      {fill && <polygon points={`0,92 ${points} 100,92`} fill={`url(#${gradId})`} />}

      {/* Baseline series (dashed accent line) */}
      {baselinePoints && (
        <polyline
          points={baselinePoints}
          fill="none"
          stroke={baselineColor}
          strokeWidth="1.8"
          strokeDasharray="4 3"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity=".85"
        />
      )}

      {/* Forecast series (solid primary line) */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2.4"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Peak marker dot */}
      {fill && (
        <circle
          cx={peakX}
          cy={peakY}
          r="2.2"
          fill={color}
          stroke="hsl(var(--card))"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}

function riskToneClass(name: string): string {
  const r = name.toLowerCase();
  if (r === 'critical') return 'bg-risk-critical';
  if (r === 'high') return 'bg-risk-high';
  if (r === 'medium') return 'bg-risk-medium';
  return 'bg-risk-low';
}

function RouteRows({ routes = demoRoutes }: { routes?: RouteInsight[] }) {
  return (
    <div className="divide-y divide-border/60">
      {routes.map((r) => {
        const utilPct = Math.round(r.utilization * 100);
        return (
          <div
            key={r.routeId}
            className="grid grid-cols-[1fr_auto] items-center gap-3 py-3.5 first:pt-0 last:pb-0 md:grid-cols-[1.5fr_1fr_.9fr_.8fr_auto] transition-colors hover:bg-muted/30 -mx-2 px-2 rounded-lg"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="h-9 w-1.5 rounded-full shrink-0" style={{ background: r.color }} />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm font-bold text-foreground">{r.routeId}</span>
                  <span className="font-sans text-xs font-medium text-muted-foreground truncate">· {r.name}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 font-mono-ui text-[9px] uppercase tracking-wide text-muted-foreground">
                  <span>{r.stations.length} stations</span>
                  <span>·</span>
                  <span className="text-primary font-semibold">{r.recommendedBuses} allocation</span>
                </div>
              </div>
            </div>
            <div className="hidden font-mono-ui text-xs md:block">
              <span className="font-bold text-foreground">{r.predictedDemand.toLocaleString()}</span>{' '}
              <span className="text-muted-foreground text-[10px]">pax</span>
            </div>
            <div className="hidden md:block">
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${utilPct > 100 ? 'bg-accent' : 'bg-primary'}`}
                    style={{ width: `${Math.min(100, utilPct)}%` }}
                  />
                </div>
                <span className="font-mono-ui text-xs text-foreground font-semibold">{utilPct}%</span>
              </div>
            </div>
            <div className="hidden font-mono-ui text-[10px] text-muted-foreground md:block">
              Cap: {r.capacity.toLocaleString()}
            </div>
            <div className="text-right">
              <RiskBadge risk={r.risk} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ConditionField({
  label,
  value,
  onChange,
  min,
  max,
  step = '1',
  suffix,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  min?: string;
  max?: string;
  step?: string;
  suffix?: string;
}) {
  return (
    <label className="block group">
      <span className="font-mono-ui text-[9.5px] uppercase tracking-wider text-muted-foreground group-focus-within:text-primary transition-colors">
        {label}
      </span>
      <div className="mt-1.5 flex items-center rounded-lg border border-input bg-background/90 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 shadow-2xs">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          data-testid={`input-${label.toLowerCase().replaceAll(' ', '-')}`}
          className="w-full bg-transparent px-3 py-2 text-sm font-semibold font-mono-ui text-foreground outline-none"
        />
        {suffix && (
          <span className="pr-3 font-mono-ui text-[10px] font-medium text-muted-foreground select-none">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

export { OverviewPage } from './overview/overview-page';


export { DataPage } from './data/data-page';

export { AnalysisPage } from './analysis/analysis-page';

export { PredictionPage } from './prediction/prediction-page';

export { RiskPage } from './risk/risk-page';


export { OptimizationPage } from './optimization/optimization-page';

function TargetIcon() {
  return <span className="grid place-items-center"><Target size={14} /></span>;
}
export { SimulatorPage } from './simulator/simulator-page';

export function ModelsPage() {
  const { transportMode } = useTransportMode();
  const q = useCompareModels(transportMode);
  const metrics = q.data?.metrics ?? [
    { model: 'Gradient Boosting', mae: transportMode === 'BUS' ? 6.2 : 84.6, rmse: transportMode === 'BUS' ? 8.9 : 121.2, r2: 0.84, isBest: true },
    { model: 'Random Forest', mae: transportMode === 'BUS' ? 7.1 : 96.3, rmse: transportMode === 'BUS' ? 10.4 : 145.8, r2: 0.76, isBest: false },
    { model: 'Seasonal Naive', mae: transportMode === 'BUS' ? 9.5 : 122.5, rmse: transportMode === 'BUS' ? 13.8 : 181.3, r2: 0.61, isBest: false },
  ];

  return (
    <>
      <PageIntro
        eyebrow={`Models / 08 · ${transportMode}`}
        title="Know what you are trusting."
        description={`The selected model is only as good as its holdout. Compare error, fit, and the methodology behind the score for ${transportMode === 'BUS' ? 'Bus' : 'Railway'} transport.`}
        action={<Button onClick={() => q.refetch()} variant="outline" testId="button-refresh-models"><RefreshCw size={14} /> Re-run holdout</Button>}
      />
      {q.isError && <div className="mb-5"><ErrorNote retry={() => q.refetch()} /></div>}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        <Panel title="Model comparison" meta="time-ordered holdout">
          <div className="space-y-3">
            {metrics.map((m) => (
              <div key={m.model} className={`grid gap-3 rounded-xl border p-5 sm:grid-cols-[1.3fr_1fr_1fr_1fr] sm:items-center transition-all ${m.isBest ? 'border-primary/40 bg-primary/[.045] shadow-xs' : 'border-border bg-card/60'}`}>
                <div className="flex items-center gap-3">
                  <div className={`grid h-8 w-8 place-items-center rounded-lg ${m.isBest ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {m.isBest ? <Check size={16} strokeWidth={2.4} /> : <BarChart3 size={15} />}
                  </div>
                  <div>
                    <div className="font-display text-sm font-bold text-foreground">{m.model}</div>
                    {m.isBest && <div className="mt-0.5 font-mono-ui text-[9px] uppercase tracking-wider text-primary font-bold">selected for production</div>}
                  </div>
                </div>
                <div>
                  <div className="font-mono-ui text-[9px] uppercase text-muted-foreground">MAE</div>
                  <div className="mt-1 font-mono-ui text-sm font-bold text-foreground tabular-nums">{m.mae.toFixed(1)}</div>
                </div>
                <div>
                  <div className="font-mono-ui text-[9px] uppercase text-muted-foreground">RMSE</div>
                  <div className="mt-1 font-mono-ui text-sm font-bold text-foreground tabular-nums">{m.rmse.toFixed(1)}</div>
                </div>
                <div>
                  <div className="font-mono-ui text-[9px] uppercase text-muted-foreground">R²</div>
                  <div className="mt-1 font-mono-ui text-sm font-bold text-primary tabular-nums">{m.r2.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Selected model" meta="current">
          <div className="rounded-xl bg-sidebar p-5 text-sidebar-foreground shadow-sm">
            <div className="font-mono-ui text-[9px] uppercase tracking-[.17em] text-sidebar-foreground/45 font-semibold">production forecast</div>
            <div className="mt-3 font-display text-2xl font-bold text-sidebar-primary">{q.data?.selectedModel ?? 'Gradient Boosting'}</div>
            <p className="mt-4 text-xs leading-5 text-sidebar-foreground/75">{q.data?.methodology ?? 'Time-ordered 80/20 holdout. Features are standardized before fitting. Report uncertainty separately from point accuracy.'}</p>
          </div>
          <div className="mt-5 flex items-start gap-3 text-xs leading-5 text-muted-foreground">
            <Info size={15} className="mt-0.5 shrink-0 text-primary" /> Lower MAE is preferable for typical error; RMSE makes rare misses visible.
          </div>
        </Panel>
      </div>
    </>
  );
}

export function RoutesPage() {
  const { transportMode } = useTransportMode();
  const q = useGetRoutes(transportMode);
  const routes = q.data ?? getDemoRoutes(transportMode);
  const [selected, setSelected] = useState(routes[0]?.routeId ?? (transportMode === 'BUS' ? 'B1' : 'R1'));

  useEffect(() => {
    if (routes.length > 0 && !routes.some((r) => r.routeId === selected)) {
      setSelected(routes[0].routeId);
    }
  }, [routes, selected]);

  const active = routes.find((route) => route.routeId === selected) ?? routes[0];
  const unitLabel = transportMode === 'BUS' ? 'buses' : 'train sets';

  return (
    <>
      <PageIntro
        eyebrow={`Routes / 09 · ${transportMode}`}
        title="Read the network as a system."
        description={`Interactive Mumbai geography pairs spatial intuition with the route-level metrics that drive allocation for ${transportMode === 'BUS' ? 'Bus' : 'Railway'}.`}
        action={<Button onClick={() => q.refetch()} variant="outline" testId="button-refresh-routes"><RefreshCw size={14} /> Refresh routes</Button>}
      />
      {q.isError && <div className="mb-5"><ErrorNote retry={() => q.refetch()} /></div>}
      <div className="grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
        <Panel title={`Mumbai ${transportMode === 'BUS' ? 'BEST bus network' : 'suburban rail network'}`} meta="OpenStreetMap · zoom 11">
          <div className="relative overflow-hidden rounded-xl border border-border/70 shadow-sm">
            <MumbaiMap routes={routes} selectedRouteId={active?.routeId} onSelect={setSelected} />
            <div className="pointer-events-none absolute left-4 top-4 z-[500] rounded-lg border border-border/80 bg-card/90 px-3 py-1.5 font-mono-ui text-[9px] uppercase tracking-widest text-muted-foreground backdrop-blur-md shadow-xs">
              MMR / live route geometry
            </div>
            <div className="absolute bottom-4 left-4 z-[500] flex flex-wrap gap-1.5 rounded-lg border border-border/80 bg-card/95 p-1.5 backdrop-blur-md shadow-md">
              {routes.map((route) => (
                <button
                  type="button"
                  key={route.routeId}
                  onClick={() => setSelected(route.routeId)}
                  data-testid={`button-legend-route-${route.routeId}`}
                  className={`flex items-center gap-1.5 rounded-md px-2 py-1 font-mono-ui text-[9.5px] font-semibold transition-all ${active?.routeId === route.routeId ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-muted'}`}
                >
                  <i className="h-2 w-2 rounded-full" style={{ background: active?.routeId === route.routeId ? 'currentColor' : route.color }} />
                  {route.routeId}
                </button>
              ))}
            </div>
          </div>
        </Panel>
        <Panel title={`${active?.routeId ?? '—'} intelligence`} meta="selected route">
          {active ? (
            <>
              <div className="flex items-center gap-3">
                <span className="h-10 w-1.5 rounded-full" style={{ background: active.color }} />
                <div>
                  <div className="font-display text-xl font-bold text-foreground">{active.name}</div>
                  <div className="mt-0.5 font-mono-ui text-[9px] uppercase tracking-wider text-muted-foreground">
                    {active.stations.length} stations · {active.recommendedBuses} recommended {unitLabel}
                  </div>
                </div>
              </div>
              <div className="mt-7 grid grid-cols-2 gap-3">
                {[
                  ['Forecast', active.predictedDemand.toLocaleString()],
                  ['Capacity', active.capacity.toLocaleString()],
                  ['Utilization', `${Math.round(active.utilization * 100)}%`],
                  ['Risk', `${Math.round(active.overcrowdingProbability * 100)}%`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-border/50 bg-muted/25 p-3.5">
                    <div className="font-mono-ui text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
                    <div className="mt-1 font-display text-2xl font-bold text-foreground">{value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 border-t border-border/70 pt-5">
                <div className="font-mono-ui text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">station sequence</div>
                <div className="mt-3 space-y-2.5">
                  {active.stations.map((station, index) => (
                    <div key={station} className="flex items-center gap-3 text-xs font-medium text-foreground">
                      <span className="grid h-5 w-5 place-items-center rounded-full border border-primary/30 bg-primary/10 font-mono-ui text-[8px] font-bold text-primary">{index + 1}</span>
                      {station}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <EmptyNotice text="No route selected." />
          )}
        </Panel>
      </div>
    </>
  );
}

function GeminiMarkdown({ content }: { content: string }) {
  return (
    <div className="mt-4 text-sm leading-relaxed text-foreground/90 space-y-3">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h3 className="mt-4 mb-2 font-display text-base font-bold text-foreground first:mt-0">
              {children}
            </h3>
          ),
          h2: ({ children }) => (
            <h4 className="mt-4 mb-2 font-display text-sm font-bold text-foreground first:mt-0">
              {children}
            </h4>
          ),
          h3: ({ children }) => (
            <h5 className="mt-3 mb-1.5 font-display text-xs font-bold uppercase tracking-wider text-muted-foreground first:mt-0">
              {children}
            </h5>
          ),
          h4: ({ children }) => (
            <h6 className="mt-2.5 mb-1 font-display text-xs font-bold text-foreground first:mt-0">
              {children}
            </h6>
          ),
          p: ({ children }) => (
            <p className="mb-2.5 text-sm leading-relaxed text-foreground/90 last:mb-0">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="my-2 space-y-1.5 pl-5 list-disc text-sm leading-relaxed text-foreground/90 marker:text-primary">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 space-y-1.5 pl-5 list-decimal text-sm leading-relaxed text-foreground/90 marker:text-primary font-mono-ui">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="pl-1">
              <span className="font-sans">{children}</span>
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-foreground/90">{children}</em>
          ),
          pre: ({ children, node, ...props }: any) => (
            <pre
              className="my-3 overflow-x-auto rounded-lg border border-border/70 bg-muted/60 p-3 font-mono-ui text-xs text-foreground"
              {...props}
            >
              {children}
            </pre>
          ),
          code: ({ children, className, node, ...props }: any) => {
            const isBlock = className?.includes('language-');
            if (isBlock) {
              return (
                <code className={`font-mono-ui text-xs text-foreground ${className || ''}`} {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code
                className="rounded border border-border/60 bg-muted/50 px-1.5 py-0.5 font-mono-ui text-[11px] text-primary"
                {...props}
              >
                {children}
              </code>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-2 border-primary/60 pl-3 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              className="font-medium text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
            >
              {children}
            </a>
          ),
          hr: () => <hr className="my-3 border-border/70" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export function InsightsPage() {
  const { transportMode } = useTransportMode();
  const analysis = useGetAnalysis(transportMode);
  const dashboardQuery = useGetDashboard(transportMode);
  const explain = useExplainInsights();
  const a = analysis.data ?? demoAnalysis;
  const routes = dashboardQuery.data?.routes ?? getDemoRoutes(transportMode);
  const priorityRoute = routes.slice().sort((x, y) => y.overcrowdingProbability - x.overcrowdingProbability)[0];
  const aiGenerated = explain.data?.configured === true;

  const run = () =>
    explain.mutate({
      mode: transportMode,
      data: {
        topic: `${priorityRoute?.routeId ?? 'priority route'} capacity risk`,
        evidence: `Predicted demand is ${priorityRoute?.predictedDemand ?? 0}; capacity is ${priorityRoute?.capacity ?? 0}; exceedance probability is ${Math.round((priorityRoute?.overcrowdingProbability ?? 0) * 100)}%.`,
      },
    });

  return (
    <>
      <PageIntro
        eyebrow={`Insights / 10 · ${transportMode}`}
        title="Separate evidence from narration."
        description="Mathematical evidence is always present. Gemini can turn the current signals into a concise dispatch and management review note."
        action={
          <Button onClick={run} disabled={explain.isPending} testId="button-explain-results">
            {explain.isPending ? <LoaderCircle size={14} className="animate-spin" /> : <Sparkles size={14} />} Explain with AI
          </Button>
        }
      />
      {dashboardQuery.isError && <div className="mb-5"><ErrorNote retry={() => dashboardQuery.refetch()} /></div>}
      <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <Panel title="Mathematical evidence" meta="always on">
          <div className="space-y-3.5">
            {[
              { label: 'Association', text: `Hour has the strongest linear association with demand (Pearson r = ${a.correlations[0]?.pearson.toFixed(2)}).` },
              { label: 'Fit', text: `The regression explains ${(a.regression.r2 * 100).toFixed(0)}% of observed variance in the holdout window.` },
              { label: 'Periodicity', text: `The Fourier spectrum peaks at a ${a.fourier.dominantPeriod}-hour period with strength ${a.fourier.peakStrength.toFixed(2)}.` },
              { label: 'Decision', text: `${priorityRoute?.routeId ?? 'The priority route'} has the highest live exceedance probability at ${Math.round((priorityRoute?.overcrowdingProbability ?? 0) * 100)}% under the active service window.` },
            ].map((item, index) => (
              <div key={item.label} className="flex gap-4 rounded-xl border border-border/70 bg-card/60 p-4 transition-all hover:border-primary/30">
                <div className="font-mono-ui text-[10px] font-bold text-primary">0{index + 1}</div>
                <div>
                  <div className="font-display text-sm font-bold text-foreground">{item.label}</div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Gemini operational review" meta={aiGenerated ? 'AI GENERATED (Gemini 3.8 Flash)' : explain.isPending ? 'GENERATING…' : 'LOCAL EVIDENCE'}>
          <div className={`min-h-[280px] rounded-xl p-5 border transition-all ${aiGenerated ? 'bg-primary/[.05] border-primary/30' : 'bg-muted/40 border-border/60'}`}>
            {explain.isPending ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="mt-5 h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : explain.data ? (
              <>
                <div className={`flex items-center gap-2 text-xs font-bold ${aiGenerated ? 'text-primary' : 'text-muted-foreground'}`}>
                  <Sparkles size={14} />
                  {aiGenerated ? 'AI GENERATED (Gemini 3.8 Flash)' : 'Local evidence fallback'}
                </div>
                <GeminiMarkdown content={explain.data.explanation} />
                <div className="mt-6 border-t border-border/70 pt-4 font-mono-ui text-[10px] text-muted-foreground">
                  {aiGenerated ? 'prompted from current route evidence · provider output' : 'Gemini key not configured or provider unavailable · local calculations preserved'}
                </div>
              </>
            ) : (
              <div className="flex h-full min-h-[240px] flex-col items-center justify-center text-center">
                <div className="grid h-12 w-12 place-items-center rounded-xl border border-border bg-card text-muted-foreground shadow-xs">
                  <Sparkles size={19} />
                </div>
                <div className="mt-4 font-display font-bold text-foreground">No narration has been requested</div>
                <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">Use the button above to turn the current evidence into a concise review note.</p>
              </div>
            )}
          </div>
        </Panel>
      </div>
    </>
  );
}

export function SettingsPage() {
  return (
    <>
      <PageIntro eyebrow="Settings / system" title="Keep the assumptions close." description="MetroMind is built to be questioned. This workspace makes its role, provenance, and academic shortcuts visible." />
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Workspace identity" meta="access context">
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground font-display font-bold shadow-xs">PK</div>
              <div>
                <div className="font-display font-bold text-foreground">Parth Korgaonkar</div>
                <div className="mt-0.5 text-xs text-muted-foreground">Project Owner / Developer</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-border/70 pt-5">
              <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
                <div className="font-mono-ui text-[9px] uppercase text-muted-foreground font-semibold">Role</div>
                <div className="mt-1 text-sm font-bold text-foreground">Project Owner / Developer</div>
              </div>
              <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
                <div className="font-mono-ui text-[9px] uppercase text-muted-foreground font-semibold">Workspace</div>
                <div className="mt-1 text-sm font-bold text-foreground">MetroMind AI</div>
              </div>
            </div>
          </div>
        </Panel>
        <Panel title="System information" meta="runtime">
          <div className="space-y-3">
            {[
              ['API contract', 'v0.1.0'],
              ['Backend engine', 'FastAPI Canonical'],
              ['Model pipeline', 'Gradient Boosting'],
              ['Data source', 'MMR_TRANSIT_2026 / BEST_TRANSIT_2026'],
              ['Health endpoint', '/api/healthz'],
            ].map(([l, v]) => (
              <div key={l} className="flex items-center justify-between border-b border-border/50 pb-2.5 text-xs last:border-0">
                <span className="text-muted-foreground">{l}</span>
                <span className="font-mono-ui font-semibold text-foreground">{v}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Academic assumptions" meta="read before viva">
          <div className="space-y-3 text-xs leading-5 text-muted-foreground">
            <p><strong className="text-foreground font-semibold">Uncertainty:</strong> intervals represent residual uncertainty around a point estimate; they are not calibrated guarantees.</p>
            <p><strong className="text-foreground font-semibold">Causality:</strong> association features support prediction, not causal inference.</p>
            <p><strong className="text-foreground font-semibold">Optimization:</strong> vehicles are treated as interchangeable and route travel time is not modeled in the objective.</p>
          </div>
        </Panel>
        <Panel title="Demo data note" meta="reproducible">
          <div className="flex gap-3">
            <FlaskConical size={17} className="mt-0.5 shrink-0 text-primary" />
            <p className="text-xs leading-5 text-muted-foreground">
              The included datasets are synthetic and deterministic so every analysis can be reproduced during a college mathematics viva. Best practices isolate suburban rail and bus feeder dynamics cleanly.
            </p>
          </div>
        </Panel>
      </div>
    </>
  );
}

export { PassengerPage } from './passenger/passenger-page';

export function HelpPage() {
  const workflowSteps = [
    { step: '01', label: 'Data intake', detail: 'Load a CSV dataset or use demo data (MMR_TRANSIT_2026 or BEST_TRANSIT_2026). The quality gate validates required columns (timestamp, route_id, station_id, passenger_count, etc.) and dataset integrity.' },
    { step: '02', label: 'Analysis', detail: 'Inspect correlation coefficients (Pearson linear & Spearman rank), OLS regression equation, and Fourier seasonality patterns before selecting models.' },
    { step: '03', label: 'Prediction', detail: 'Run corridor-level demand forecasts using Linear Regression, Random Forest, or Gradient Boosting models with confidence intervals.' },
    { step: '04', label: 'Risk', detail: 'Calculate overcrowding probability P(demand > capacity) per corridor, flagging routes into High / Medium / Low risk bands.' },
    { step: '05', label: 'Optimization', detail: 'Solve fleet allocation with linear programming to recommend vehicle additions while respecting total fleet size constraints.' },
    { step: '06', label: 'Simulator', detail: 'Stress-test allocation policies under simulated weather disruptions, special events, and peak-hour passenger surges.' },
  ];

  const pageReferences = [
    { step: '/', label: 'Overview', detail: 'Control-room summary: demand signal chart (24-hour forecast vs baseline), risk distribution ring, route watchlist, and activity log.' },
    { step: '/passenger', label: 'Passenger view', detail: 'Public-facing crowding lookup: select a route and departure time to see expected demand and crowding level.' },
    { step: '/data', label: 'Data intake', detail: 'Upload a CSV or load the MMR_TRANSIT_2026 / BEST_TRANSIT_2026 demo dataset. Quality gate shows completeness metrics.' },
    { step: '/analysis', label: 'Analysis', detail: 'Pearson/Spearman correlations, OLS regression equation (ŷ = β₀ + β₁x₁ + ε), and Fourier seasonality spectrum.' },
    { step: '/prediction', label: 'Prediction', detail: 'Generate per-route demand forecasts. Confidence intervals are shown for each prediction.' },
    { step: '/risk', label: 'Risk', detail: 'Overcrowding probability P(demand > capacity) = 1 − Φ(z) where z = (capacity − μ) / σ.' },
    { step: '/optimization', label: 'Optimization', detail: 'Fleet solver using linear programming with a capacity-coverage objective. Outputs total_capacity / total_demand ratio.' },
    { step: '/simulator', label: 'Simulator', detail: 'What-if scenario engine: adjustable rainfall, temperature, special-event flag, and peak multiplier.' },
    { step: '/models', label: 'Models', detail: 'Side-by-side model comparison table: MAE, RMSE, R² for Linear Regression, Random Forest, and Gradient Boosting.' },
    { step: '/routes', label: 'Routes', detail: 'Leaflet map overlaid with route corridors. Colour-coded by risk level. Hover for per-route metrics.' },
    { step: '/insights', label: 'Insights', detail: "AI-assisted narrative summary of the current dataset's dominant patterns and recommended actions." },
  ];

  const mathematicalAssumptions = [
    { step: 'M1', label: 'Temporal split', detail: 'Training window is days 0–80% of the dataset ordered by timestamp. Test window is the final 20%. There is no random shuffle to prevent data leakage from future into past.' },
    { step: 'M2', label: 'Feature engineering', detail: 'Derived features: hour-of-day (0–23), day-of-week (0–6), is_peak (06–09 and 17–20), rolling 7-day mean demand. All features are computed before the train/test split.' },
    { step: 'M3', label: 'Linear Regression', detail: 'Ordinary Least Squares. Assumes homoscedastic residuals and no multicollinearity. Coefficients are interpretable; use for baseline comparisons.' },
    { step: 'M4', label: 'Random Forest', detail: 'Ensemble of decision trees with bootstrap aggregation. n_estimators = 100, max_depth = None (grown to purity). No distributional assumptions on residuals.' },
    { step: 'M5', label: 'Gradient Boosting', detail: 'Sequential additive model minimising MSE loss. learning_rate = 0.05, n_estimators = 200, max_depth = 4. Best performing in cross-validation on MMR data.' },
    { step: 'M6', label: 'Error metrics', detail: 'MAE = mean absolute error (same units as demand). RMSE = root mean squared error (penalises outliers). R² = 1 − SS_res / SS_tot (proportion of variance explained, max = 1).' },
    { step: 'M7', label: 'Risk model', detail: 'Overcrowding probability is P(demand > capacity) = 1 − Φ(z) where z = (capacity − μ) / σ, μ is predicted demand, σ is residual standard deviation from training.' },
    { step: 'M8', label: 'Capacity coverage', detail: 'Coverage = (total allocated capacity / total predicted demand) × 100%. Values above 100% mean the fleet meets predicted demand for those routes. The metric is a planning ratio, not per-vehicle occupancy.' },
    { step: 'M9', label: 'Correlation', detail: 'Pearson measures linear association; Spearman measures monotonic association. Both range −1 to +1. Threshold: |r| < 0.3 weak, 0.3–0.6 moderate, > 0.6 strong.' },
    { step: 'M10', label: 'Fourier seasonality', detail: 'FFT is applied to the hourly aggregated time-series. Dominant period is the frequency bin with the highest amplitude. Peak strength is the normalised amplitude at that bin.' },
  ];

  const { startTutorial } = useTutorial();

  return (
    <>
      <PageIntro
        eyebrow="Help & assumptions / guide"
        title="How MetroMind works."
        description="A concise reference for each page, the recommended workflow, fleet optimization principles, and mathematical assumptions behind every model."
        action={
          <Link href="/optimization">
            <Button testId="button-help-start-optimization">
              Start with Optimization <ArrowUpRight size={14} />
            </Button>
          </Link>
        }
      />
      <div className="space-y-8">
        {/* Tutorial Mode launch panel */}
        <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/[.07] to-primary/[.03] p-6 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-primary/30 bg-primary/[.12] text-primary">
                <GraduationCap size={20} strokeWidth={2} />
              </div>
              <div>
                <div className="font-display text-base font-bold text-foreground">Guided Tutorial Mode</div>
                <p className="mt-1 max-w-lg text-xs leading-5 text-muted-foreground">
                  New to MetroMind? Start the interactive guided tour. It walks through all 11 pages in order — explaining each analytical stage, how to read the outputs, and how the math connects — with Next / Previous navigation and Escape to exit at any time.
                </p>
              </div>
            </div>
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => startTutorial()}
                data-testid="button-start-tutorial"
                className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary px-5 py-2.5 font-display text-sm font-bold text-primary-foreground shadow-sm transition-all hover:brightness-105 hover:shadow-md active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
              >
                <GraduationCap size={15} strokeWidth={2.2} aria-hidden="true" />
                Start Tutorial
              </button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {['Overview', 'Passenger', 'Data', 'Analysis', 'Prediction', 'Risk', 'Optimization', 'Simulator', 'Models', 'Routes', 'Insights'].map((page, i) => (
              <span key={page} className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/[.08] px-2.5 py-0.5 font-mono-ui text-[10px] font-semibold text-primary/80">
                <span className="text-primary/50">{i + 1}.</span>{page}
              </span>
            ))}
          </div>
        </div>
        {/* Section A: START HERE — OPTIMIZATION */}
        <Panel title="Start here — Optimization" meta="core question">
          <div className="rounded-xl border border-primary/30 bg-primary/[.05] p-5">
            <div className="font-mono-ui text-[9px] uppercase tracking-[.18em] text-primary font-bold">Plain-language mission</div>
            <p className="mt-2 text-sm leading-6 font-semibold text-foreground">
              This page answers: Given predicted passenger demand and available fleet capacity, how should vehicles be allocated across routes while respecting the configured constraints?
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link href="/optimization">
                <Button testId="button-start-with-optimization">
                  Start with Optimization <ArrowUpRight size={14} />
                </Button>
              </Link>
              <span className="text-xs text-muted-foreground">
                Opens the fleet allocation solver using the currently active Railway or Bus mode.
              </span>
            </div>
          </div>
        </Panel>

        {/* Section B: WHAT THIS PAGE SAYS */}
        <Panel title="What this page says" meta="metrics & terminology">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                label: 'Available vehicles',
                detail: 'Total active fleet units (train sets in Railway mode, buses in Bus mode) available for dispatch during the active scheduling window.',
              },
              {
                label: 'Capacity per vehicle',
                detail: 'Nominal passenger-carrying capacity of an individual vehicle (e.g. 3,000 passengers per 12-car suburban train, or 70 passengers per standard bus).',
              },
              {
                label: 'Predicted demand',
                detail: 'Expected passenger volume for each route corridor during the service interval, forecasted by the machine learning engine.',
              },
              {
                label: 'Utilization',
                detail: 'Ratio of predicted passenger demand to baseline vehicle capacity (predicted demand / capacity). Values above 1.0 indicate potential overcrowding risk.',
              },
              {
                label: 'Unused capacity',
                detail: 'Surplus vehicle capacity remaining when total assigned vehicle capacity exceeds predicted passenger demand on a route or across the network.',
              },
              {
                label: 'Objective',
                detail: 'The mathematical solver target: maximizing passenger capacity coverage across corridors while penalizing unmet demand and route overcrowding.',
              },
              {
                label: 'Allocation result',
                detail: 'The linear programming solver\'s recommended vehicle count per route corridor (e.g., how many buses or train sets to assign to each line).',
              },
              {
                label: 'Capacity covered',
                detail: 'Percentage of predicted passenger demand satisfied by total allocated fleet capacity: (Total Allocated Capacity / Total Predicted Demand) × 100%.',
              },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-border/70 bg-card/60 p-4 shadow-2xs">
                <div className="font-display text-xs font-bold text-primary">{item.label}</div>
                <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </div>
        </Panel>

        {/* Section C: EXAMPLE */}
        <Panel title="Worked example" meta="illustrative calculation">
          <div className="rounded-xl bg-sidebar p-5 text-sidebar-foreground shadow-sm">
            <div className="font-mono-ui text-[9px] uppercase tracking-[.18em] text-sidebar-primary font-bold">Numerical walkthrough</div>
            <div className="mt-3 font-mono-ui text-sm leading-7 text-sidebar-foreground">
              <div className="font-bold text-sidebar-primary">4 buses × 70 capacity = 280 total capacity</div>
              <div className="mt-1 text-sidebar-foreground/80">If predicted demand ≈ 75.3:</div>
              <div className="mt-1 font-bold text-sidebar-primary">280 / 75.3 × 100 ≈ 372%</div>
            </div>
            <div className="mt-4 border-t border-sidebar-border/80 pt-4 text-xs leading-6 text-sidebar-foreground/90">
              <p className="font-medium">
                Coverage above 100% does not mean a bus is 372% full. It means total available capacity is approximately 3.72 times the predicted demand.
              </p>
            </div>
          </div>
        </Panel>

        {/* Section D: HOW TO USE THE APP */}
        <Panel title="How to use the app" meta="operational workflow">
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
              <div className="font-mono-ui text-[9px] uppercase tracking-[.18em] text-muted-foreground font-semibold">Practical workflow</div>
              <div className="mt-3 flex flex-wrap items-center gap-2 font-mono-ui text-xs font-bold text-foreground">
                <span className="rounded-md bg-primary/10 px-2.5 py-1 text-primary">Data Intake</span>
                <span className="text-muted-foreground">→</span>
                <span className="rounded-md bg-primary/10 px-2.5 py-1 text-primary">Analysis</span>
                <span className="text-muted-foreground">→</span>
                <span className="rounded-md bg-primary/10 px-2.5 py-1 text-primary">Prediction</span>
                <span className="text-muted-foreground">→</span>
                <span className="rounded-md bg-primary/10 px-2.5 py-1 text-primary">Risk</span>
                <span className="text-muted-foreground">→</span>
                <span className="rounded-md bg-primary/10 px-2.5 py-1 text-primary">Optimization</span>
                <span className="text-muted-foreground">→</span>
                <span className="rounded-md bg-primary/10 px-2.5 py-1 text-primary">Simulator</span>
              </div>
            </div>
            <div className="divide-y divide-border/60">
              {workflowSteps.map((item) => (
                <div key={item.step} className="grid grid-cols-[52px_1fr] gap-4 py-3.5 first:pt-0 last:pb-0">
                  <div className="mt-0.5 font-mono-ui text-[9px] uppercase tracking-[.18em] text-primary font-bold">{item.step}</div>
                  <div>
                    <div className="font-display text-xs font-bold text-foreground">{item.label}</div>
                    <p className="mt-0.5 text-[11px] leading-5 text-muted-foreground">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-border/80 bg-muted/30 p-4 text-[11px] leading-5 text-muted-foreground">
              <span className="font-semibold text-foreground">Additional explorer views:</span> You can also review <span className="font-medium text-foreground">Models</span> (side-by-side MAE, RMSE, R² comparison), <span className="font-medium text-foreground">Routes</span> (geospatial corridor map), <span className="font-medium text-foreground">Insights</span> (AI-assisted operational summary), and <span className="font-medium text-foreground">Passenger View</span> (commuter-facing crowding lookup).
            </div>
          </div>
        </Panel>

        {/* Section E: PAGE REFERENCE */}
        <Panel title="Page reference">
          <div className="divide-y divide-border/60">
            {pageReferences.map((item) => (
              <div key={item.step} className="grid grid-cols-[80px_1fr] gap-4 py-3.5 first:pt-0 last:pb-0">
                <div className="mt-0.5 font-mono-ui text-[10px] font-bold text-primary">{item.step}</div>
                <div>
                  <div className="font-display text-xs font-bold text-foreground">{item.label}</div>
                  <p className="mt-0.5 text-[11px] leading-5 text-muted-foreground">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Section F: ACADEMIC ASSUMPTIONS */}
        <Panel title="Mathematical assumptions">
          <div className="divide-y divide-border/60">
            {mathematicalAssumptions.map((item) => (
              <div key={item.step} className="grid grid-cols-[52px_1fr] gap-4 py-3.5 first:pt-0 last:pb-0">
                <div className="mt-0.5 font-mono-ui text-[9px] uppercase tracking-[.18em] text-primary font-bold">{item.step}</div>
                <div>
                  <div className="font-display text-xs font-bold text-foreground">{item.label}</div>
                  <p className="mt-0.5 text-[11px] leading-5 text-muted-foreground">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Demo Datasets">
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <p className="text-sm leading-6 text-muted-foreground mb-5">
              These canonical datasets are generated deterministically by the MetroMind domain engine. Download them to inspect the required CSV schema before uploading your own data.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border/60 bg-muted/20 p-4 transition-colors hover:bg-muted/40">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-mono-ui text-[11px] font-bold text-foreground">MMR_TRANSIT_2026.csv</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary">RAILWAY</span>
                </div>
                <p className="mb-4 text-[10px] text-muted-foreground">4 lines, 16 stations, 2,688 records</p>
                <a 
                  href="/api/data/demo/railway/csv" 
                  download="MMR_TRANSIT_2026.csv"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  <CloudUpload size={12} className="rotate-180" />
                  Download CSV
                </a>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/20 p-4 transition-colors hover:bg-muted/40">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-mono-ui text-[11px] font-bold text-foreground">BEST_TRANSIT_2026.csv</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary">BUS</span>
                </div>
                <p className="mb-4 text-[10px] text-muted-foreground">4 routes, 16 stops, 2,688 records</p>
                <a 
                  href="/api/data/demo/bus/csv" 
                  download="BEST_TRANSIT_2026.csv"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  <CloudUpload size={12} className="rotate-180" />
                  Download CSV
                </a>
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Railway vs Bus isolation">
          <p className="text-[12px] leading-6 text-muted-foreground">
            Railway mode and Bus mode maintain completely separate dataset, analysis, prediction, risk, and optimization state.
            Switching modes in the top-right control resets all result panels to prevent cross-contamination of signals.
          </p>
        </Panel>

        <Panel title="Limitations & caveats">
          <div className="space-y-3 text-[12px] leading-6 text-muted-foreground">
            <p>• Predictions are statistical estimates, not operational guarantees. Always cross-reference with live dispatch data before making allocation changes.</p>
            <p>• The Fourier analysis assumes stationarity within the analysis window. Events such as strikes, monsoon disruptions, or new station openings may invalidate the periodicity assumption.</p>
            <p>• Capacity coverage above 100% does not mean trains or buses are running empty — it means the aggregate planned capacity exceeds aggregate predicted demand across all routes in that window.</p>
            <p>• The passenger view uses neutral weather (temperature = 30°C, rainfall = 0 mm) and standard weekday coefficients. Actual crowding may differ on extreme-weather or holiday days.</p>
            <p>• Risk thresholds (High ≥ 0.70, Medium ≥ 0.40, Low &lt; 0.40) are calibrated to MMR transit data. Recalibrate if you import data from a different city or operator.</p>
          </div>
        </Panel>
      </div>
    </>
  );
}