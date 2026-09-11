import { BarChart2, TrendingUp, Info, ArrowRight, Gauge, HelpCircle } from 'lucide-react';
import { formatPercent, formatProbability } from './types';

interface RiskUtilizationProbabilityProps {
  utilization: number;
  probability: number;
  riskScore: number;
  uncertaintySigma: number;
  capacity: number;
  predictedDemand: number;
}

export function RiskUtilizationProbability({
  utilization,
  probability,
  riskScore,
  uncertaintySigma,
  capacity,
  predictedDemand,
}: RiskUtilizationProbabilityProps) {
  const utilScore = Math.round(Math.min(utilization * 100, 100) * 10) / 10;
  const probScore = Math.round(probability * 100 * 10) / 10;

  return (
    <section
      id="risk-util-prob"
      aria-label="Utilization versus Overload Probability Analysis"
      className="signal-card overflow-hidden rounded-2xl border border-border/80 bg-card/95 p-5 shadow-xs sm:p-6"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
            <h2 className="font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
              Capacity Utilization vs. Overload Probability
            </h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Deconstructing nominal demand volume from tail uncertainty risk.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/[0.04] px-3 py-1.5 text-xs text-primary font-mono-ui font-semibold">
          <span>Non-Equivalence Principle</span>
        </div>
      </div>

      {/* Side-by-Side Analytical Comparison */}
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {/* Left Column: Capacity Utilization */}
        <div className="rounded-2xl border border-primary/30 bg-primary/[0.03] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono-ui text-[10px] font-bold uppercase tracking-[.15em] text-primary">
                1. Capacity Utilization
              </span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono-ui text-[9px] font-bold text-primary">
                60% Score Weight
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground tabular-nums">
                {formatPercent(utilization)}
              </span>
              <span className="font-mono-ui text-xs text-muted-foreground">
                ({Math.round(predictedDemand).toLocaleString()} / {Math.round(capacity).toLocaleString()} pax)
              </span>
            </div>

            <div className="mt-3">
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(5, utilization * 100))}%` }}
                />
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs text-muted-foreground leading-relaxed">
              <div className="flex items-start gap-2">
                <BarChart2 size={14} className="text-primary shrink-0 mt-0.5" />
                <p>
                  <strong className="text-foreground">What it answers:</strong> "What proportion of nominal assigned capacity is projected to be consumed?"
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Info size={14} className="text-primary shrink-0 mt-0.5" />
                <p>
                  Direct observable ratio: <code className="font-mono-ui text-foreground bg-muted/60 px-1 py-0.5 rounded">max(0, demand) / capacity</code>.
                  It represents scheduled occupancy under point-estimate predictions.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-border/60 bg-muted/40 p-3 font-mono-ui text-[11px] text-foreground flex justify-between items-center">
            <span>Component Contribution:</span>
            <span className="font-bold text-primary tabular-nums">
              0.60 × {utilScore} = {(0.6 * utilScore).toFixed(1)} pts
            </span>
          </div>
        </div>

        {/* Right Column: Overload Probability */}
        <div className="rounded-2xl border border-accent/30 bg-accent/[0.03] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono-ui text-[10px] font-bold uppercase tracking-[.15em] text-accent">
                2. Overload Probability
              </span>
              <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono-ui text-[9px] font-bold text-accent">
                40% Score Weight
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground tabular-nums">
                {formatProbability(probability)}
              </span>
              <span className="font-mono-ui text-xs text-muted-foreground">
                (at residual σ = ±{Math.round(uncertaintySigma * 10) / 10})
              </span>
            </div>

            <div className="mt-3">
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(5, probability * 100))}%` }}
                />
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs text-muted-foreground leading-relaxed">
              <div className="flex items-start gap-2">
                <TrendingUp size={14} className="text-accent shrink-0 mt-0.5" />
                <p>
                  <strong className="text-foreground">What it answers:</strong> "How likely is actual passenger demand to breach nominal capacity in the statistical tail?"
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Gauge size={14} className="text-accent shrink-0 mt-0.5" />
                <p>
                  Derived from Gaussian survival function: <code className="font-mono-ui text-foreground bg-muted/60 px-1 py-0.5 rounded">1 − Φ((capacity − demand) / σ)</code> using held-out test residuals.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-border/60 bg-muted/40 p-3 font-mono-ui text-[11px] text-foreground flex justify-between items-center">
            <span>Component Contribution:</span>
            <span className="font-bold text-accent tabular-nums">
              0.40 × {probScore} = {(0.4 * probScore).toFixed(1)} pts
            </span>
          </div>
        </div>
      </div>

      {/* Connected Synthesis Footer */}
      <div className="mt-5 rounded-2xl border border-border/80 bg-muted/20 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-display text-sm font-bold text-foreground">
              <HelpCircle size={15} className="text-primary" />
              <span>Why High Utilization Does Not Always Equal High Risk</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
              An 81% utilization rate indicates high asset deployment, but if prediction error (σ) is small, the probability of exceeding 100% capacity remains negligible (&lt;1%). Conversely, even at 85% utilization, high residual uncertainty can generate substantial tail exceedance. MetroMind synthesizes both into an integrated risk index of <strong className="text-foreground">{riskScore} / 100</strong>.
            </p>
          </div>

          <div className="rounded-xl border border-border/70 bg-card p-3 font-mono-ui text-xs shrink-0 text-center sm:text-right">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Composite Index</div>
            <div className="text-lg font-bold text-foreground tabular-nums">{riskScore} / 100</div>
          </div>
        </div>
      </div>
    </section>
  );
}
