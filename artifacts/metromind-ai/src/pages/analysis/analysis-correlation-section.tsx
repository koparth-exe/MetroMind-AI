import { Info, HelpCircle, ArrowUpRight, ArrowDownRight, Layers, Clock, Thermometer, CloudRain, CalendarOff } from 'lucide-react';
import type { AnalysisCorrelationsItem } from '@workspace/api-client-react';

interface AnalysisCorrelationSectionProps {
  correlations: AnalysisCorrelationsItem[];
}

const VARIABLE_METADATA: Record<string, { label: string; unit: string; description: string; Icon: any }> = {
  hour: {
    label: 'Departure Hour',
    unit: '0–23 (UTC/IST)',
    description: 'Diurnal time of day index capturing commute windows',
    Icon: Clock,
  },
  temperature: {
    label: 'Ambient Temperature',
    unit: '°C Celsius',
    description: 'Local surface temperature observation',
    Icon: Thermometer,
  },
  rainfall: {
    label: 'Precipitation Volume',
    unit: 'mm / hr',
    description: 'Hourly monsoon rainfall intensity gauge',
    Icon: CloudRain,
  },
  is_holiday: {
    label: 'Public Holiday Flag',
    unit: 'Boolean (0/1)',
    description: 'Gazetted public and regional calendar holidays',
    Icon: CalendarOff,
  },
};

export function AnalysisCorrelationSection({ correlations }: AnalysisCorrelationSectionProps) {
  return (
    <section
      aria-label="Correlation Intelligence"
      className="signal-card rounded-2xl border border-border/80 bg-card/95 p-5 sm:p-6 shadow-xs"
    >
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
            <h2 className="font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
              Correlation Intelligence & Association Matrix
            </h2>
            <span className="rounded-full border border-border/70 bg-muted/50 px-2.5 py-0.5 font-mono-ui text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              Bivariate Analysis
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Quantify linear association (Pearson r) alongside monotonic rank agreement (Spearman ρ) across exogenous transit covariates.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono-ui text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-primary" /> Positive association
          </span>
          <span className="text-muted-foreground/40">·</span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-accent" /> Negative association
          </span>
        </div>
      </div>

      {/* Conceptual Distinction Callout Banner */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 rounded-xl border border-border/60 bg-muted/20 p-3.5 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-foreground">
            <span className="font-mono-ui text-[11px] text-primary">Pearson r</span>
            <span className="text-[10px] font-medium text-muted-foreground">· Linear Association</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Measures the strict degree of linear proportionality between variable and passenger demand. Values near +1.0 indicate direct scale surges.
          </p>
        </div>
        <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-border/60 pt-2 sm:pt-0 sm:pl-3.5">
          <div className="flex items-center gap-1.5 font-bold text-foreground">
            <span className="font-mono-ui text-[11px] text-primary">Spearman ρ</span>
            <span className="text-[10px] font-medium text-muted-foreground">· Monotonic Rank Association</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Measures rank order consistency regardless of linearity. When Spearman exceeds Pearson, non-linear curvature is actively present.
          </p>
        </div>
      </div>

      {/* Association Table */}
      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-left text-xs" data-testid="table-correlations">
          <thead>
            <tr className="border-b border-border/70 font-mono-ui text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="pb-3 pr-4 font-semibold">Exogenous Variable</th>
              <th className="pb-3 px-4 font-semibold text-center">Pearson r</th>
              <th className="pb-3 px-4 font-semibold text-center">Spearman ρ</th>
              <th className="pb-3 px-4 font-semibold">Normalized Magnitude (|r|)</th>
              <th className="pb-3 px-4 font-semibold">Strength</th>
              <th className="pb-3 pl-4 font-semibold">Empirical Interpretation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 font-mono-ui text-xs">
            {correlations.map((row) => {
              const meta = VARIABLE_METADATA[row.variable] ?? {
                label: row.variable,
                unit: 'raw covariate',
                description: 'Exogenous feature',
                Icon: Layers,
              };
              const Icon = meta.Icon;
              const isPos = row.pearson >= 0;
              const barWidth = Math.min(100, Math.max(4, Math.abs(row.pearson) * 100));

              return (
                <tr key={row.variable} className="hover:bg-muted/30 transition-colors">
                  {/* 1. Variable */}
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/40 text-primary">
                        <Icon size={14} />
                      </div>
                      <div>
                        <div className="font-bold text-foreground font-sans text-xs">
                          {meta.label}
                        </div>
                        <div className="font-mono-ui text-[10px] text-muted-foreground">
                          {row.variable} · <span className="text-muted-foreground/80">{meta.unit}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 2. Pearson r */}
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block font-bold text-sm tabular-nums ${
                        row.pearson === 0
                          ? 'text-muted-foreground'
                          : isPos
                          ? 'text-primary'
                          : 'text-accent'
                      }`}
                    >
                      {row.pearson > 0 ? `+${row.pearson.toFixed(2)}` : row.pearson.toFixed(2)}
                    </span>
                  </td>

                  {/* 3. Spearman ρ */}
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block font-semibold text-xs tabular-nums ${
                        row.spearman === 0
                          ? 'text-muted-foreground'
                          : row.spearman > 0
                          ? 'text-foreground'
                          : 'text-accent/90'
                      }`}
                    >
                      {row.spearman > 0 ? `+${row.spearman.toFixed(2)}` : row.spearman.toFixed(2)}
                    </span>
                  </td>

                  {/* 4. Magnitude Bar */}
                  <td className="py-3.5 px-4 w-44">
                    <div className="space-y-1">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isPos ? 'bg-primary' : 'bg-accent'
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-muted-foreground font-mono-ui">
                        <span>0.0</span>
                        <span>{Math.abs(row.pearson).toFixed(2)}</span>
                        <span>1.0</span>
                      </div>
                    </div>
                  </td>

                  {/* 5. Strength Badge */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider ${
                        row.strength.toLowerCase() === 'strong'
                          ? 'border-primary/40 bg-primary/10 text-primary'
                          : row.strength.toLowerCase() === 'moderate'
                          ? 'border-risk-medium/40 bg-risk-medium/10 text-risk-medium'
                          : 'border-border/60 bg-muted/40 text-muted-foreground'
                      }`}
                    >
                      {row.strength}
                    </span>
                  </td>

                  {/* 6. Empirical Read */}
                  <td className="py-3.5 pl-4 font-sans text-xs text-muted-foreground leading-relaxed max-w-xs">
                    {row.interpretation}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Analytical Footnote */}
      <div className="mt-4 border-t border-border/70 pt-3 text-[11px] leading-5 text-muted-foreground flex items-center justify-between">
        <span>
          Stability checkpoint: Feature correlations establish whether linear predictors have empirical foundation or merely random noise.
        </span>
        <span className="font-mono-ui text-[10px] text-muted-foreground/80">
          α = 0.05 two-tailed validation
        </span>
      </div>
    </section>
  );
}
