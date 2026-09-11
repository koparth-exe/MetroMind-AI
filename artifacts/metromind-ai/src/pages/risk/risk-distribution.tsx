import { useMemo } from 'react';
import { Layers, ShieldCheck, AlertCircle, ShieldAlert, Flame } from 'lucide-react';
import type { RouteRiskViewModel } from './types';

interface RiskDistributionProps {
  routes: RouteRiskViewModel[];
  transportMode: 'RAILWAY' | 'BUS';
}

export function RiskDistribution({ routes, transportMode }: RiskDistributionProps) {
  const counts = useMemo(() => {
    const result = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };
    routes.forEach((r) => {
      const lvl = r.riskLevel.toUpperCase() as keyof typeof result;
      if (result[lvl] !== undefined) {
        result[lvl] += 1;
      }
    });
    return result;
  }, [routes]);

  const total = Math.max(1, routes.length);

  const tiers = [
    {
      id: 'CRITICAL',
      label: 'Critical',
      scoreRange: '75–100',
      count: counts.CRITICAL,
      colorClass: 'bg-risk-critical',
      textColor: 'text-risk-critical',
      borderClass: 'border-risk-critical/30',
      bgClass: 'bg-risk-critical/[0.04]',
      icon: Flame,
    },
    {
      id: 'HIGH',
      label: 'High',
      scoreRange: '50–74',
      count: counts.HIGH,
      colorClass: 'bg-risk-high',
      textColor: 'text-risk-high',
      borderClass: 'border-risk-high/30',
      bgClass: 'bg-risk-high/[0.04]',
      icon: ShieldAlert,
    },
    {
      id: 'MEDIUM',
      label: 'Medium',
      scoreRange: '25–49',
      count: counts.MEDIUM,
      colorClass: 'bg-risk-medium',
      textColor: 'text-risk-medium',
      borderClass: 'border-risk-medium/30',
      bgClass: 'bg-risk-medium/[0.04]',
      icon: AlertCircle,
    },
    {
      id: 'LOW',
      label: 'Low',
      scoreRange: '0–24',
      count: counts.LOW,
      colorClass: 'bg-risk-low',
      textColor: 'text-risk-low',
      borderClass: 'border-risk-low/30',
      bgClass: 'bg-risk-low/[0.04]',
      icon: ShieldCheck,
    },
  ];

  return (
    <section
      id="risk-distribution"
      aria-label="Network Risk Distribution"
      className="signal-card overflow-hidden rounded-2xl border border-border/80 bg-card/95 p-5 shadow-xs sm:p-6"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
            <h2 className="font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
              Network Risk Tier Distribution
            </h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Authoritative breakdown of active {transportMode === 'BUS' ? 'BEST Bus' : 'Suburban Railway'} corridors by exposure tier.
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-lg border border-border/70 bg-muted/40 px-2.5 py-1 font-mono-ui text-[10px] font-semibold text-muted-foreground">
          <Layers size={11} />
          <span>{routes.length} Active Corridors</span>
        </div>
      </div>

      {/* Stacked Proportional Distribution Bar */}
      <div className="mt-6">
        <div className="h-3 w-full rounded-full bg-muted/50 overflow-hidden flex p-0.5 shadow-inner">
          {tiers.map((tier) => {
            const pct = (tier.count / total) * 100;
            if (pct <= 0) return null;
            return (
              <div
                key={tier.id}
                className={`h-full ${tier.colorClass} transition-all duration-500`}
                style={{ width: `${pct}%` }}
                title={`${tier.label}: ${tier.count} (${Math.round(pct)}%)`}
              />
            );
          })}
        </div>
      </div>

      {/* Breakdown Cards for each tier */}
      <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiers.map((tier) => {
          const Icon = tier.icon;
          const pct = Math.round((tier.count / total) * 100);
          return (
            <div
              key={tier.id}
              className={`rounded-xl border ${tier.borderClass} ${tier.bgClass} p-3.5 flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon size={13} className={tier.textColor} />
                  <span className={`font-mono-ui text-xs font-bold uppercase tracking-wider ${tier.textColor}`}>
                    {tier.label}
                  </span>
                </div>
                <span className="font-mono-ui text-[9.5px] text-muted-foreground">{tier.scoreRange}</span>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-2xl font-bold text-foreground tabular-nums">
                    {tier.count}
                  </span>
                  <span className="font-mono-ui text-xs text-muted-foreground">
                    {tier.count === 1 ? 'corridor' : 'corridors'}
                  </span>
                </div>
                <span className="font-mono-ui text-xs font-semibold text-muted-foreground">
                  {pct}%
                </span>
              </div>

              <div className="mt-2.5 h-1 w-full rounded-full bg-muted/70 overflow-hidden">
                <div
                  className={`h-full ${tier.colorClass} transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
