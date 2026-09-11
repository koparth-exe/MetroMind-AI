import { useMemo } from 'react';
import { Link } from 'wouter';
import { ShieldAlert, ShieldCheck, ChevronRight } from 'lucide-react';

interface RiskItem {
  name: string;
  value: number;
}

interface OverviewRiskDistributionProps {
  riskDistribution: RiskItem[];
  totalRoutes: number;
  averageUtilization: number;
  averageRisk?: number;
}

export function OverviewRiskDistribution({
  riskDistribution,
  totalRoutes,
  averageUtilization,
}: OverviewRiskDistributionProps) {
  const totalCount = useMemo(() => {
    const sum = riskDistribution.reduce((acc, cur) => acc + cur.value, 0);
    return sum > 0 ? sum : Math.max(1, totalRoutes);
  }, [riskDistribution, totalRoutes]);

  const maxRiskCount = useMemo(() => {
    return Math.max(1, ...riskDistribution.map((x) => x.value));
  }, [riskDistribution]);

  // High/Critical risk corridors count
  const criticalCount = useMemo(() => {
    return riskDistribution
      .filter((x) => ['high', 'critical'].includes(x.name.toLowerCase()))
      .reduce((acc, cur) => acc + cur.value, 0);
  }, [riskDistribution]);

  // Compute conic gradient ring using exact semantic tokens
  const ringBackground = useMemo(() => {
    let currentDeg = 0;
    const segments: string[] = [];

    riskDistribution.forEach((x) => {
      const deg = (x.value / totalCount) * 360;
      if (deg > 0) {
        const r = x.name.toLowerCase();
        const colorVar =
          r === 'critical'
            ? 'var(--risk-critical)'
            : r === 'high'
            ? 'var(--risk-high)'
            : r === 'medium'
            ? 'var(--risk-medium)'
            : 'var(--risk-low)';
        segments.push(`hsl(${colorVar}) ${currentDeg}deg ${currentDeg + deg}deg`);
        currentDeg += deg;
      }
    });

    return segments.length > 0
      ? `conic-gradient(${segments.join(', ')})`
      : 'hsl(var(--risk-low))';
  }, [riskDistribution, totalCount]);

  const getRiskColor = (name: string) => {
    const r = name.toLowerCase();
    if (r === 'critical') return 'text-risk-critical bg-risk-critical';
    if (r === 'high') return 'text-risk-high bg-risk-high';
    if (r === 'medium') return 'text-risk-medium bg-risk-medium';
    return 'text-risk-low bg-risk-low';
  };

  const getRiskBg = (name: string) => {
    const r = name.toLowerCase();
    if (r === 'critical') return 'bg-risk-critical';
    if (r === 'high') return 'bg-risk-high';
    if (r === 'medium') return 'bg-risk-medium';
    return 'bg-risk-low';
  };

  return (
    <section
      aria-label="Network Risk & Health Distribution"
      className="signal-card flex flex-col justify-between rounded-2xl p-5 sm:p-6"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/70 pb-3.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
            <h2 className="font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
              Risk Distribution
            </h2>
          </div>
          <span className="rounded-full border border-border/70 bg-muted/50 px-2.5 py-0.5 font-mono-ui text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
            {totalRoutes} Corridors
          </span>
        </div>

        {/* Ring & Breakdown Section */}
        <div className="mt-5 grid items-center gap-5 sm:grid-cols-[1fr_120px] lg:grid-cols-[1fr_130px]">
          {/* Risk Level Bars */}
          <div className="space-y-3.5">
            {riskDistribution.map((item) => {
              const pct = Math.round((item.value / totalCount) * 100);
              const barFill = (item.value / maxRiskCount) * 100;
              const bgClass = getRiskBg(item.name);

              return (
                <div key={item.name} className="group">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${bgClass}`} aria-hidden="true" />
                      <span className="font-semibold text-foreground">{item.name} Risk</span>
                    </span>
                    <div className="flex items-center gap-2 font-mono-ui">
                      <span className="font-bold tabular-nums text-foreground">{item.value}</span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">({pct}%)</span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${bgClass}`}
                      style={{ width: `${barFill}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Donut Ring Visual */}
          <div className="flex justify-center sm:justify-end">
            <div
              className="relative grid h-28 w-28 place-items-center rounded-full p-3 shadow-xs sm:h-32 sm:w-32"
              style={{ background: ringBackground }}
            >
              <div className="grid h-full w-full place-items-center rounded-full bg-card p-2 text-center shadow-inner select-none">
                <div className="font-display text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
                  {Math.round(averageUtilization * 100)}%
                </div>
                <div className="font-mono-ui text-[8.5px] font-bold uppercase tracking-wider text-muted-foreground">
                  Avg Utilization
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Bottom Signal Triage */}
      <div className="mt-6 border-t border-border/70 pt-4">
        <div
          className={`flex items-start gap-2.5 rounded-xl border p-3 ${
            criticalCount > 0
              ? 'border-risk-high/30 bg-risk-high/5 text-foreground'
              : 'border-risk-low/30 bg-risk-low/5 text-foreground'
          }`}
        >
          {criticalCount > 0 ? (
            <ShieldAlert size={16} className="text-risk-high shrink-0 mt-0.5" />
          ) : (
            <ShieldCheck size={16} className="text-risk-low shrink-0 mt-0.5" />
          )}
          <div className="min-w-0 flex-1 text-xs">
            <div className="font-bold text-foreground">
              {criticalCount > 0
                ? `${criticalCount} corridor${criticalCount > 1 ? 's' : ''} require allocation priority`
                : 'All corridors operate within normal limits'}
            </div>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
              {criticalCount > 0
                ? 'High passenger surges push capacity past safety thresholds in peak windows.'
                : 'Overcrowding probabilities remain below tolerance levels across active windows.'}
            </p>
          </div>
        </div>

        <div className="mt-3 text-right">
          <Link
            href="/risk"
            className="inline-flex items-center gap-1.5 font-mono-ui text-[11px] font-bold text-primary hover:underline"
            data-testid="link-view-risk-analysis"
          >
            <span>Inspect Risk Matrix</span>
            <ChevronRight size={13} />
          </Link>
        </div>
      </div>
    </section>
  );
}
