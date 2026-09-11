import { FileText, CheckCircle, AlertTriangle, ShieldAlert, Sparkles } from 'lucide-react';
import type { NetworkRiskSummary, RouteRiskViewModel } from './types';
import { formatPercent, formatProbability } from './types';

interface RiskInterpretationProps {
  summary: NetworkRiskSummary;
  highestRoute?: RouteRiskViewModel;
  transportMode: 'RAILWAY' | 'BUS';
}

export function RiskInterpretation({
  summary,
  highestRoute,
  transportMode,
}: RiskInterpretationProps) {
  const isBus = transportMode === 'BUS';
  const unit = isBus ? 'bus' : 'train set';
  const networkName = isBus ? 'BEST Bus network' : 'Suburban Railway system';

  // Deterministic statement 1: Capacity Regime
  let capacityRegime = '';
  if (summary.averageUtilization >= 1.0) {
    capacityRegime = `Aggregate demand across the ${networkName} exceeds nominal fleet capacity (${formatPercent(summary.averageUtilization)} average utilization), representing widespread corridor overload during peak operations.`;
  } else if (summary.averageUtilization >= 0.85) {
    capacityRegime = `Capacity utilization is significantly elevated at ${formatPercent(summary.averageUtilization)}, meaning corridors are operating near maximum seated and standing thresholds with limited nominal headroom.`;
  } else if (summary.averageUtilization >= 0.70) {
    capacityRegime = `Average network utilization is moderate at ${formatPercent(summary.averageUtilization)}. While general service remains balanced, peak commute crests generate localized corridor pressure.`;
  } else {
    capacityRegime = `Predicted demand is comfortably below assigned fleet capacity across the network (${formatPercent(summary.averageUtilization)} utilization), leaving substantial headroom for unexpected surges.`;
  }

  // Deterministic statement 2: Tail Uncertainty
  let uncertaintyRegime = '';
  if (summary.maxOverloadProbability >= 0.5) {
    uncertaintyRegime = `At least one priority corridor exhibits an exceedance probability of ${formatProbability(summary.maxOverloadProbability)} under model residual uncertainty (σ = ±${Math.round(summary.uncertaintySigma)} pax/h), triggering mandatory operational elevation to HIGH/CRITICAL.`;
  } else if (summary.maxOverloadProbability >= 0.15) {
    uncertaintyRegime = `Residual uncertainty introduces a moderate exceedance risk (peak ${formatProbability(summary.maxOverloadProbability)}), suggesting that unmodeled peak spikes could push specific corridors into standing crush conditions.`;
  } else {
    uncertaintyRegime = `Estimated overload probabilities remain minimal (&lt;1% across most lines), demonstrating that model residual dispersion is well within physical vehicle capacity margins.`;
  }

  // Deterministic statement 3: Prescribed Action
  const actionRegime = highestRoute && highestRoute.riskScore >= 50
    ? `Operational intervention is prioritized on ${highestRoute.name} (${highestRoute.routeId}), where risk score stands at ${highestRoute.riskScore}/100. Transit dispatchers should allocate additional ${unit} reserves via Phase 8H Optimization.`
    : `Current network distribution is stable. Regular headway monitoring and standard buffer allocation are sufficient for baseline operations.`;

  return (
    <section
      id="risk-interpretation"
      aria-label="Operational Synthesis and Interpretation"
      className="signal-card overflow-hidden rounded-2xl border border-border/80 bg-card/95 p-5 shadow-xs sm:p-6"
    >
      <div className="flex items-center gap-2 border-b border-border/60 pb-4">
        <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
          <FileText size={16} />
        </div>
        <div>
          <h2 className="font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
            Operational Interpretation & Strategic Briefing
          </h2>
          <p className="text-xs text-muted-foreground">
            Deterministic synthesis derived directly from live mathematical model evaluations.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {/* Point 1 */}
        <div className="rounded-xl border border-border/70 bg-muted/25 p-4 space-y-2">
          <div className="flex items-center gap-1.5 font-display text-xs font-bold text-foreground">
            <CheckCircle size={14} className="text-primary" />
            <span>Capacity Utilization State</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {capacityRegime}
          </p>
        </div>

        {/* Point 2 */}
        <div className="rounded-xl border border-border/70 bg-muted/25 p-4 space-y-2">
          <div className="flex items-center gap-1.5 font-display text-xs font-bold text-foreground">
            <AlertTriangle size={14} className="text-accent" />
            <span>Tail Exceedance Exposure</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: uncertaintyRegime }} />
        </div>

        {/* Point 3 */}
        <div className="rounded-xl border border-border/70 bg-muted/25 p-4 space-y-2">
          <div className="flex items-center gap-1.5 font-display text-xs font-bold text-foreground">
            <ShieldAlert size={14} className="text-risk-high" />
            <span>Recommended Triage</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {actionRegime}
          </p>
        </div>
      </div>
    </section>
  );
}
