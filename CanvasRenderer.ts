import type { ScenarioType, Params, SimState } from '../lib/physics';
import { getKinematics } from '../lib/physics';

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function boundsFor(p: Params, scenario: ScenarioType): Bounds {
  if (scenario === 'projectile') {
    const th = (p.angle * Math.PI) / 180;
    const range = (p.velocity * p.velocity * Math.sin(2 * th)) / p.gravity;
    const h = (p.velocity * p.velocity * Math.sin(th) * Math.sin(th)) / (2 * p.gravity);
    const padX = Math.max(range * 0.12, 1);
    const padY = Math.max(h * 0.2, 1);
    return { minX: -padX, minY: -padY * 0.6, maxX: range + padX, maxY: h + padY };
  }
  if (scenario === 'incline') {
    const th = (p.angle * Math.PI) / 180;
    const w = p.length * Math.cos(th);
    const h = p.length * Math.sin(th);
    return { minX: -w * 0.15, minY: -h * 0.15, maxX: w * 1.15, maxY: h * 1.3 };
  }
  const r = p.length * 1.25;
  return { minX: -r, minY: -r - p.length * 0.1, maxX: r, maxY: p.length * 1.15 };
}

function worldToScreen(x: number, y: number, b: Bounds, w: number, h: number, marginTop: number) {
  const spanX = b.maxX - b.minX;
  const spanY = b.maxY - b.minY;
  const scale = Math.min((w - 80) / spanX, (h - marginTop - 30) / spanY);
  const offX = (w - spanX * scale) / 2;
  const oy = (h - marginTop + 20 - spanY * scale) / 2 + marginTop;
  return { sx: offX + (x - b.minX) * scale, sy: oy + (b.maxY - y) * scale, scale };
}

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.strokeStyle = 'rgba(148,163,184,0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

function arrow(ctx: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number, color: string, label: string) {
  const len = Math.hypot(dx, dy);
  if (len < 4) return;
  const ux = dx / len;
  const uy = dy / len;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + dx, y + dy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + dx, y + dy);
  ctx.lineTo(x + dx - 10 * ux + 5 * uy, y + dy - 10 * uy - 5 * ux);
  ctx.lineTo(x + dx - 10 * ux - 5 * uy, y + dy - 10 * uy + 5 * ux);
  ctx.closePath();
  ctx.fill();
  ctx.font = '600 12px ui-sans-serif, system-ui, sans-serif';
  ctx.fillText(label, x + dx + 8 * ux, y + dy + 8 * uy);
}

export interface DrawOptions {
  scenario: ScenarioType;
  params: Params;
  state: SimState;
  trail: Array<{ x: number; y: number }>;
  running: boolean;
}

export function drawScene(ctx: CanvasRenderingContext2D, w: number, h: number, dpr: number, o: DrawOptions) {
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#0b1220');
  bg.addColorStop(1, '#0f172a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  drawGrid(ctx, w, h);

  const b = boundsFor(o.params, o.scenario);
  const marginTop = 56;
  const to = (x: number, y: number) => worldToScreen(x, y, b, w, h, marginTop);

  const kin = getKinematics(o.state, o.params, o.scenario);

  // Telemetry overlay
  ctx.fillStyle = 'rgba(15,23,42,0.85)';
  ctx.fillRect(10, 10, 236, 40 + 16);
  ctx.strokeStyle = 'rgba(148,163,184,0.25)';
  ctx.strokeRect(10, 10, 236, 40 + 16);
  ctx.fillStyle = '#7dd3fc';
  ctx.font = '600 13px ui-monospace, monospace';
  ctx.fillText(`t = ${o.state.t.toFixed(2)} s`, 22, 30);
  ctx.fillStyle = '#a5b4fc';
  ctx.fillText(`(x, y) = (${kin.x.toFixed(1)}, ${kin.y.toFixed(1)}) m`, 22, 48);
  ctx.fillStyle = '#6ee7b7';
  ctx.fillText(`|v| = ${kin.speed.toFixed(1)} m/s`, 130, 48);

  const proj = o.scenario === 'projectile';
  const k = kin;

  if (o.scenario === 'projectile') {
    // ground
    const g0 = to(0, 0);
    ctx.strokeStyle = 'rgba(148,163,184,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, g0.sy);
    ctx.lineTo(w - 20, g0.sy);
    ctx.stroke();

    // trail
    if (o.trail.length > 1) {
      ctx.strokeStyle = 'rgba(56,189,248,0.65)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      o.trail.forEach((pt, i) => {
        const s = to(pt.x, pt.y);
        if (i === 0) ctx.moveTo(s.sx, s.sy);
        else ctx.lineTo(s.sx, s.sy);
      });
      ctx.stroke();
    }

    // ball
    const p0 = to(k.x, k.y);
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(p0.sx, p0.sy, 8, 0, Math.PI * 2);
    ctx.fill();

    // velocity vectors
    const vs = Math.min(3, 90 / Math.max(1, o.params.velocity));
    const { scale } = to(k.x, k.y);
    arrow(ctx, p0.sx, p0.sy, k.vx * vs, -k.vy * vs, '#fb923c', 'v');
    arrow(ctx, p0.sx, p0.sy, k.vx * vs, 0, 'rgba(251,146,60,0.6)', 'vx');
    arrow(ctx, p0.sx, p0.sy, 0, -k.vy * vs, 'rgba(251,146,60,0.6)', 'vy');
    void scale;
  } else if (o.scenario === 'incline') {
    const th = (o.params.angle * Math.PI) / 180;
    const base = to(0, 0);
    const top = to(o.params.length * Math.cos(th), o.params.length * Math.sin(th));

    // ramp
    ctx.beginPath();
    ctx.moveTo(base.sx, base.sy);
    ctx.lineTo(top.sx, top.sy);
    ctx.lineTo(top.sx, base.sy);
    ctx.closePath();
    ctx.fillStyle = 'rgba(100,116,139,0.25)';
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(base.sx, base.sy);
    ctx.lineTo(top.sx, top.sy);
    ctx.stroke();

    // angle label
    ctx.fillStyle = 'rgba(226,232,240,0.75)';
    ctx.font = '600 13px ui-sans-serif, system-ui, sans-serif';
    ctx.fillText(`${o.params.angle.toFixed(0)}°`, base.sx + 24, base.sy - 8);

    // block
    const bp = to(k.x, k.y);
    ctx.save();
    ctx.translate(bp.sx, bp.sy);
    ctx.rotate(-th);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-9, -9, 18, 18);
    ctx.restore();

    // velocity along ramp
    if (k.speed > 0.2) {
      arrow(ctx, bp.sx, bp.sy, k.vx * 2.2, -k.vy * 2.2, '#fb923c', 'v');
    }
  } else {
    // pivot
    const pv = to(0, 0);
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(pv.sx, pv.sy, 5, 0, Math.PI * 2);
    ctx.fill();

    // rod
    const bob = to(k.x, k.y);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pv.sx, pv.sy);
    ctx.lineTo(bob.sx, bob.sy);
    ctx.stroke();

    // bob
    const bobR = 6 + Math.min(14, o.params.mass * 0.8);
    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.arc(bob.sx, bob.sy, bobR, 0, Math.PI * 2);
    ctx.fill();

    // arc showing swing
    ctx.strokeStyle = 'rgba(52,211,153,0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(pv.sx, pv.sy, Math.hypot(bob.sx - pv.sx, bob.sy - pv.sy), Math.PI / 2 - o.params.angle * (Math.PI / 180), Math.PI / 2 + o.params.angle * (Math.PI / 180));
    ctx.stroke();

    // velocity arrow
    if (k.speed > 0.2) {
      arrow(ctx, bob.sx, bob.sy, k.vx * 1.5, -k.vy * 1.5, '#fb923c', 'v');
    }
  }

  ctx.restore();
}
