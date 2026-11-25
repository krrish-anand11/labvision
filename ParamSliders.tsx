import type { ScenarioType } from '../lib/physics';

export interface SliderSpec {
  key: 'velocity' | 'angle' | 'mass' | 'length';
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  scenarios: ScenarioType[];
}

export const SLIDERS: SliderSpec[] = [
  { key: 'velocity', label: 'Initial Velocity', unit: 'm/s', min: 1, max: 60, step: 0.5, scenarios: ['projectile'] },
  { key: 'angle', label: 'Angle', unit: '°', min: 5, max: 85, step: 1, scenarios: ['projectile', 'incline', 'pendulum'] },
  { key: 'mass', label: 'Mass', unit: 'kg', min: 0.5, max: 20, step: 0.5, scenarios: ['projectile', 'incline', 'pendulum'] },
  { key: 'length', label: 'Length', unit: 'm', min: 1, max: 30, step: 0.5, scenarios: ['incline', 'pendulum'] },
];

interface Props {
  params: {
    velocity: number;
    angle: number;
    mass: number;
    length: number;
  };
  scenario: ScenarioType;
  onChange: (key: SliderSpec['key'], value: number) => void;
  gravity: number;
  onGravity: (g: number) => void;
}

export default function ParamSliders({ params, scenario, onChange, gravity, onGravity }: Props) {
  const visible = SLIDERS.filter((s) => s.scenarios.includes(scenario));
  const bodies: Array<{ name: string; g: number }> = [
    { name: 'Earth', g: 9.81 },
    { name: 'Moon', g: 1.62 },
    { name: 'Mars', g: 3.72 },
  ];

  return (
    <div className="space-y-4">
      {visible.map((s) => (
        <div key={s.key}>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-slate-300">{s.label}</label>
            <span className="font-mono text-xs text-sky-300">
              {params[s.key]} {s.unit}
            </span>
          </div>
          <input
            type="range"
            min={s.min}
            max={s.max}
            step={s.step}
            value={params[s.key]}
            onChange={(e) => onChange(s.key, parseFloat(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-slate-700 accent-sky-400 cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-sky-400
              [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(56,189,248,0.6)]
              [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
          />
        </div>
      ))}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-slate-300">Gravity</label>
          <span className="font-mono text-xs text-sky-300">{gravity} m/s²</span>
        </div>
        <input
          type="range"
          min={0.5}
          max={25}
          step={0.01}
          value={gravity}
          onChange={(e) => onGravity(parseFloat(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none bg-slate-700 accent-sky-400 cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-400
            [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(52,211,153,0.6)]
            [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
        />
        <div className="flex gap-2 mt-2">
          {bodies.map((b) => (
            <button
              key={b.name}
              onClick={() => onGravity(b.g)}
              className={`flex-1 text-xs py-1.5 rounded-lg border transition-all active:scale-95 ${
                Math.abs(gravity - b.g) < 0.01
                  ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-300'
                  : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-emerald-400/40 hover:text-emerald-300'
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
