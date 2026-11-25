import { useCallback, useState } from 'react';
import {
  Play, Pause, RotateCcw, Radar, Mountain, Clock3, Zap, FlaskConical, Sigma,
} from 'lucide-react';
import SimCanvas from './components/SimCanvas';
import ParamSliders, { type SliderSpec } from './components/ParamSliders';
import FormulaBreakdown from './components/FormulaBreakdown';
import { parseProblem, type ParseResult } from './lib/parser';
import type { ScenarioType, Params } from './lib/physics';
import { DEFAULT_PARAMS } from './lib/physics';

const PRESETS = [
  {
    label: 'Cannonball Launch',
    sub: 'Projectile',
    icon: Radar,
    scenario: 'projectile' as ScenarioType,
    text: 'A 5 kg cannonball is launched at 25 m/s at an angle of 40 degrees on Earth',
    params: { velocity: 25, angle: 40, mass: 5, gravity: 9.81, length: 15 },
  },
  {
    label: 'Ski Slope',
    sub: 'Inclined Ramp',
    icon: Mountain,
    scenario: 'incline' as ScenarioType,
    text: 'A 60 kg skier slides down a frictionless ramp 15 m long inclined at 30 degrees on Earth',
    params: { velocity: 0, angle: 30, mass: 60, gravity: 9.81, length: 15 },
  },
  {
    label: 'Grandfather Clock',
    sub: 'Pendulum',
    icon: Clock3,
    scenario: 'pendulum' as ScenarioType,
    text: 'A grandfather clock pendulum swings with a 2 m long string on the Moon',
    params: { velocity: 0, angle: 25, mass: 2, gravity: 1.62, length: 2 },
  },
];

const SCENARIO_META: Record<ScenarioType, { title: string; icon: typeof Radar; blurb: string }> = {
  projectile: { title: 'Projectile Motion', icon: Radar, blurb: 'A body launched at an angle, tracing a parabola under gravity.' },
  incline: { title: 'Inclined Ramp', icon: Mountain, blurb: 'A block accelerating down a frictionless slope.' },
  pendulum: { title: 'Simple Pendulum', icon: Clock3, blurb: 'A mass swinging on a string, trading height for speed.' },
};

export default function App() {
  const [text, setText] = useState('');
  const [scenario, setScenario] = useState<ScenarioType | null>(null);
  const [params, setParams] = useState<Params>(DEFAULT_PARAMS);
  const [running, setRunning] = useState(false);
  const [parseInfo, setParseInfo] = useState<ParseResult | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [simKey, setSimKey] = useState(0);

  const applyScenario = useCallback((s: ScenarioType, overrides: Partial<Params> = {}) => {
    setScenario(s);
    setParams((p) => ({ ...p, ...overrides }));
    setRunning(false);
  }, []);

  const handleVisualize = useCallback(() => {
    if (!text.trim()) {
      setNotice('Type or paste a problem first — or tap a preset below.');
      return;
    }
    const result = parseProblem(text);
    setParseInfo(result);
    if (!result.scenario) {
      setNotice("Couldn't recognize a scenario. Mention a launch, a ramp/slope, or a pendulum/clock.");
      return;
    }
    setNotice(null);
    applyScenario(result.scenario, result.extracted as Partial<Params>);
    setSimKey((k) => k + 1);
    setRunning(true);
  }, [text, applyScenario]);

  const handlePreset = useCallback(
    (p: (typeof PRESETS)[number]) => {
      setText(p.text);
      setParseInfo(null);
      setNotice(null);
      applyScenario(p.scenario, p.params);
      setSimKey((k) => k + 1);
      setRunning(true);
    },
    [applyScenario],
  );

  const handleParam = useCallback((key: SliderSpec['key'], value: number) => {
    setParams((p) => ({ ...p, [key]: value }));
    setRunning(false);
  }, []);

  const handleGravity = useCallback((g: number) => {
    setParams((p) => ({ ...p, gravity: g }));
    setRunning(false);
  }, []);

  const replay = useCallback(() => {
    setSimKey((k) => k + 1);
    setRunning(true);
  }, []);

  const meta = scenario ? SCENARIO_META[scenario] : null;
  const ScenarioIcon = meta?.icon;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <FlaskConical className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight leading-none">LabVision</h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Physics word problems, visualized</p>
          </div>
          <span className="ml-auto hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 border border-slate-800 rounded-full px-3 py-1">
            <Zap className="w-3 h-3 text-amber-400" /> Runs 100% in your browser
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid lg:grid-cols-[400px_1fr] gap-6 items-start">
        {/* LEFT PANEL */}
        <section className="space-y-5 lg:sticky lg:top-[73px]">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <label className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Sigma className="w-4 h-4 text-sky-400" /> Your physics problem
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder='e.g. "A 5 kg ball is launched at 25 m/s at an angle of 40 degrees on Earth"'
              rows={4}
              className="w-full rounded-xl bg-slate-950/80 border border-slate-700 focus:border-sky-500 outline-none p-3 text-sm placeholder:text-slate-600 resize-none transition-colors"
            />
            <button
              onClick={handleVisualize}
              className="mt-3 w-full py-2.5 rounded-xl font-semibold text-sm text-white
                bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400
                shadow-lg shadow-sky-500/25 active:scale-[0.98] transition-all"
            >
              Visualize Problem
            </button>

            {notice && (
              <p className="mt-3 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                {notice}
              </p>
            )}

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => handlePreset(p)}
                  className={`group flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border text-center transition-all active:scale-95 ${
                    scenario === p.scenario
                      ? 'bg-sky-500/10 border-sky-500/50'
                      : 'bg-slate-800/50 border-slate-700 hover:border-sky-500/40 hover:bg-slate-800'
                  }`}
                >
                  <p.icon className="w-[18px] h-[18px] text-sky-400" />
                  <span className="text-[11px] font-semibold leading-tight">{p.label}</span>
                  <span className="text-[10px] text-slate-500 leading-none">{p.sub}</span>
                </button>
              ))}
            </div>

            {parseInfo && (
              <div className="mt-4 text-xs text-slate-400 bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2">
                <span className="text-slate-500">Detected:</span>{' '}
                <span className="text-emerald-400 font-medium">{meta?.title}</span>
                {parseInfo.matched.length > 0 && <> · {parseInfo.matched.join(', ')}</>}
              </div>
            )}
          </div>

          {/* Formula breakdown */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Sigma className="w-4 h-4 text-emerald-400" /> Step-by-Step Formula Breakdown
            </h2>
            <FormulaBreakdown scenario={scenario} params={params} />
          </div>
        </section>

        {/* RIGHT PANEL */}
        <section className="space-y-5">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {ScenarioIcon && (
                <>
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center">
                    <ScenarioIcon className="w-4 h-4 text-sky-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold leading-tight">{meta.title}</h2>
                    <p className="text-[11px] text-slate-500">{meta.blurb}</p>
                  </div>
                </>
              )}
              <div className="ml-auto flex gap-2">
                <button
                  onClick={() => setRunning((r) => !r)}
                  disabled={!scenario}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25"
                >
                  {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {running ? 'Pause' : 'Play'}
                </button>
                <button
                  onClick={replay}
                  disabled={!scenario}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed bg-slate-800 border border-slate-700 text-slate-300 hover:border-sky-500/40 hover:text-sky-300"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Replay
                </button>
              </div>
            </div>

            {scenario ? (
              <SimCanvas key={simKey} scenario={scenario} params={params} running={running} onDone={() => setRunning(false)} />
            ) : (
              <div className="h-[340px] sm:h-[420px] rounded-xl border border-dashed border-slate-700 bg-slate-950 flex flex-col items-center justify-center gap-3 text-center px-6">
                <FlaskConical className="w-10 h-10 text-slate-700" />
                <p className="text-sm text-slate-500 max-w-xs">
                  Visualize a problem or tap a preset to launch a live simulation with velocity vectors and telemetry.
                </p>
              </div>
            )}
          </div>

          {/* Sliders */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <h2 className="text-sm font-semibold mb-4">Simulation Parameters</h2>
            {scenario ? (
              <ParamSliders
                params={params}
                scenario={scenario}
                onChange={handleParam}
                gravity={params.gravity}
                onGravity={handleGravity}
              />
            ) : (
              <p className="text-sm text-slate-500">Pick a scenario to unlock the parameter sliders.</p>
            )}
          </div>
        </section>
      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-center text-[11px] text-slate-600">
        LabVision — built for physics students. All computation happens locally in your browser.
      </footer>
    </div>
  );
}
