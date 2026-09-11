import { Link } from 'wouter';
import { ArrowRight, BarChart3, TrendingUp, AlertTriangle, Cpu, Sparkles, Users, CheckCircle2 } from 'lucide-react';

export function DataNextSteps() {
  const workflows = [
    {
      step: '01',
      title: 'Statistical Analysis',
      path: '/analysis',
      icon: BarChart3,
      description: 'Review Pearson & Spearman correlation coefficients, fitted OLS regression equations, and Fourier diurnal periodicity.',
    },
    {
      step: '02',
      title: 'Demand Forecasting',
      path: '/prediction',
      icon: TrendingUp,
      description: 'Run ML demand models (Gradient Boosting, Random Forest) with 95% confidence intervals under customizable weather parameters.',
    },
    {
      step: '03',
      title: 'Risk & Overload Surveillance',
      path: '/risk',
      icon: AlertTriangle,
      description: 'Quantify Gaussian exceedance probability P(demand > capacity) per corridor to identify platform overcrowding hotspots.',
    },
    {
      step: '04',
      title: 'Fleet Optimization',
      path: '/optimization',
      icon: Cpu,
      description: 'Solve the vehicle buffer allocation problem via linear programming solver respecting total fleet limits.',
    },
    {
      step: '05',
      title: 'Disruption Simulation',
      path: '/simulator',
      icon: Sparkles,
      description: 'Stress-test baseline schedules under extreme monsoon rain surges, festival disruptions, and route closures.',
    },
    {
      step: '06',
      title: 'Passenger Intelligence',
      path: '/passenger',
      icon: Users,
      description: 'Monitor commuter boarding flows, 24-hour diurnal commute crests, and corridor capacity headroom.',
    },
  ];

  return (
    <section
      aria-label="Pipeline Workflow Dispatch"
      className="signal-card rounded-2xl p-5 sm:p-6 border border-border/80 bg-card/95 shadow-xs"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
            <h2 className="font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
              Next-Step Readiness & Downstream Dispatch
            </h2>
            <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 font-mono-ui text-[9px] font-bold uppercase tracking-wider text-primary">
              Telemetry Calibrated
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            With timetable telemetry validated, MetroMind analytical engines are fully primed. Dispatch directly into any operational workspace below.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {workflows.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              className="group relative flex flex-col justify-between rounded-xl border border-border/70 bg-card/60 p-4 transition-all hover:border-primary/50 hover:bg-muted/40 shadow-2xs hover:shadow-xs"
              data-testid={`link-dispatch-${item.path.slice(1)}`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono-ui text-[10px] font-bold text-primary tracking-wider">
                    STEP {item.step}
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-muted-foreground group-hover:border-primary/40 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Icon size={14} />
                  </div>
                </div>
                <div className="mt-2 font-display text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  {item.title}
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>

              <div className="mt-3.5 flex items-center gap-1 font-mono-ui text-[11px] font-bold text-primary group-hover:translate-x-0.5 transition-transform">
                <span>Launch Workspace</span>
                <ArrowRight size={12} />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
