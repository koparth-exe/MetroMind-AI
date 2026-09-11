import { AlertCircle, CheckCircle2, ShieldAlert, Flame } from 'lucide-react';
import type { RiskLevel } from './types';

interface RiskScoreProps {
  score: number;
  level: RiskLevel;
  levelElevated?: boolean;
}

export function RiskScoreVisualization({
  score,
  level,
  levelElevated,
}: RiskScoreProps) {
  // Clamped position for marker [0..100]
  const markerPos = Math.max(0, Math.min(100, score));

  return (
    <section
      id="risk-score-scale"
      aria-label="Risk Score Visualization"
      className="signal-card overflow-hidden rounded-2xl border border-border/80 bg-card/95 p-5 shadow-xs sm:p-6"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
            <h2 className="font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
              Risk Score Calibration Scale
            </h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Linear composite indexing of capacity stress against authoritative Phase 5 thresholds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono-ui text-xs font-semibold text-muted-foreground">Active Score:</span>
          <span className="rounded-lg border border-border/80 bg-muted/50 px-2.5 py-1 font-mono-ui text-xs font-bold text-foreground tabular-nums">
            {score} / 100
          </span>
        </div>
      </div>

      {/* Visual Segmented Gauge Track */}
      <div className="mt-8 px-2 sm:px-4">
        {/* Needle Marker Indicator */}
        <div className="relative mb-2 w-full h-8">
          <div
            className="absolute -translate-x-1/2 flex flex-col items-center transition-all duration-500 ease-out"
            style={{ left: `${markerPos}%` }}
          >
            <div className="rounded bg-foreground px-2 py-0.5 font-mono-ui text-[10px] font-extrabold text-background shadow-md tabular-nums whitespace-nowrap">
              {score} · {level}
            </div>
            <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-foreground" />
          </div>
        </div>

        {/* Continuous Segmented Bar */}
        <div className="relative h-4 w-full rounded-full overflow-hidden flex bg-muted/60 p-0.5 shadow-inner">
          {/* Segment 1: LOW 0-25 */}
          <div
            className="h-full rounded-l-full bg-risk-low/80 flex items-center justify-center relative transition-all"
            style={{ width: '25%' }}
            title="LOW: 0–24.9"
          />
          {/* Segment 2: MEDIUM 25-50 */}
          <div
            className="h-full bg-risk-medium/80 flex items-center justify-center relative transition-all"
            style={{ width: '25%' }}
            title="MEDIUM: 25–49.9"
          />
          {/* Segment 3: HIGH 50-75 */}
          <div
            className="h-full bg-risk-high/80 flex items-center justify-center relative transition-all"
            style={{ width: '25%' }}
            title="HIGH: 50–74.9"
          />
          {/* Segment 4: CRITICAL 75-100 */}
          <div
            className="h-full rounded-r-full bg-risk-critical/80 flex items-center justify-center relative transition-all"
            style={{ width: '25%' }}
            title="CRITICAL: 75–100"
          />

          {/* Threshold Divider Lines */}
          <div className="absolute left-[25%] top-0 bottom-0 w-[1.5px] bg-background/80" />
          <div className="absolute left-[50%] top-0 bottom-0 w-[1.5px] bg-background/80" />
          <div className="absolute left-[75%] top-0 bottom-0 w-[1.5px] bg-background/80" />
        </div>

        {/* Ticks and Level Labels */}
        <div className="mt-2 flex justify-between font-mono-ui text-[10px] text-muted-foreground font-semibold">
          <span>0</span>
          <span className="text-center">25<br/><span className="text-[9px] font-bold text-risk-low">LOW</span></span>
          <span className="text-center">50<br/><span className="text-[9px] font-bold text-risk-medium">MEDIUM</span></span>
          <span className="text-center">75<br/><span className="text-[9px] font-bold text-risk-high">HIGH</span></span>
          <span className="text-right">100<br/><span className="text-[9px] font-bold text-risk-critical">CRITICAL</span></span>
        </div>
      </div>

      {/* Threshold Information Grid */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-risk-low/30 bg-risk-low/[0.04] p-3">
          <div className="flex items-center gap-1.5 font-mono-ui text-[10px] font-bold text-risk-low">
            <CheckCircle2 size={12} />
            <span>LOW (0–24)</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground leading-snug">
            Safe nominal headroom. Passenger demand is well below assigned vehicle capacity.
          </p>
        </div>

        <div className="rounded-xl border border-risk-medium/30 bg-risk-medium/[0.04] p-3">
          <div className="flex items-center gap-1.5 font-mono-ui text-[10px] font-bold text-risk-medium">
            <AlertCircle size={12} />
            <span>MEDIUM (25–49)</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground leading-snug">
            Moderate load. Demand approaches 70–85% of nominal capacity; minimal tail spillover.
          </p>
        </div>

        <div className="rounded-xl border border-risk-high/30 bg-risk-high/[0.04] p-3">
          <div className="flex items-center gap-1.5 font-mono-ui text-[10px] font-bold text-risk-high">
            <ShieldAlert size={12} />
            <span>HIGH (50–74)</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground leading-snug">
            Elevated strain. Demand nears full capacity or exceedance probability exceeds 50%.
          </p>
        </div>

        <div className="rounded-xl border border-risk-critical/30 bg-risk-critical/[0.04] p-3">
          <div className="flex items-center gap-1.5 font-mono-ui text-[10px] font-bold text-risk-critical">
            <Flame size={12} />
            <span>CRITICAL (75–100)</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground leading-snug">
            Severe capacity exceedance. Demand outstrips assigned fleet and creates station crowding.
          </p>
        </div>
      </div>

      {/* Elevation Rule Note */}
      {levelElevated && (
        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-risk-high/40 bg-risk-high/[0.08] p-3 text-xs text-foreground">
          <ShieldAlert size={15} className="text-risk-high shrink-0" />
          <span>
            <strong>Overload Probability Elevation Rule Active:</strong> Because estimated tail exceedance probability meets or exceeds 50%, the risk tier was elevated to at least <strong>HIGH</strong> regardless of composite score.
          </span>
        </div>
      )}
    </section>
  );
}
