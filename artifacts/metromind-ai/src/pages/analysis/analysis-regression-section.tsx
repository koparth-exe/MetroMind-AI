import { FunctionSquare, Sigma, TrendingUp, HelpCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import type { AnalysisRegression, AnalysisRegressionCoefficientsItem, ModelMetric } from '@workspace/api-client-react';
import type { TransportMode } from '@/lib/transport-mode';

interface AnalysisRegressionSectionProps {
  regression: AnalysisRegression;
  formulae: string[];
  linearMetrics?: ModelMetric;
  transportMode: TransportMode;
}

export function AnalysisRegressionSection({
  regression,
  formulae,
  linearMetrics,
  transportMode,
}: AnalysisRegressionSectionProps) {
  const isBus = transportMode === 'BUS';

  // Format equation cleanly if it contains duplicate symbols
  const cleanEquation = regression.equation
    .replace(/\+\s*\+/g, '+ ')
    .replace(/\+\s*-\s*/g, '- ')
    .replace(/-\s*-\s*/g, '+ ');

  const r2Pct = (regression.r2 * 100).toFixed(0);

  return (
    <section
      aria-label="Regression Evidence"
      className="signal-card rounded-2xl border border-border/80 bg-card/95 p-5 sm:p-6 shadow-xs"
    >
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
            <h2 className="font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
              Regression Evidence & Goodness of Fit
            </h2>
            <span className="rounded-full border border-border/70 bg-muted/50 px-2.5 py-0.5 font-mono-ui text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              OLS Model Formulation
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Ordinary Least Squares (OLS) linear model estimating direct sensitivity derivatives per unit covariate change.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono-ui text-[10px] text-muted-foreground">
          <span>Target: <strong className="text-foreground">passenger_count</strong></span>
          <span className="text-muted-foreground/40">·</span>
          <span>Holdout: <strong className="text-foreground">20% chronological</strong></span>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* Left Column: Fitted Equation & Goodness of Fit */}
        <div className="flex flex-col justify-between rounded-xl border border-border/70 bg-sidebar p-5 text-sidebar-foreground shadow-2xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono-ui text-[9px] font-bold uppercase tracking-wider text-sidebar-foreground/50">
                Fitted Parametric Equation
              </span>
              <span className="rounded bg-sidebar-accent px-2 py-0.5 font-mono-ui text-[9px] font-bold uppercase text-sidebar-primary">
                OLS Estimator
              </span>
            </div>

            {/* Main Equation Box */}
            <div
              className="mt-3.5 rounded-lg border border-sidebar-border/80 bg-background/50 p-4 font-mono-ui text-sm sm:text-base font-bold text-sidebar-primary tracking-wide break-all leading-relaxed shadow-inner"
              data-testid="text-regression-equation"
            >
              {cleanEquation}
            </div>

            <div className="mt-2 text-[10px] text-sidebar-foreground/60 font-mono-ui">
              Notation: <strong className="text-sidebar-foreground">h</strong> = hour of day, <strong className="text-sidebar-foreground">r</strong> = rainfall (mm), <strong className="text-sidebar-foreground">t</strong> = temperature (°C)
            </div>
          </div>

          {/* R2 Metric Panel */}
          <div className="mt-6 border-t border-sidebar-border/80 pt-4 flex items-end justify-between">
            <div>
              <div className="font-mono-ui text-[10px] uppercase tracking-wider text-sidebar-foreground/50">
                Coefficient of Determination (R²)
              </div>
              <div className="mt-1 text-xs text-sidebar-foreground/75 leading-relaxed max-w-xs">
                Explains <strong className="text-sidebar-primary">{r2Pct}% of total variance</strong> on test observations.
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-4xl sm:text-5xl font-bold text-sidebar-primary tabular-nums">
                {regression.r2.toFixed(2)}
              </div>
              <div className="font-mono-ui text-[9px] text-sidebar-foreground/50 uppercase tracking-wider mt-0.5">
                Goodness of fit
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Regressor Coefficients & Holdout Error */}
        <div className="space-y-3.5 flex flex-col justify-between">
          <div>
            <div className="font-mono-ui text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center justify-between">
              <span>Estimated Regressor Coefficients</span>
              <span>Marginal Impact (Δy / Δx)</span>
            </div>

            <div className="grid gap-2.5">
              {regression.coefficients.map((c: AnalysisRegressionCoefficientsItem) => {
                const isPos = c.coefficient >= 0;
                const unitText =
                  c.variable === 'hour'
                    ? isBus ? 'pax per hour increment' : 'pax per hour increment'
                    : c.variable === 'rainfall'
                    ? 'pax suppression per mm'
                    : 'pax per degree celsius';

                return (
                  <div
                    key={c.variable}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-card/60 px-4 py-3 shadow-2xs hover:border-border transition-colors"
                  >
                    <div>
                      <div className="font-display text-sm font-bold text-foreground capitalize">
                        {c.variable === 'hour' ? 'Hour of Day' : c.variable}
                      </div>
                      <div className="font-mono-ui text-[10px] text-muted-foreground">
                        {unitText}
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`font-mono-ui text-base sm:text-lg font-bold tabular-nums ${
                          isPos ? 'text-primary' : 'text-accent'
                        }`}
                      >
                        {isPos ? `+${c.coefficient.toFixed(1)}` : c.coefficient.toFixed(1)}
                      </div>
                      <div className="font-mono-ui text-[9px] uppercase tracking-wider text-muted-foreground">
                        {isPos ? 'Surge Driver' : 'Suppression'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Holdout Calibration Summary from Linear Model */}
          {linearMetrics && (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 text-xs font-mono-ui">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">
                <span>Holdout Validation Errors</span>
                <span>Chronological 80/20</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-lg border border-border/50 bg-card/40 p-2">
                  <div className="text-[10px] text-muted-foreground">MAE (Mean Absolute Error)</div>
                  <div className="text-sm font-bold text-foreground mt-0.5">
                    {linearMetrics.mae.toLocaleString()} <span className="text-[9px] font-normal text-muted-foreground">pax</span>
                  </div>
                </div>
                <div className="rounded-lg border border-border/50 bg-card/40 p-2">
                  <div className="text-[10px] text-muted-foreground">RMSE (Root Mean Squared)</div>
                  <div className="text-sm font-bold text-foreground mt-0.5">
                    {linearMetrics.rmse.toLocaleString()} <span className="text-[9px] font-normal text-muted-foreground">pax</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Formulae Specification Footer */}
      <div className="mt-5 rounded-xl border border-border/50 bg-muted/20 p-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono-ui">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
          Theoretical Mathematical Foundations:
        </span>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-foreground font-medium">
          {formulae.map((f, idx) => (
            <span key={idx} className="rounded bg-card/80 border border-border/60 px-2.5 py-1 shadow-2xs">
              {f.replace('', 'ŷ').replace('I??', 'β₀').replace('I??', 'β₁').replace('I', 'ε').replace('I?', 'σ')}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
