import type { ScenarioType, Params } from '../lib/physics';
import { formatNum, projectileResults, inclineResults, pendulumResults } from '../lib/physics';

interface Props {
  scenario: ScenarioType | null;
  params: Params;
}

function Row({ label, expr, value }: { label: string; expr: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 border-b border-slate-800/60 last:border-0">
      <div className="min-w-0">
        <div className="text-xs text-slate-400">{label}</div>
        <div className="font-mono text-[13px] text-slate-200">{expr}</div>
      </div>
      <div className="font-mono text-sm font-semibold text-sky-300 whitespace-nowrap">{value}</div>
    </div>
  );
}

export default function FormulaBreakdown({ scenario, params }: Props) {
  if (scenario === null) {
    return (
      <p className="text-sm text-slate-500">
        Paste a problem above and press <span className="text-slate-300 font-medium">Visualize Problem</span> to see
        the step-by-step formula breakdown here.
      </p>
    );
  }
  if (scenario === 'projectile') {
    const r = projectileResults(params);
    return (
      <div>
        <p className="text-xs text-slate-400 mb-3">
          Projectile motion under constant gravity — horizontal and vertical motion are independent.
        </p>
        <Row label="Velocity components" expr="vx = v·cos θ,  vy = v·sin θ" value={`${formatNum(r.vx, 1)}, ${formatNum(r.vy, 1)} m/s`} />
        <Row label="Time of flight" expr="T = 2·v·sin θ / g" value={`${formatNum(r.flightTime)} s`} />
        <Row label="Max height" expr="H = vy² / (2g)" value={`${formatNum(r.maxHeight)} m`} />
        <Row label="Range" expr="R = v²·sin(2θ) / g" value={`${formatNum(r.range)} m`} />
      </div>
    );
  }
  if (scenario === 'incline') {
    const r = inclineResults(params);
    return (
      <div>
        <p className="text-xs text-slate-400 mb-3">
          Block sliding down a frictionless ramp — gravity's component along the slope drives it.
        </p>
        <Row label="Acceleration" expr="a = g·sin θ" value={`${formatNum(r.accel)} m/s²`} />
        <Row label="Time to bottom" expr="t = √(2L / a)" value={`${formatNum(r.timeToBottom)} s`} />
        <Row label="Speed at bottom" expr="v = √(2·a·L)" value={`${formatNum(r.finalSpeed)} m/s`} />
      </div>
    );
  }
  if (scenario === 'pendulum') {
    const r = pendulumResults(params);
    return (
      <div>
        <p className="text-xs text-slate-400 mb-3">
          Simple pendulum (small-angle behavior) — the period depends only on length and gravity.
        </p>
        <Row label="Period" expr="T = 2π·√(L / g)" value={`${formatNum(r.period)} s`} />
        <Row label="Frequency" expr="f = 1 / T" value={`${formatNum(r.frequency, 3)} Hz`} />
      </div>
    );
  }
  return null;
}
