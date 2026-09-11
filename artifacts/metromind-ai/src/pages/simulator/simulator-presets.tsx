import { CloudRain, Flame, Users, Sparkles, AlertTriangle, RotateCcw } from 'lucide-react';
import type { ScenarioPreset, TransportMode } from './types';

interface SimulatorPresetsProps {
  transportMode: TransportMode;
  activePresetId: string | null;
  onSelectPreset: (preset: ScenarioPreset) => void;
  onResetToBaseline: () => void;
  primaryRouteId: string;
}

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'nominal',
    name: 'Nominal Baseline',
    shortDesc: '0mm rain · 20°C · 1.00x demand',
    rainfall: 0,
    temperature: 20,
    demandMultiplier: 1.0,
    specialEvent: false,
    requiresRouteSuspension: false,
  },
  {
    id: 'monsoon',
    name: 'Monsoon Downpour',
    shortDesc: '40mm rain · 22°C · 1.20x demand',
    rainfall: 40,
    temperature: 22,
    demandMultiplier: 1.2,
    specialEvent: false,
    requiresRouteSuspension: false,
  },
  {
    id: 'peak-commute',
    name: 'Peak Commute Crest',
    shortDesc: '0mm rain · 28°C · 1.35x demand',
    rainfall: 0,
    temperature: 28,
    demandMultiplier: 1.35,
    specialEvent: false,
    requiresRouteSuspension: false,
  },
  {
    id: 'festival-surge',
    name: 'Major Festival Surge',
    shortDesc: '5mm rain · 26°C · 1.50x demand · event tag',
    rainfall: 5,
    temperature: 26,
    demandMultiplier: 1.5,
    specialEvent: true,
    requiresRouteSuspension: false,
  },
  {
    id: 'mainline-disruption',
    name: 'Mainline Disruption',
    shortDesc: '10mm rain · 24°C · 1.10x demand · trunk suspension',
    rainfall: 10,
    temperature: 24,
    demandMultiplier: 1.1,
    specialEvent: false,
    requiresRouteSuspension: true,
  },
];

export function SimulatorPresets({
  transportMode,
  activePresetId,
  onSelectPreset,
  onResetToBaseline,
  primaryRouteId,
}: SimulatorPresetsProps) {
  const getPresetIcon = (id: string) => {
    switch (id) {
      case 'nominal':
        return <RotateCcw size={13} className="text-primary" />;
      case 'monsoon':
        return <CloudRain size={13} className="text-cyan-400" />;
      case 'peak-commute':
        return <Flame size={13} className="text-amber-400" />;
      case 'festival-surge':
        return <Sparkles size={13} className="text-accent" />;
      case 'mainline-disruption':
        return <AlertTriangle size={13} className="text-risk-high" />;
      default:
        return <Users size={13} className="text-muted-foreground" />;
    }
  };

  return (
    <div id="simulator-presets" className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-mono-ui text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
          Scenario Presets
        </span>
        <button
          type="button"
          onClick={onResetToBaseline}
          data-testid="button-preset-reset"
          className="inline-flex items-center gap-1 font-mono-ui text-[10px] text-primary hover:text-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
        >
          <RotateCcw size={11} />
          <span>Reset to Baseline</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Scenario Preset Buttons">
        {SCENARIO_PRESETS.map((preset) => {
          const isSelected = activePresetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset)}
              data-testid={`button-preset-${preset.id}`}
              className={`group flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-left text-xs font-medium transition-all ${
                isSelected
                  ? 'border-primary bg-primary/10 text-primary shadow-xs'
                  : 'border-border/70 bg-card/70 text-muted-foreground hover:border-border hover:bg-card hover:text-foreground'
              }`}
            >
              {getPresetIcon(preset.id)}
              <div className="flex flex-col">
                <span className="font-semibold leading-tight">{preset.name}</span>
                <span className="font-mono-ui text-[9px] opacity-70 leading-tight mt-0.5">
                  {preset.shortDesc}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
