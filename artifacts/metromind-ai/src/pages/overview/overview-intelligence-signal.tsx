import { useMemo } from 'react';
import { Link } from 'wouter';
import { Sparkles, ArrowRight, History, CheckCircle, AlertTriangle } from 'lucide-react';
import type { RouteInsight } from '@workspace/api-client-react';

interface ActivityItem {
  title: string;
  detail: string;
  time: string;
}

interface OverviewIntelligenceSignalProps {
  routes: RouteInsight[];
  activity: ActivityItem[];
  availableFleet: number;
  recommendedAdditionalFleet: number;
  fleetUnitLabel: string;
  transportMode: 'RAILWAY' | 'BUS';
}

export function OverviewIntelligenceSignal({
  routes,
  activity,
  availableFleet,
  recommendedAdditionalFleet,
  fleetUnitLabel,
  transportMode,
}: OverviewIntelligenceSignalProps) {
  // Find highest pressure corridor
  const highestPressure = useMemo(() => {
    if (!routes || routes.length === 0) return null;
    return [...routes].reduce((max, cur) => (cur.utilization > max.utilization ? cur : max), routes[0]);
  }, [routes]);

  const peakUtilPct = highestPressure ? Math.round(highestPressure.utilization * 100) : 100;
  const isConstrained = peakUtilPct > 100;

  return (
    <section
      aria-label="Analytical Intelligence Signal & Operational Activity"
      className="grid gap-5 lg:grid-cols-[1.2fr_1fr]"
    >
      {/* Left: Derived Intelligence Briefing */}
      <div className="signal-card flex flex-col justify-between rounded-2xl p-5 sm:p-6">
        <div>
          <div className="flex items-center justify-between border-b border-border/70 pb-3.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
              <h2 className="font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
                Operational Signal Synthesis
              </h2>
            </div>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 font-mono-ui text-[9px] font-bold uppercase tracking-wider text-primary">
              Live Evaluation
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-muted/30 p-4">
              {isConstrained ? (
                <AlertTriangle size={18} className="text-risk-high shrink-0 mt-0.5" />
              ) : (
                <CheckCircle size={18} className="text-risk-low shrink-0 mt-0.5" />
              )}
              <div className="text-xs leading-relaxed">
                <div className="font-bold text-foreground sm:text-sm">
                  {isConstrained
                    ? `Peak constraint concentrated on ${highestPressure?.name} (${highestPressure?.routeId})`
                    : 'Network operating within design capacity buffer'}
                </div>
                <p className="mt-1 text-muted-foreground text-[12px] leading-5">
                  {highestPressure ? (
                    <>
                      Corridor <strong className="text-foreground">{highestPressure.routeId}</strong> is projected at{' '}
                      <strong className="text-foreground">{highestPressure.predictedDemand.toLocaleString()} pax/h</strong>{' '}
                      against a nominal capacity of <strong className="text-foreground">{highestPressure.capacity.toLocaleString()} pax</strong>{' '}
                      ({peakUtilPct}% utilization). Deploying{' '}
                      <strong className="text-primary">+{recommendedAdditionalFleet} {fleetUnitLabel}</strong> is advised to restore headroom.
                    </>
                  ) : (
                    'All transit corridors are currently operating within nominal baseline parameters.'
                  )}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-card/60 p-3.5 text-xs text-muted-foreground">
              <div className="font-mono-ui text-[9.5px] uppercase tracking-wider font-semibold text-foreground/80 mb-1">
                Recommendation Protocol
              </div>
              <p className="text-[11px] leading-relaxed">
                Deterministic mathematical optimization recommends prioritizing vehicle reallocation to high-risk corridors before evening peak.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border/70 pt-4">
          <Link
            href="/optimization"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 font-mono-ui text-xs font-bold text-primary-foreground shadow-xs hover:brightness-105 transition-all"
            data-testid="button-signal-optimize"
          >
            <span>Solve Fleet Optimization</span>
            <ArrowRight size={13} />
          </Link>
          <Link
            href="/analysis"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 font-mono-ui text-xs font-semibold text-foreground hover:bg-muted transition-colors"
            data-testid="button-signal-analysis"
          >
            <span>Explore Regressions</span>
          </Link>
        </div>
      </div>

      {/* Right: Operational Event Log */}
      <div className="signal-card flex flex-col justify-between rounded-2xl p-5 sm:p-6">
        <div>
          <div className="flex items-center justify-between border-b border-border/70 pb-3.5">
            <div className="flex items-center gap-2">
              <History size={15} className="text-primary" />
              <h2 className="font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
                Recent Operations Log
              </h2>
            </div>
            <span className="font-mono-ui text-[9.5px] uppercase tracking-wider text-muted-foreground">
              Audit Stream
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {activity.map((item, idx) => (
              <div
                key={item.title}
                className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/20 p-3 transition-colors hover:bg-muted/40"
              >
                <div
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                    idx === 0 ? 'bg-primary animate-pulse-line' : 'bg-muted-foreground/50'
                  }`}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-foreground truncate">{item.title}</span>
                    <span className="font-mono-ui text-[9px] uppercase text-muted-foreground shrink-0">
                      {item.time}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 text-right border-t border-border/70 pt-3">
          <Link
            href="/insights"
            className="inline-flex items-center gap-1 font-mono-ui text-[11px] font-bold text-primary hover:underline"
          >
            <span>Generate Executive Narrative</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </section>
  );
}
