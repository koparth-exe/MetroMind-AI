import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Sigma, Info, ShieldCheck, AlertCircle } from 'lucide-react';

export function SimulatorExplainer() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section
      id="simulator-explainer"
      aria-label="Simulation Mathematical Model Explainer"
      className="rounded-xl border border-border/70 bg-card/65 p-4 sm:p-5 shadow-sm space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
            <Sigma size={15} />
          </div>
          <div>
            <span className="font-mono-ui text-[10px] font-semibold uppercase tracking-wider text-primary">
              Mathematical Truth
            </span>
            <h2 className="font-display text-base font-bold text-foreground">
              How the Simulator Calculates This
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          data-testid="button-toggle-simulator-explainer"
          className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-background/80 px-2.5 py-1 text-xs font-mono-ui font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>{isOpen ? 'Collapse Methodology' : 'Inspect Equations'}</span>
          {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        MetroMind's Simulator is an algebraic stress-testing engine that applies compound sensitivity factors to baseline timetable observations. It calculates exact deterministic volume shifts and Gaussian exceedance probabilities.
      </p>

      {isOpen && (
        <div className="space-y-4 border-t border-border/50 pt-4 text-xs font-mono-ui text-muted-foreground animate-in fade-in duration-150">
          {/* 1. Demand Transformation Formula */}
          <div className="rounded-lg border border-border/60 bg-background/60 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-foreground font-bold">
              <span>1. Compound Demand Transformation Formula</span>
              <span className="text-[10px] text-primary">Deterministic Multiplier</span>
            </div>
            <div className="rounded bg-muted/30 p-2.5 text-[11px] text-foreground font-mono overflow-x-auto">
              Factor = demandMultiplier × (1.0 − 0.01 × rainfall) × (1.0 + 0.005 × (temperature − 20.0))
              <br />
              D_simulated(route) = round(D_baseline(route) × Factor, 1)
            </div>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-muted-foreground pt-1">
              <li><strong>Rainfall (R):</strong> Attenuates demand by 1% per millimeter (e.g. 40mm → 0.60x).</li>
              <li><strong>Temperature (T):</strong> Thermal sensitivity deviation: +0.5% per °C above 20°C reference.</li>
              <li><strong>Demand Multiplier (M):</strong> Direct uniform scalar representing commute surges.</li>
            </ul>
          </div>

          {/* 2. Objective Function & Residual Overcrowding */}
          <div className="rounded-lg border border-border/60 bg-background/60 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-foreground font-bold">
              <span>2. Objective Formulation (Unserved Overcrowding)</span>
              <span className="text-[10px] text-primary">Linear Metric</span>
            </div>
            <div className="rounded bg-muted/30 p-2.5 text-[11px] text-foreground font-mono">
              Z_unserved = Σ max(0.0, D_simulated(i) − Capacity(i))
            </div>
            <p className="text-[11px] leading-relaxed">
              Unlike 8H Optimization which applies a 5% unused-capacity penalty to prevent surplus vehicle deployment, the Simulator objective measures <strong>pure residual passenger volume exceeding corridor capacity</strong>.
            </p>
          </div>

          {/* 3. Gaussian Exceedance Risk Formulation */}
          <div className="rounded-lg border border-border/60 bg-background/60 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-foreground font-bold">
              <span>3. Simulated Exceedance Probability P(D &gt; C)</span>
              <span className="text-[10px] text-primary">Normal Survival Function</span>
            </div>
            <div className="rounded bg-muted/30 p-2.5 text-[11px] text-foreground font-mono">
              P(D &gt; C) = 1.0 − Φ((Capacity − D_simulated) / 150.0)
            </div>
            <p className="text-[11px] leading-relaxed">
              Evaluates the probability that passenger arrivals exceed allocated seats under a normal distribution with fixed residual standard deviation σ = 150.0. <em>This is an operational stress indicator and is distinct from the 4-tier composite score on the 8G Risk page.</em>
            </p>
          </div>

          {/* 4. Disclosures on Non-Active Parameters */}
          <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-1 text-[11px]">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <Info size={13} className="text-primary" />
              <span>Analytical Disclosures &amp; Operational Boundaries</span>
            </div>
            <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground text-[10.5px]">
              <li><strong>Nominal Capacity:</strong> Per-corridor capacity is fixed at 1 vehicle baseline. Dynamic fleet sizing is solved in Fleet Optimization.</li>
              <li><strong>Single-Corridor Isolation:</strong> Marking a line suspended zeroes local capacity and demand. Network passenger redistribution across alternate lines is not modeled.</li>
              <li><strong>Exogenous Parameters:</strong> Model estimators and holiday flags are omitted from simulation calculation.</li>
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
