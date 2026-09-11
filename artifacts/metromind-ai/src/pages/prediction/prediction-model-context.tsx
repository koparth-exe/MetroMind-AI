import { Award, Check, Cpu, Info, ShieldCheck } from 'lucide-react';
import type { ModelMetric } from './types';

interface PredictionModelContextProps {
  activeModelName: string;
  models: ModelMetric[];
  methodology?: string;
  onSelectModel: (modelName: string) => void;
}

export function PredictionModelContext({
  activeModelName,
  models,
  methodology,
  onSelectModel,
}: PredictionModelContextProps) {
  return (
    <section
      id="prediction-model-context"
      aria-label="Forecasting Model Evidence"
      className="signal-card overflow-hidden rounded-2xl border border-border/80 bg-card/95 p-5 shadow-xs sm:p-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-primary" />
            <h2 className="font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
              Forecasting Model Evidence & Holdout Calibration
            </h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Held-out benchmark metrics evaluated on the chronological 80/20 test split.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="rounded-full border border-border/60 bg-muted/50 px-2.5 py-0.5 font-mono-ui text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            HOLDOUT VALIDATION
          </span>
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {models.map((m) => {
          const isActive = m.model === activeModelName;
          const isBest = m.isBest;

          return (
            <div
              key={m.model}
              onClick={() => onSelectModel(m.model)}
              className={`rounded-2xl border p-4 sm:p-5 transition-all cursor-pointer ${
                isActive
                  ? 'border-primary bg-primary/[0.06] shadow-xs ring-1 ring-primary/30'
                  : 'border-border/70 bg-card/60 hover:border-primary/40 hover:bg-card/90'
              }`}
            >
              {/* Header: Model Name & Badges */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-display text-sm font-bold text-foreground">
                      {m.model}
                    </span>
                  </div>
                  <div className="mt-0.5 font-mono-ui text-[9.5px] uppercase tracking-wider text-muted-foreground">
                    {isBest ? 'Empirical Champion' : 'Candidate Estimator'}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  {isBest && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/15 px-2 py-0.5 font-mono-ui text-[8.5px] font-bold uppercase tracking-wider text-primary">
                      <Award size={10} />
                      CHAMPION
                    </span>
                  )}
                  {isActive && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/60 px-2 py-0.5 font-mono-ui text-[8.5px] font-semibold uppercase tracking-wider text-foreground">
                      <Check size={10} className="text-primary" />
                      ACTIVE
                    </span>
                  )}
                </div>
              </div>

              {/* Holdout Metrics */}
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/50 pt-3 font-mono-ui text-center">
                <div className="rounded-lg bg-muted/30 p-2">
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground">MAE</div>
                  <div className="mt-0.5 font-display text-xs font-bold text-foreground">
                    {m.mae.toFixed(1)}
                  </div>
                </div>

                <div className="rounded-lg bg-muted/30 p-2">
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground">RMSE</div>
                  <div className="mt-0.5 font-display text-xs font-bold text-foreground">
                    {m.rmse.toFixed(1)}
                  </div>
                </div>

                <div className="rounded-lg bg-muted/30 p-2">
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground">R² Score</div>
                  <div className="mt-0.5 font-display text-xs font-bold text-primary">
                    {m.r2.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rationale Note */}
      <div className="mt-4 rounded-xl border border-border/70 bg-muted/20 p-3.5 flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed">
        <Info size={14} className="text-primary shrink-0 mt-0.5" />
        <p>
          <strong className="text-foreground">Pipeline Rationale:</strong> {activeModelName} is utilized for scenario prediction because it achieved the lowest residual error variance on the chronological test holdout, producing calibrated prediction intervals with minimum forecast bias.
        </p>
      </div>
    </section>
  );
}
