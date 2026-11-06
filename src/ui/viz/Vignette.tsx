import { useEffect, useRef } from 'react';
import './vignette.css';
import { wavelengthToRgb } from '../../physics/core/colour';
import {
  DEFAULT_PARAMS as SLITS,
  SCREEN_HALF_WIDTH_MM,
  intensity,
} from '../../physics/double-slit/fraunhofer';
import { pD1ClosedForm } from '../../physics/superposition/interferometer';
import { pSameHidden, pSameQuantum } from '../../physics/entanglement/bell';
import { toUnits, transmissionPlane } from '../../physics/tunneling/schrodinger1d';
import { probabilities, runCircuit, type Op } from '../../physics/quantum-computing/stateVector';

/**
 * A small picture of each room's result, computed from that room's own model (never an icon).
 * Double slit: the screen pattern at default settings. Superposition: P(D1) as the phase turns.
 * Entanglement: P(same) against the angle between polarisers, quantum (solid) and hidden-instruction (dotted).
 * Tunneling: transmission against energy for a 7 eV, 0.5 nm wall. Computing: Grover's search on two qubits.
 */
const W = 132;
const H = 64;
const INK = 'rgba(230,223,210,0.82)';
const FAINT = 'rgba(230,223,210,0.22)';

type Ctx = CanvasRenderingContext2D;

function curve(ctx: Ctx, f: (u: number) => number, dash: number[] = []) {
  ctx.setLineDash(dash);
  ctx.beginPath();
  for (let i = 0; i <= 120; i++) {
    const u = i / 120;
    const x = 2 + u * (W - 4);
    const y = H - 4 - f(u) * (H - 10);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

function baseline(ctx: Ctx) {
  ctx.strokeStyle = FAINT;
  ctx.beginPath();
  ctx.moveTo(2, H - 3.5);
  ctx.lineTo(W - 2, H - 3.5);
  ctx.stroke();
}

const draw: Record<string, (ctx: Ctx) => void> = {
  'double-slit': (ctx) => {
    const [r, g, b] = wavelengthToRgb(SLITS.wavelengthNm);
    const prof = Array.from({ length: W }, (_, i) =>
      intensity(-SCREEN_HALF_WIDTH_MM + ((i + 0.5) / W) * 2 * SCREEN_HALF_WIDTH_MM, SLITS),
    );
    const max = Math.max(...prof);
    for (let i = 0; i < W; i++) {
      ctx.fillStyle = `rgba(${r},${g},${b},${Math.pow(prof[i] / max, 0.8).toFixed(3)})`;
      ctx.fillRect(i, 6, 1, H - 12);
    }
  },
  superposition: (ctx) => {
    baseline(ctx);
    ctx.strokeStyle = INK;
    curve(ctx, (u) => pD1ClosedForm({ thetaDeg: 90, phiDeg: u * 720, secondSplitter: true }));
  },
  entanglement: (ctx) => {
    baseline(ctx);
    ctx.strokeStyle = 'rgba(196,190,180,0.7)';
    curve(ctx, (u) => pSameHidden(0, u * 180), [1.5, 3]);
    ctx.strokeStyle = INK;
    curve(ctx, (u) => pSameQuantum(0, u * 180));
  },
  tunneling: (ctx) => {
    const V0 = toUnits.energy(7);
    const a = toUnits.length(0.5);
    ctx.strokeStyle = FAINT;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(2 + (W - 4) / 3, 2);
    ctx.lineTo(2 + (W - 4) / 3, H - 4);
    ctx.stroke();
    ctx.setLineDash([]);
    baseline(ctx);
    ctx.strokeStyle = INK;
    curve(ctx, (u) => transmissionPlane(Math.max(1e-6, u * 3 * V0), V0, a));
  },
  'quantum-computing': (ctx) => {
    const H2: Op[] = [
      { gate: 'H', target: 0 },
      { gate: 'H', target: 1 },
    ];
    const X2: Op[] = [
      { gate: 'X', target: 0 },
      { gate: 'X', target: 1 },
    ];
    const cz: Op[] = [{ gate: 'CZ', control: 0, target: 1 }];
    const p = probabilities(runCircuit(2, [H2, cz, H2, X2, cz, X2, H2]));
    const R = 12;
    p.forEach((pi, i) => {
      const cx = 18 + i * 32;
      ctx.strokeStyle = FAINT;
      ctx.beginPath();
      ctx.arc(cx, H / 2, R, 0, 2 * Math.PI);
      ctx.stroke();
      if (pi > 1e-6) {
        ctx.fillStyle = INK;
        ctx.beginPath();
        ctx.arc(cx, H / 2, R * Math.sqrt(pi), 0, 2 * Math.PI); // area is probability
        ctx.fill();
      }
    });
  },
};

export function Vignette({ id }: { id: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = W * dpr;
    c.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = 1.25;
    draw[id]?.(ctx);
  }, [id]);
  return <canvas ref={ref} className="vignette" width={W} height={H} aria-hidden="true" />;
}
