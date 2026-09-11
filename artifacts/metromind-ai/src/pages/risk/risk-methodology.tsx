import { BookOpen, CheckCircle, Calculator, ShieldCheck, Scale } from 'lucide-react';

export function RiskMethodology() {
  return (
    <section
      id="risk-methodology"
      aria-label="Risk Engine Mathematical Methodology"
      className="signal-card overflow-hidden rounded-2xl border border-border/80 bg-card/95 p-5 shadow-xs sm:p-6"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
            <h2 className="font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
              Mathematical Risk Engine Methodology
            </h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Authoritative Phase 5 composite formulas and stochastic exceedance formulations.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-muted/40 px-2.5 py-1 font-mono-ui text-[10px] font-semibold text-muted-foreground">
          <BookOpen size={11} />
          <span>backend/app/mathematics/risk/</span>
        </div>
      </div>

      {/* Equations Grid */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Composite Risk Score Equation */}
        <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-mono-ui text-[10px] font-bold uppercase tracking-wider text-primary">
              1. Composite Risk Score Equation
            </span>
            <span className="font-mono-ui text-[9px] text-muted-foreground">0–100 Continuous Scale</span>
          </div>

          <div className="rounded-lg border border-border/60 bg-card p-3 font-mono-ui text-xs sm:text-[13px] font-bold text-foreground overflow-x-auto shadow-inner">
            <code>Risk_Score = 0.60 × min(Util_Ratio × 100, 100) + 0.40 × (P_overload × 100)</code>
          </div>

          <p className="text-[11.5px] text-muted-foreground leading-relaxed">
            Blends the directly observable volume ratio (60% weight) with the stochastic overload probability (40% weight). Strictly clamped within [0, 100].
          </p>
        </div>

        {/* Analytical Overload Probability Equation */}
        <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-mono-ui text-[10px] font-bold uppercase tracking-wider text-accent">
              2. Analytical Overload Probability
            </span>
            <span className="font-mono-ui text-[9px] text-muted-foreground">Normal Survival Function</span>
          </div>

          <div className="rounded-lg border border-border/60 bg-card p-3 font-mono-ui text-xs sm:text-[13px] font-bold text-foreground overflow-x-auto shadow-inner">
            <code>P(Demand &gt; Capacity) = 1 − Φ(z) = sf((Capacity − Effective_Demand) / σ)</code>
          </div>

          <p className="text-[11.5px] text-muted-foreground leading-relaxed">
            Evaluates Gaussian tail risk where <code className="text-foreground">Effective_Demand = max(0, Predicted_Demand)</code> and <code className="text-foreground">σ</code> is the held-out residual standard deviation.
          </p>
        </div>
      </div>

      {/* 4 Core Mathematical Pillars */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border/60 bg-card/60 p-3.5 space-y-1.5">
          <div className="flex items-center gap-1.5 font-display text-xs font-bold text-foreground">
            <Calculator size={13} className="text-primary" />
            <span>60% Utilization Weight</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Direct deterministic signal representing scheduled asset occupancy under predicted passenger flows.
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/60 p-3.5 space-y-1.5">
          <div className="flex items-center gap-1.5 font-display text-xs font-bold text-foreground">
            <Scale size={13} className="text-accent" />
            <span>40% Uncertainty Weight</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Stochastic modifier capturing tail dispersion and potential unmodeled surges above nominal capacity.
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/60 p-3.5 space-y-1.5">
          <div className="flex items-center gap-1.5 font-display text-xs font-bold text-foreground">
            <ShieldCheck size={13} className="text-risk-high" />
            <span>50% Elevation Rule</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            If P(overload) ≥ 0.50, classification is unconditionally elevated to at least HIGH regardless of the composite score.
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/60 p-3.5 space-y-1.5">
          <div className="flex items-center gap-1.5 font-display text-xs font-bold text-foreground">
            <CheckCircle size={13} className="text-risk-low" />
            <span>Held-Out Residual σ</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Uncertainty σ is calculated strictly on the 20% held-out test partition to avoid in-sample overfitting bias.
          </p>
        </div>
      </div>
    </section>
  );
}
