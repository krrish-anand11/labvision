import { useEffect, useRef } from 'react';
import type { ScenarioType, Params, SimState } from '../lib/physics';
import { createSimState, advance, getKinematics, isDone } from '../lib/physics';
import { drawScene } from './CanvasRenderer';

interface Props {
  scenario: ScenarioType;
  params: Params;
  running: boolean;
  onDone: () => void;
}

export default function SimCanvas({ scenario, params, running, onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<SimState | null>(null);
  const trailRef = useRef<Array<{ x: number; y: number }>>([]);
  const rafRef = useRef(0);
  const lastRef = useRef(0);
  const paramsRef = useRef(params);
  const runningRef = useRef(running);
  const scenarioRef = useRef(scenario);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);

  paramsRef.current = params;
  runningRef.current = running;
  scenarioRef.current = scenario;
  onDoneRef.current = onDone;

  // Reset the sim whenever the scenario or any parameter changes
  useEffect(() => {
    stateRef.current = createSimState(params, scenario);
    trailRef.current = [];
    doneRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario, params.velocity, params.angle, params.mass, params.gravity, params.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, rect.width * dpr);
      canvas.height = Math.max(1, rect.height * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const loop = (now: number) => {
      rafRef.current = requestAnimationFrame(loop);
      const dt = Math.min(0.033, (now - lastRef.current) / 1000 || 0.016);
      lastRef.current = now;

      if (stateRef.current) {
        if (runningRef.current && !doneRef.current) {
          advance(stateRef.current, dt, paramsRef.current, scenarioRef.current);
          const kin = getKinematics(stateRef.current, paramsRef.current, scenarioRef.current);
          trailRef.current.push({ x: kin.x, y: kin.y });
          if (trailRef.current.length > 900) trailRef.current.shift();
          if (isDone(stateRef.current, paramsRef.current, scenarioRef.current)) {
            doneRef.current = true;
            onDoneRef.current();
          }
        }
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        drawScene(ctx, rect.width, rect.height, dpr, {
          scenario: scenarioRef.current,
          params: paramsRef.current,
          state: stateRef.current,
          trail: trailRef.current,
          running: runningRef.current,
        });
      }
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-[340px] sm:h-[420px] rounded-xl border border-slate-700/60 bg-slate-950 block"
    />
  );
}
