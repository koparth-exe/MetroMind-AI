import { Link } from 'wouter';
import { ArrowRight, Target, CheckCircle2, ShieldCheck } from 'lucide-react';

interface RiskProgressionProps {
  highestRouteName?: string;
  highestRiskScore?: number;
}

export function RiskProgression({ highestRouteName, highestRiskScore }: RiskProgressionProps) {
  return (
    <section
      id="risk-progression"
      aria-label="Workflow Progression to Optimization"
      className="signal-card overflow-hidden rounded-2xl border border-primary/30 bg-primary/[0.03] p-5 shadow-xs sm:p-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="font-mono-ui text-[10px] font-bold uppercase tracking-[.18em] text-primary">
              PIPELINE PROGRESSION · 8G → 8H
            </span>
            <span className="h-1 w-1 rounded-full bg-border" aria-hidden="true" />
            <span className="font-mono-ui text-[10px] text-muted-foreground">
              What Should We Do?
            </span>
          </div>

          <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-foreground">
            Continue to Fleet Optimization
          </h2>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Now that capacity exceedance probability has been quantified
            {highestRouteName ? ` (with ${highestRouteName} at risk index ${highestRiskScore}/100)` : ''},
            solve the constrained integer programming model to balance vehicle allocations and eliminate overcrowding.
          </p>

          {/* Pipeline breadcrumb */}
          <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] font-mono-ui text-muted-foreground">
            <span className="inline-flex items-center gap-1 text-foreground">
              <CheckCircle2 size={11} className="text-primary" /> 8D Intake
            </span>
            <span>→</span>
            <span className="inline-flex items-center gap-1 text-foreground">
              <CheckCircle2 size={11} className="text-primary" /> 8E Analysis
            </span>
            <span>→</span>
            <span className="inline-flex items-center gap-1 text-foreground">
              <CheckCircle2 size={11} className="text-primary" /> 8F Prediction
            </span>
            <span>→</span>
            <span className="inline-flex items-center gap-1 text-primary font-bold">
              <ShieldCheck size={11} /> 8G Risk
            </span>
            <span>→</span>
            <span className="font-bold text-foreground">
              8H Optimization
            </span>
          </div>
        </div>

        <Link
          href="/optimization"
          data-testid="button-risk-to-optimization"
          className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-primary px-6 py-3 text-xs sm:text-sm font-bold text-primary-foreground shadow-sm hover:brightness-110 active:scale-[0.98] transition-all shrink-0 cursor-pointer self-start md:self-center"
        >
          <Target size={16} />
          <span>Continue to Fleet Optimization</span>
          <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
