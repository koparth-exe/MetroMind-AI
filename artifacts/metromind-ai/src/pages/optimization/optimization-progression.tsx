import { Link } from 'wouter';
import { ArrowRight, Play, CheckCircle2, ShieldAlert, Waypoints, Cpu } from 'lucide-react';
import type { TransportMode } from '@/lib/transport-mode';
import { getModeNomenclature } from './types';

interface OptimizationProgressionProps {
  transportMode: TransportMode;
}

export function OptimizationProgression({ transportMode }: OptimizationProgressionProps) {
  const mode = getModeNomenclature(transportMode);

  return (
    <section
      id="optimization-progression"
      aria-label="Workflow Progression to Simulator"
      className="signal-card overflow-hidden rounded-2xl border border-primary/30 bg-primary/[0.03] p-5 shadow-xs sm:p-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="font-mono-ui text-[10px] font-bold uppercase tracking-[.18em] text-primary">
              PIPELINE PROGRESSION · 8H → 8I
            </span>
            <span className="h-1 w-1 rounded-full bg-border" aria-hidden="true" />
            <span className="font-mono-ui text-[10px] text-muted-foreground">
              Stress-Test Decisions
            </span>
          </div>

          <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-foreground">
            Continue to Simulator
          </h2>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Now that fleet allocation has been optimized for nominal conditions, stress-test the {mode.networkTitle} under severe rainfall, commute spikes, and unexpected corridor suspensions in the Simulator.
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
              <CheckCircle2 size={11} className="text-primary" /> 8F Forecast
            </span>
            <span>→</span>
            <span className="inline-flex items-center gap-1 text-foreground">
              <ShieldAlert size={11} className="text-risk-medium" /> 8G Risk
            </span>
            <span>→</span>
            <span className="inline-flex items-center gap-1 text-primary font-bold">
              <Waypoints size={11} /> 8H Optimization
            </span>
            <span>→</span>
            <span className="font-bold text-foreground">
              8I Simulator
            </span>
          </div>
        </div>

        <Link
          href="/simulator"
          data-testid="button-optimization-to-simulator"
          className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-primary px-6 py-3 text-xs sm:text-sm font-bold text-primary-foreground shadow-sm hover:brightness-110 active:scale-[0.98] transition-all shrink-0 cursor-pointer self-start md:self-center"
        >
          <Play size={15} />
          <span>Continue to Simulator</span>
          <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
