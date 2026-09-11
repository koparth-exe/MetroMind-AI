import { Link } from 'wouter';
import {
  BrainCircuit,
  Activity,
  Target,
  SlidersHorizontal,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';

export function OverviewNextActions() {
  const actions = [
    {
      href: '/prediction',
      label: 'Predictive Modeling',
      shortLabel: 'Run Prediction',
      icon: BrainCircuit,
      category: 'FORECAST',
      description: 'Test ML regression models against historical commute intervals with confidence bounds.',
    },
    {
      href: '/risk',
      label: 'Risk Assessment',
      shortLabel: 'Assess Risk',
      icon: Activity,
      category: 'SURVEILLANCE',
      description: 'Audit corridor overcrowding probabilities, standard error distributions, and thresholds.',
    },
    {
      href: '/optimization',
      label: 'Fleet Optimization',
      shortLabel: 'Optimize Fleet',
      icon: Target,
      category: 'DECISION',
      description: 'Solve deterministic linear programs to allocate available train sets and buses efficiently.',
    },
    {
      href: '/simulator',
      label: 'Scenario Simulator',
      shortLabel: 'Open Simulator',
      icon: SlidersHorizontal,
      category: 'STRESS TEST',
      description: 'Simulate monsoon rainfall shocks, holiday schedule disruptions, and special events.',
    },
  ];

  return (
    <section aria-label="Workflow Actions" className="mt-2">
      <div className="mb-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
          <h2 className="font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
            Operational Workflow Dispatch
          </h2>
        </div>
        <span className="font-mono-ui text-[10px] uppercase tracking-wider text-muted-foreground">
          Command Paths
        </span>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map(({ href, label, shortLabel, icon: Icon, category, description }) => (
          <Link
            key={href}
            href={href}
            className="group relative flex flex-col justify-between rounded-xl border border-border/75 bg-card/85 p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-card hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary"
            data-testid={`card-action-${shortLabel.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono-ui text-[9px] font-bold uppercase tracking-wider text-primary">
                  {category}
                </span>
                <Icon size={16} className="text-muted-foreground transition-colors group-hover:text-primary" />
              </div>

              <h3 className="mt-2 font-display text-sm font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                {label}
              </h3>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>

            <div className="mt-4 flex items-center gap-1 font-mono-ui text-[11px] font-bold text-primary">
              <span>{shortLabel}</span>
              <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
