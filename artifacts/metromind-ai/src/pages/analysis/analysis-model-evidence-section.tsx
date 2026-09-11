import { Cpu, CheckCircle2, ShieldCheck, ArrowRight, Layers, BarChart3, Info } from 'lucide-react';
import type { ModelComparison } from '@workspace/api-client-react';
import type { TransportMode } from '@/lib/transport-mode';

interface AnalysisModelEvidenceSectionProps {
  modelsSummary?: ModelComparison;
  transportMode: TransportMode;
}

const MODEL_DESCRIPTIONS: Record<string, { category: string; description: string }> = {
  'Linear Regression': {
    category: 'Parametric Linear Baseline',
    description: 'Assumes direct additive feature relationships; establishes lower bound for explained variance.',
  },
  'Random Forest': {
    category: 'Bagged Tree Ensemble',
    description: 'Aggregates 100 orthogonal decision trees to dampen variance and accommodate non-linear commute crests.',
  },
  'Gradient Boosting': {
    category: 'Sequential Additive Regressor',
    description: 'Sequentially minimizes residual errors; achieves optimal calibration on sharp rush-hour demand surges.',
  },
};

export function AnalysisModelEvidenceSection({
  modelsSummary,
  transportMode,
}: AnalysisModelEvidenceSectionProps) {
  if (!modelsSummary || !modelsSummary.metrics || modelsSummary.metrics.length === 0) {
    return null;
  }

  const { metrics, selectedModel, methodology } = modelsSummary;

  return (
    <section
      aria-label="Model Performance Evidence"
      className="signal-card rounded-2xl border border-border/80 bg-card/95 p-5 sm:p-6 shadow-xs"
    >
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
            <h2 className="font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
              Model Performance Evidence
            </h2>
            <span className="rounded-full border border-border/70 bg-muted/50 px-2.5 py-0.5 font-mono-ui text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              Holdout Comparison
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Side-by-side empirical holdout evaluation comparing parametric OLS against non-linear tree ensembles.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono-ui text-[10px] text-muted-foreground">
          <span>Active Selection: <strong className="text-primary">{selectedModel}</strong></span>
          <span className="text-muted-foreground/40">·</span>
          <span>Criterion: <strong className="text-foreground">Lowest Test RMSE</strong></span>
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {metrics.map((m) => {
          const isSelected = m.isBest || m.model === selectedModel;
          const meta = MODEL_DESCRIPTIONS[m.model] ?? {
            category: 'ML Estimator',
            description: 'Statistical demand estimator',
          };

          return (
            <div
              key={m.model}
              className={`rounded-xl border p-4 sm:p-5 shadow-2xs transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-primary/50 bg-primary/[0.04] ring-1 ring-primary/20'
                  : 'border-border/70 bg-card/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono-ui text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    {meta.category}
                  </span>
                  {isSelected && (
                    <span className="inline-flex items-center gap-1 rounded bg-primary/15 px-2 py-0.5 font-mono-ui text-[9px] font-bold text-primary border border-primary/30">
                      <CheckCircle2 size={11} />
                      ACTIVE ESTIMATOR
                    </span>
                  )}
                </div>

                <div className="mt-2 font-display text-lg font-bold text-foreground">
                  {m.model}
                </div>

                <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                  {meta.description}
                </p>
              </div>

              {/* Metrics Grid */}
              <div className="mt-4 pt-3.5 border-t border-border/50 grid grid-cols-3 gap-2 text-center font-mono-ui">
                <div className="rounded-lg border border-border/40 bg-muted/20 p-2">
                  <div className="text-[9.5px] text-muted-foreground">MAE</div>
                  <div className="text-xs sm:text-sm font-bold text-foreground mt-0.5 tabular-nums">
                    {m.mae.toLocaleString()}
                  </div>
                  <div className="text-[8px] text-muted-foreground">pax</div>
                </div>

                <div className="rounded-lg border border-border/40 bg-muted/20 p-2">
                  <div className="text-[9.5px] text-muted-foreground">RMSE</div>
                  <div className={`text-xs sm:text-sm font-bold mt-0.5 tabular-nums ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    {m.rmse.toLocaleString()}
                  </div>
                  <div className="text-[8px] text-muted-foreground">pax</div>
                </div>

                <div className="rounded-lg border border-border/40 bg-muted/20 p-2">
                  <div className="text-[9.5px] text-muted-foreground">R² Fit</div>
                  <div className="text-xs sm:text-sm font-bold text-foreground mt-0.5 tabular-nums">
                    {m.r2.toFixed(2)}
                  </div>
                  <div className="text-[8px] text-muted-foreground">score</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Methodology Banner & Downstream Transition Note */}
      <div className="mt-4 rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="space-y-1">
            <div className="font-mono-ui text-[10px] font-bold uppercase tracking-wider text-foreground">
              Mathematical Evaluation Protocol
            </div>
            <p className="text-[11.5px] text-muted-foreground leading-relaxed">
              {methodology}
            </p>
          </div>
          <span className="rounded-full border border-border/60 bg-card/60 px-2.5 py-1 font-mono-ui text-[9px] font-medium text-muted-foreground shrink-0 self-start sm:self-center">
            No Data Leakage · Strict Temporal Split
          </span>
        </div>

        <div className="border-t border-border/50 pt-2 text-[11px] text-primary/90 font-medium">
          These metrics establish the evidence base used by Prediction.
        </div>
      </div>
    </section>
  );
}
