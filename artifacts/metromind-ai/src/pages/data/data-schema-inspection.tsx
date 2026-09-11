import { useState } from 'react';
import { Table, CheckCircle2, CircleDot, Info, Filter, Hash, Sparkles } from 'lucide-react';
import type { SchemaFieldDefinition } from './types';

const SCHEMA_FIELDS: SchemaFieldDefinition[] = [
  {
    field: 'timestamp',
    type: 'ISO 8601 (String)',
    required: true,
    category: 'core',
    example: '2026-08-01T08:00:00Z',
    description: 'Hourly observation timestamp in UTC format.',
    analyticalRole: 'Temporal index driving 24h diurnal demand curve and Fourier seasonality analysis.',
  },
  {
    field: 'route_id',
    type: 'String (Registry Key)',
    required: true,
    category: 'core',
    example: 'R1 / B1',
    description: 'Corridor identifier matching Mumbai transit topology registry.',
    analyticalRole: 'Spatial key linking timetable rows to geographic polylines and fleet sizing.',
  },
  {
    field: 'station_id',
    type: 'String (Station Key)',
    required: true,
    category: 'core',
    example: 'CSMT / Kurla',
    description: 'Transit station node or monitored bus stop identifier.',
    analyticalRole: 'Node key used to detect bottleneck interchange hubs and passenger concentration.',
  },
  {
    field: 'passenger_count',
    type: 'Integer (>= 0)',
    required: true,
    category: 'core',
    example: '2,437',
    description: 'Observed passenger boardings during the hourly window.',
    analyticalRole: 'Primary target ground-truth signal for predictive models and risk evaluation.',
  },
  {
    field: 'day_of_week',
    type: 'Integer (0–6)',
    required: false,
    category: 'exogenous',
    example: '0 (Monday)',
    description: 'Calendar day index where 0 represents Monday and 6 represents Sunday.',
    analyticalRole: 'Feature capturing weekly variance and commuter weekday vs weekend shifts.',
  },
  {
    field: 'is_weekend',
    type: 'Boolean',
    required: false,
    category: 'exogenous',
    example: 'true / false',
    description: 'Binary flag indicating Saturday or Sunday service schedule.',
    analyticalRole: 'Exogenous feature distinguishing weekend headways and reduced commute surge.',
  },
  {
    field: 'is_holiday',
    type: 'Boolean',
    required: false,
    category: 'exogenous',
    example: 'true / false',
    description: 'Public or state holiday indicator.',
    analyticalRole: 'Covariate modeling structural passenger drops on non-working weekdays.',
  },
  {
    field: 'temperature',
    type: 'Float (°C)',
    required: false,
    category: 'exogenous',
    example: '28.5',
    description: 'Ambient temperature recorded during the hourly observation.',
    analyticalRole: 'Environmental feature utilized in OLS linear and multi-variable regression.',
  },
  {
    field: 'rainfall',
    type: 'Float (mm/h)',
    required: false,
    category: 'exogenous',
    example: '4.2',
    description: 'Precipitation intensity recorded across Mumbai metropolitan area.',
    analyticalRole: 'Key stress-testing factor used by Simulator to evaluate monsoon flood resilience.',
  },
  {
    field: 'special_event',
    type: 'Boolean',
    required: false,
    category: 'exogenous',
    example: 'true / false',
    description: 'Indicator for major events (cricket matches, festivals, political rallies).',
    analyticalRole: 'Surge modifier testing corridor capacity limits under non-standard demand.',
  },
];

export function DataSchemaInspection() {
  const [filterCategory, setFilterCategory] = useState<'all' | 'core' | 'exogenous'>('all');

  const filteredFields = SCHEMA_FIELDS.filter((f) => {
    if (filterCategory === 'all') return true;
    return f.category === filterCategory;
  });

  return (
    <section
      aria-label="Data Schema & Field Inspection"
      className="signal-card rounded-2xl p-5 sm:p-6 border border-border/80 bg-card/95 shadow-xs"
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
            <h2 className="font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
              Schema & Field Contract Specification
            </h2>
            <span className="rounded-full border border-border/70 bg-muted/50 px-2.5 py-0.5 font-mono-ui text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              10 Fields Verified
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Strict domain schema verified by MetroMind <code className="font-mono-ui text-primary font-bold">CsvDataValidator</code>. All uploaded timetable CSV files must conform to these column specifications.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 rounded-xl border border-border/70 bg-muted/30 p-1 font-mono-ui text-xs self-start sm:self-center">
          <button
            onClick={() => setFilterCategory('all')}
            className={`rounded-lg px-2.5 py-1 font-semibold transition-colors ${
              filterCategory === 'all'
                ? 'bg-primary text-primary-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All (10)
          </button>
          <button
            onClick={() => setFilterCategory('core')}
            className={`rounded-lg px-2.5 py-1 font-semibold transition-colors ${
              filterCategory === 'core'
                ? 'bg-primary text-primary-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Mandatory (4)
          </button>
          <button
            onClick={() => setFilterCategory('exogenous')}
            className={`rounded-lg px-2.5 py-1 font-semibold transition-colors ${
              filterCategory === 'exogenous'
                ? 'bg-primary text-primary-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Exogenous (6)
          </button>
        </div>
      </div>

      {/* Schema Fields Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="cockpit-table w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border/70 text-muted-foreground font-mono-ui text-[9px] uppercase tracking-wider">
              <th className="py-2.5 pl-3 pr-2">Field Name</th>
              <th className="py-2.5 px-2">Type</th>
              <th className="py-2.5 px-2">Contract</th>
              <th className="py-2.5 px-2">Example</th>
              <th className="py-2.5 px-2">Description</th>
              <th className="py-2.5 pr-3 pl-2">Role in MetroMind AI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 font-mono-ui">
            {filteredFields.map((field) => (
              <tr key={field.field} className="hover:bg-muted/25 transition-colors">
                <td className="py-3 pl-3 pr-2 font-bold text-foreground">
                  <span className="rounded bg-muted/60 px-2 py-0.5 text-primary border border-primary/20">
                    {field.field}
                  </span>
                </td>
                <td className="py-3 px-2 text-muted-foreground font-medium text-[11px]">
                  {field.type}
                </td>
                <td className="py-3 px-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wider ${
                      field.required
                        ? 'border border-primary/40 bg-primary/10 text-primary'
                        : 'border border-border/60 bg-muted/40 text-muted-foreground'
                    }`}
                  >
                    {field.required ? (
                      <>
                        <CheckCircle2 size={10} className="text-primary" />
                        <span>Mandatory</span>
                      </>
                    ) : (
                      <>
                        <CircleDot size={10} className="text-muted-foreground" />
                        <span>Optional</span>
                      </>
                    )}
                  </span>
                </td>
                <td className="py-3 px-2 text-muted-foreground text-[11px] tabular-nums font-semibold">
                  {field.example}
                </td>
                <td className="py-3 px-2 text-foreground font-sans text-xs">
                  {field.description}
                </td>
                <td className="py-3 pr-3 pl-2 text-muted-foreground font-sans text-xs max-w-xs">
                  {field.analyticalRole}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Contract Verification Footnote */}
      <div className="mt-4 pt-3.5 border-t border-border/60 flex items-center gap-2 text-xs text-muted-foreground">
        <Info size={14} className="text-primary shrink-0" />
        <span>
          CSV files missing any mandatory columns will be rejected by the validation quality gate with clear row diagnostics.
        </span>
      </div>
    </section>
  );
}
