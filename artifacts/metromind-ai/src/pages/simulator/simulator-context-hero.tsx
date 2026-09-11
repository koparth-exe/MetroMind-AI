import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, AlertTriangle, CheckCircle2, TrendingUp, ShieldAlert, Sparkles, Layers } from 'lucide-react';
import type { SimulatorNetworkComparison } from './types';

interface SimulatorContextHeroProps {
  comparison: SimulatorNetworkComparison | null;
  baselineDemand: number;
  baselineCapacity: number;
  routeCount: number;
  hasExecutedScenario: boolean;
}

export function SimulatorContextHero({
  comparison,
  baselineDemand,
  baselineCapacity,
  routeCount,
  hasExecutedScenario,
}: SimulatorContextHeroProps) {
  // Formatters
  const fmt = (num: number) => Math.round(num).toLocaleString();
  const fmtDec = (num: number) => (Math.round(num * 10) / 10).toLocaleString(undefined, { minimumFractionDigits: 1 });

  if (!hasExecutedScenario || !comparison) {
    // READY / BASELINE-ONLY STATE
    return (
      <div id="simulator-context-hero" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="font-mono-ui text-xs font-semibold text-primary">
              BASELINE CALIBRATION ACTIVE · Awaiting Scenario Execution
            </span>
          </div>
          <span className="font-mono-ui text-[10px] text-muted-foreground">
            Click "Run Scenario Simulation" to evaluate operating conditions
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border/70 bg-card/60 p-4">
            <div className="font-mono-ui text-[9.5px] uppercase tracking-wider text-muted-foreground font-semibold">
              Baseline Timetable Demand
            </div>
            <div className="mt-2 font-display text-2xl font-bold text-foreground">
              {fmtDec(baselineDemand)} <span className="text-xs font-normal text-muted-foreground font-mono-ui">pax/h</span>
            </div>
            <p className="mt-1 font-mono-ui text-[10px] text-muted-foreground">
              Nominal reference timetable load
            </p>
          </div>

          <div className="rounded-xl border border-border/70 bg-card/60 p-4">
            <div className="font-mono-ui text-[9.5px] uppercase tracking-wider text-muted-foreground font-semibold">
              Nominal Service Capacity
            </div>
            <div className="mt-2 font-display text-2xl font-bold text-foreground">
              {fmt(baselineCapacity)} <span className="text-xs font-normal text-muted-foreground font-mono-ui">seats</span>
            </div>
            <p className="mt-1 font-mono-ui text-[10px] text-muted-foreground">
              {routeCount} corridors · 1 vehicle/corridor
            </p>
          </div>

          <div className="rounded-xl border border-border/70 bg-card/60 p-4">
            <div className="font-mono-ui text-[9.5px] uppercase tracking-wider text-muted-foreground font-semibold">
              Baseline Exceedance Risk
            </div>
            <div className="mt-2 font-display text-2xl font-bold text-foreground">
              0% <span className="text-xs font-normal text-muted-foreground font-mono-ui">probability</span>
            </div>
            <p className="mt-1 font-mono-ui text-[10px] text-muted-foreground">
              P(Demand &gt; Capacity) under standard bounds
            </p>
          </div>

          <div className="rounded-xl border border-border/70 bg-card/60 p-4">
            <div className="font-mono-ui text-[9.5px] uppercase tracking-wider text-muted-foreground font-semibold">
              Operational Corridors
            </div>
            <div className="mt-2 font-display text-2xl font-bold text-foreground">
              {routeCount} <span className="text-xs font-normal text-muted-foreground font-mono-ui">active</span>
            </div>
            <p className="mt-1 font-mono-ui text-[10px] text-muted-foreground">
              100% network corridors available
            </p>
          </div>
        </div>
      </div>
    );
  }

  // SCENARIO EXECUTED STATE
  const demandDeltaSign = comparison.demandDelta >= 0 ? '+' : '';
  const isDemandSurging = comparison.demandDelta > 0;
  const isUnservedWorse = comparison.simulatedUnserved > comparison.baselineUnserved;
  const isRiskWorse = comparison.simulatedRisk > comparison.baselineRisk;

  return (
    <div id="simulator-context-hero" className="space-y-3 animate-in fade-in duration-200">
      {/* Scenario Label Pill Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-gradient-to-r from-card/90 via-card/60 to-background/90 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-primary" />
          <span className="font-mono-ui text-xs font-bold text-foreground">
            {comparison.label || 'Scenario Output Evaluated'}
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono-ui text-[10.5px] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span>Dataset: <strong className="text-foreground">{comparison.datasetName}</strong></span>
          {comparison.suspendedCorridorsCount > 0 && (
            <span className="ml-2 rounded bg-destructive/15 px-1.5 py-0.5 font-bold text-destructive">
              {comparison.suspendedCorridorsCount} Corridor Suspended
            </span>
          )}
        </div>
      </div>

      {/* 4 Core Telemetry Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Projected Demand */}
        <div className="rounded-xl border border-border/70 bg-card/70 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono-ui text-[9.5px] uppercase tracking-wider text-muted-foreground font-semibold">
              Projected Demand
            </span>
            <span
              className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono-ui text-[10px] font-bold ${
                Math.abs(comparison.demandDelta) < 0.1
                  ? 'bg-muted text-muted-foreground'
                  : isDemandSurging
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'bg-cyan-500/15 text-cyan-400'
              }`}
            >
              {isDemandSurging ? <ArrowUpRight size={12} /> : comparison.demandDelta < 0 ? <ArrowDownRight size={12} /> : <Minus size={12} />}
              {demandDeltaSign}{comparison.demandDeltaPct.toFixed(1)}%
            </span>
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-foreground">
            {fmtDec(comparison.simulatedDemand)} <span className="text-xs font-normal text-muted-foreground font-mono-ui">pax/h</span>
          </div>
          <div className="mt-2 flex items-center justify-between font-mono-ui text-[10px] text-muted-foreground border-t border-border/50 pt-2">
            <span>Baseline: {fmtDec(comparison.baselineDemand)}</span>
            <span className="font-bold text-foreground">{demandDeltaSign}{fmtDec(comparison.demandDelta)} pax</span>
          </div>
        </div>

        {/* 2. Service Capacity */}
        <div className="rounded-xl border border-border/70 bg-card/70 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono-ui text-[9.5px] uppercase tracking-wider text-muted-foreground font-semibold">
              Service Capacity
            </span>
            <span
              className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono-ui text-[10px] font-bold ${
                comparison.capacityDelta < 0
                  ? 'bg-destructive/15 text-destructive'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {comparison.capacityDelta < 0 ? <ArrowDownRight size={12} /> : <Minus size={12} />}
              {comparison.capacityDelta < 0 ? `${comparison.capacityDelta} seats` : 'Unchanged'}
            </span>
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-foreground">
            {fmt(comparison.simulatedCapacity)} <span className="text-xs font-normal text-muted-foreground font-mono-ui">seats</span>
          </div>
          <div className="mt-2 flex items-center justify-between font-mono-ui text-[10px] text-muted-foreground border-t border-border/50 pt-2">
            <span>Baseline: {fmt(comparison.baselineCapacity)}</span>
            <span>{comparison.activeCorridorsCount} active lines</span>
          </div>
        </div>

        {/* 3. Residual Unserved Demand */}
        <div className="rounded-xl border border-border/70 bg-card/70 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono-ui text-[9.5px] uppercase tracking-wider text-muted-foreground font-semibold">
              Residual Overcrowding
            </span>
            <span
              className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono-ui text-[10px] font-bold ${
                comparison.simulatedUnserved > 0
                  ? 'bg-destructive/15 text-destructive'
                  : 'bg-primary/15 text-primary'
              }`}
            >
              {comparison.simulatedUnserved > 0 ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
              {comparison.simulatedUnserved > 0 ? `+${fmt(comparison.simulatedUnserved)} pax` : '0 unserved'}
            </span>
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-foreground">
            {fmt(comparison.simulatedUnserved)} <span className="text-xs font-normal text-muted-foreground font-mono-ui">pax</span>
          </div>
          <div className="mt-2 flex items-center justify-between font-mono-ui text-[10px] text-muted-foreground border-t border-border/50 pt-2">
            <span>Baseline: {fmt(comparison.baselineUnserved)} unserved</span>
            <span>Z = Σ max(0, D−C)</span>
          </div>
        </div>

        {/* 4. Simulated Exceedance Risk */}
        <div className="rounded-xl border border-border/70 bg-card/70 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono-ui text-[9.5px] uppercase tracking-wider text-muted-foreground font-semibold">
              Simulated Exceedance Risk
            </span>
            <span
              className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono-ui text-[10px] font-bold ${
                isRiskWorse ? 'bg-amber-500/15 text-amber-400' : 'bg-primary/15 text-primary'
              }`}
            >
              {isRiskWorse ? <ArrowUpRight size={12} /> : <Minus size={12} />}
              {isRiskWorse ? `+${(comparison.riskDelta * 100).toFixed(0)}%` : 'Nominal'}
            </span>
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-foreground">
            {(comparison.simulatedRisk * 100).toFixed(0)}% <span className="text-xs font-normal text-muted-foreground font-mono-ui">probability</span>
          </div>
          <div className="mt-2 flex items-center justify-between font-mono-ui text-[10px] text-muted-foreground border-t border-border/50 pt-2">
            <span>Baseline: {(comparison.baselineRisk * 100).toFixed(0)}%</span>
            <span>P(D &gt; C) at σ=150</span>
          </div>
        </div>
      </div>
    </div>
  );
}
