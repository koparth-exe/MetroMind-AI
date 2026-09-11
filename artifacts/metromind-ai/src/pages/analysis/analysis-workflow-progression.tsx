import { Link } from 'wouter';
import { ArrowRight, Check, TrendingUp, FunctionSquare, Waypoints, Cpu, Sparkles } from 'lucide-react';

export function AnalysisWorkflowProgression() {
  const steps = [
    {
      num: '01',
      title: 'Understand',
      subtitle: 'Feature Correlations',
      description: 'Pearson & Spearman association coefficients',
      status: 'complete',
      Icon: TrendingUp,
    },
    {
      num: '02',
      title: 'Fit',
      subtitle: 'OLS Linear Model',
      description: 'Parametric equation & R² goodness of fit',
      status: 'complete',
      Icon: FunctionSquare,
    },
    {
      num: '03',
      title: 'Detect',
      subtitle: 'Fourier Periodicity',
      description: '12h commute harmonic & weekend attenuation',
      status: 'complete',
      Icon: Waypoints,
    },
    {
      num: '04',
      title: 'Compare',
      subtitle: 'Model Evidence',
      description: '80/20 chronological holdout benchmark',
      status: 'complete',
      Icon: Cpu,
    },
    {
      num: '05',
      title: 'Forecast',
      subtitle: 'Predictive Modeling',
      description: 'Multi-corridor ML demand scenario simulations',
      status: 'next',
      Icon: Sparkles,
    },
  ];

  return (
    <section
      aria-label="Analytical Workflow Progression"
      className="signal-card rounded-2xl border border-border/80 bg-card/95 p-5 sm:p-6 shadow-xs"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
            <h2 className="font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
              Analytical Workflow Progression
            </h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Complete sequential validation from statistical evidence through predictive modeling.
          </p>
        </div>

        <Link
          href="/prediction"
          data-testid="button-analysis-to-prediction"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-2xs hover:brightness-110 active:scale-[0.98] transition-all self-start sm:self-center"
        >
          <span>Continue to Prediction</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* 5-Step Progression Grid */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {steps.map((s) => {
          const Icon = s.Icon;
          const isNext = s.status === 'next';

          return (
            <div
              key={s.num}
              className={`rounded-xl border p-4 shadow-2xs flex flex-col justify-between transition-all ${
                isNext
                  ? 'border-primary/50 bg-primary/[0.06] ring-1 ring-primary/20'
                  : 'border-border/60 bg-card/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono-ui text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    Step {s.num}
                  </span>
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-md border text-xs ${
                      isNext
                        ? 'border-primary/40 bg-primary/20 text-primary'
                        : 'border-border/60 bg-muted/40 text-muted-foreground'
                    }`}
                  >
                    <Icon size={12} />
                  </div>
                </div>

                <div className="mt-2 font-display text-base font-bold text-foreground">
                  {s.title}
                </div>
                <div className="text-[11px] font-semibold text-primary/90 mt-0.5">
                  {s.subtitle}
                </div>
                <p className="mt-1 text-[10.5px] text-muted-foreground leading-relaxed">
                  {s.description}
                </p>
              </div>

              <div className="mt-3.5 pt-2 border-t border-border/40 font-mono-ui text-[9px]">
                {isNext ? (
                  <span className="inline-flex items-center gap-1 font-bold text-primary">
                    <span>NEXT WORKSPACE</span>
                    <ArrowRight size={10} />
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-risk-low font-semibold">
                    <Check size={10} strokeWidth={3} />
                    <span>CALIBRATED</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
