/**
 * Superposition stage drawing. Every beam's brightness is |amplitude|² and its colour is the phase
 * (same cyclic map as every room), computed from physics/superposition/interferometer.ts.
 * No photon is drawn travelling along a path: the theory assigns it no path inside the interferometer.
 */
import { PHASE_LUT, phaseIndex } from '../../../physics/core/colour';
import {
  blochVector,
  detectorAmplitudes,
  pathAmplitudes,
  type Complex,
  type SuperpositionParams,
} from '../../../physics/superposition/interferometer';
import type { SuperpositionSimulation } from '../simulation';

export interface Pt {
  x: number;
  y: number;
}

export interface SupLayout {
  width: number;
  height: number;
  source: Pt;
  bs1: Pt;
  m1: Pt;
  m2: Pt;
  bs2: Pt;
  plate: Pt;
  d1: Pt;
  d2: Pt;
  bloch: { cx: number; cy: number; r: number };
  bars: { x: number; y: number; w: number; h: number };
  /** drawn wavelength, px (illustrative) */
  lambdaPx: number;
}

export function computeLayout(width: number, height: number): SupLayout {
  const wide = width >= height * 1.15;
  const box = wide ? { x: 0, y: 0, w: width * 0.62, h: height } : { x: 0, y: 0, w: width, h: height * 0.58 };
  const side = wide
    ? { x: width * 0.62, y: 0, w: width * 0.38, h: height }
    : { x: 0, y: height * 0.58, w: width, h: height * 0.42 };
  const yT = box.y + box.h * 0.3;
  const yB = box.y + box.h * 0.76;
  const xL = box.x + box.w * 0.24;
  const xR = box.x + box.w * 0.72;
  const r = wide ? Math.min(side.w * 0.34, side.h * 0.2) : Math.min(side.w * 0.2, side.h * 0.36);
  const bloch = wide
    ? { cx: side.x + side.w * 0.5, cy: side.y + side.h * 0.3, r }
    : { cx: side.x + side.w * 0.27, cy: side.y + side.h * 0.5, r };
  const bars = wide
    ? { x: side.x + side.w * 0.18, y: side.y + side.h * 0.6, w: side.w * 0.64, h: side.h * 0.3 }
    : { x: side.x + side.w * 0.58, y: side.y + side.h * 0.12, w: side.w * 0.36, h: side.h * 0.7 };
  return {
    width,
    height,
    source: { x: box.x + box.w * 0.06, y: yB },
    bs1: { x: xL, y: yB },
    m1: { x: xL, y: yT },
    m2: { x: xR, y: yB },
    bs2: { x: xR, y: yT },
    plate: { x: (xL + xR) / 2, y: yB },
    d1: { x: box.x + box.w * 0.93, y: yT },
    d2: { x: xR, y: box.y + box.h * 0.08 },
    bloch,
    bars,
    lambdaPx: Math.max(14, box.w / 22),
  };
}

const OMEGA = 2 * Math.PI * 0.5; // display frequency; real light oscillates ~10^15 times per second

function beam(
  ctx: CanvasRenderingContext2D,
  a: Pt,
  b: Pt,
  amp: Complex,
  sStart: number,
  k: number,
  t: number,
  arrows = false,
) {
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const ux = (b.x - a.x) / len;
  const uy = (b.y - a.y) / len;
  const I = amp.re * amp.re + amp.im * amp.im;
  const base = Math.atan2(amp.im, amp.re);
  // faint guide so an empty path still reads as a path
  ctx.strokeStyle = 'rgba(233,234,255,0.14)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  if (I < 1e-6) return;
  const bright = Math.pow(I, 0.6);
  const thick = 12;
  for (let s = 0; s < len; s += 3) {
    const ph = base + k * (sStart + s) - OMEGA * t;
    const i = phaseIndex(ph) * 3;
    ctx.fillStyle = `rgba(${PHASE_LUT[i]},${PHASE_LUT[i + 1]},${PHASE_LUT[i + 2]},${bright.toFixed(3)})`;
    const x = a.x + ux * s;
    const y = a.y + uy * s;
    if (Math.abs(ux) > Math.abs(uy)) ctx.fillRect(x, y - thick / 2, 3.5, thick);
    else ctx.fillRect(x - thick / 2, y, thick, 3.5);
  }
  if (arrows) {
    // the same phase as a direction, readable without colour
    ctx.strokeStyle = `rgba(255,255,255,${(0.4 + 0.6 * bright).toFixed(3)})`;
    ctx.lineWidth = 1.4;
    for (let s = 14; s < len - 8; s += 30) {
      const ph = base + k * (sStart + s) - OMEGA * t;
      const x = a.x + ux * s + (Math.abs(ux) > Math.abs(uy) ? 0 : 20);
      const y = a.y + uy * s + (Math.abs(ux) > Math.abs(uy) ? -20 : 0);
      const dx = Math.cos(ph) * 7;
      const dy = -Math.sin(ph) * 7;
      ctx.beginPath();
      ctx.moveTo(x - dx, y - dy);
      ctx.lineTo(x + dx, y + dy);
      ctx.lineTo(
        x + dx - Math.cos(Math.atan2(dy, dx) - 0.5) * 4,
        y + dy - Math.sin(Math.atan2(dy, dx) - 0.5) * 4,
      );
      ctx.stroke();
    }
  }
}

function splitter(ctx: CanvasRenderingContext2D, c: Pt, present: boolean) {
  const h = 16;
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(-Math.PI / 4);
  if (present) {
    ctx.fillStyle = 'rgba(179,193,255,0.35)';
    ctx.fillRect(-h, -3, 2 * h, 6);
    ctx.strokeStyle = '#d4d7ff';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-h, -3, 2 * h, 6);
  } else {
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(233,234,255,0.4)';
    ctx.strokeRect(-h, -3, 2 * h, 6);
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function mirror(ctx: CanvasRenderingContext2D, c: Pt) {
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(-Math.PI / 4);
  ctx.fillStyle = '#d4d7ff';
  ctx.fillRect(-16, -2.5, 32, 5);
  ctx.restore();
}

function detector(ctx: CanvasRenderingContext2D, c: Pt, label: string, flash: number, dir: 'right' | 'up') {
  ctx.save();
  ctx.translate(c.x, c.y);
  if (dir === 'up') ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = `rgba(255,255,255,${(0.08 + 0.8 * flash).toFixed(3)})`;
  ctx.strokeStyle = 'rgba(233,234,255,0.6)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, 15, -Math.PI / 2, Math.PI / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = 'rgba(233,234,255,0.75)';
  ctx.font = '11px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  if (dir === 'right') ctx.fillText(label, c.x + 8, c.y + 30);
  else ctx.fillText(label, c.x + 34, c.y + 4);
}

export function drawInterferometer(
  ctx: CanvasRenderingContext2D,
  l: SupLayout,
  p: SuperpositionParams,
  sim: SuperpositionSimulation,
  t: number,
  arrows = false,
) {
  const k = (2 * Math.PI) / l.lambdaPx;
  const { upper, lower } = pathAmplitudes(p);
  const inLen = l.bs1.x - l.source.x;
  const leg1 = l.bs1.y - l.m1.y; // vertical leg
  const leg2 = l.bs2.x - l.m1.x; // horizontal leg
  const armLen = leg1 + leg2;
  const plateS = l.plate.x - l.bs1.x;
  // the lower path's amplitude already includes e^{iφ}; before the plate it has no extra phase
  const lowerNoPhase: Complex = { re: Math.hypot(lower.re, lower.im), im: 0 };
  const one: Complex = { re: 1, im: 0 };

  beam(ctx, l.source, l.bs1, one, -inLen, k, t, arrows);
  beam(ctx, l.bs1, l.m1, upper, 0, k, t, arrows);
  beam(ctx, l.m1, l.bs2, upper, leg1, k, t, arrows);
  beam(ctx, l.bs1, l.plate, lowerNoPhase, 0, k, t, arrows);
  beam(ctx, l.plate, l.m2, lower, plateS, k, t, arrows);
  beam(ctx, l.m2, l.bs2, lower, leg2, k, t, arrows);
  const out = detectorAmplitudes(p);
  beam(ctx, l.bs2, { x: l.d1.x - 15, y: l.d1.y }, out.d1, armLen, k, t, arrows);
  beam(ctx, l.bs2, { x: l.d2.x, y: l.d2.y + 15 }, out.d2, armLen, k, t, arrows);

  splitter(ctx, l.bs1, true);
  splitter(ctx, l.bs2, p.secondSplitter);
  mirror(ctx, l.m1);
  mirror(ctx, l.m2);
  // phase plate
  ctx.fillStyle = 'rgba(95,240,208,0.18)';
  ctx.strokeStyle = '#5ff0d0';
  ctx.lineWidth = 1.2;
  ctx.fillRect(l.plate.x - 6, l.plate.y - 18, 12, 36);
  ctx.strokeRect(l.plate.x - 6, l.plate.y - 18, 12, 36);

  const now = performance.now();
  const flash = (det: 1 | 2) => {
    let f = 0;
    for (const r of sim.recent) if (r.det === det) f = Math.max(f, 1 - (now - r.t) / 400);
    return Math.max(0, f);
  };
  detector(ctx, l.d1, 'D1', flash(1), 'right');
  detector(ctx, l.d2, 'D2', flash(2), 'up');

  ctx.fillStyle = 'rgba(233,234,255,0.55)';
  ctx.font = '10.5px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SOURCE', l.source.x, l.source.y + 34);
  ctx.fillText('SPLITTER 1', l.bs1.x, l.bs1.y + 34);
  ctx.fillText('PHASE φ', l.plate.x, l.plate.y + 34);
  ctx.fillText(p.secondSplitter ? 'SPLITTER 2' : 'SPLITTER 2 (removed)', l.bs2.x - 4, l.bs2.y + 34);
  ctx.textAlign = 'left';
  ctx.fillText('UPPER PATH', l.m1.x + 8, l.m1.y - 10);
  ctx.fillText('LOWER PATH', l.plate.x + 14, l.bs1.y - 12);
}

/* ---------------- Bloch sphere ---------------- */

const AZ = (-35 * Math.PI) / 180;
const EL = (18 * Math.PI) / 180;

/** Project a point on the unit sphere to the screen. Returns screen coords and depth (front > 0). */
export function project(
  l: SupLayout,
  x: number,
  y: number,
  z: number,
): { sx: number; sy: number; depth: number } {
  const X = x * Math.cos(AZ) - y * Math.sin(AZ);
  const Y = x * Math.sin(AZ) + y * Math.cos(AZ);
  const sy = z * Math.cos(EL) - Y * Math.sin(EL);
  const depth = Y * Math.cos(EL) + z * Math.sin(EL);
  return { sx: l.bloch.cx + l.bloch.r * X, sy: l.bloch.cy - l.bloch.r * sy, depth: -depth };
}

export function drawBloch(ctx: CanvasRenderingContext2D, l: SupLayout, p: SuperpositionParams) {
  const { cx, cy, r } = l.bloch;
  ctx.save();
  ctx.strokeStyle = 'rgba(233,234,255,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  // equator and one meridian
  for (const ring of ['eq', 'mer'] as const) {
    ctx.beginPath();
    for (let a = 0; a <= 360; a += 4) {
      const t = (a * Math.PI) / 180;
      const q =
        ring === 'eq' ? project(l, Math.cos(t), Math.sin(t), 0) : project(l, Math.sin(t), 0, Math.cos(t));
      if (a === 0) ctx.moveTo(q.sx, q.sy);
      else ctx.lineTo(q.sx, q.sy);
    }
    ctx.strokeStyle = 'rgba(233,234,255,0.16)';
    ctx.stroke();
  }
  // measurement axis: z without the second splitter (which path), x with it (which detector)
  const axis = p.secondSplitter ? [1, 0, 0] : [0, 0, 1];
  const a1 = project(l, axis[0], axis[1], axis[2]);
  const a2 = project(l, -axis[0], -axis[1], -axis[2]);
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.moveTo(a2.sx, a2.sy);
  ctx.lineTo(a1.sx, a1.sy);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = '10.5px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(233,234,255,0.8)';
  ctx.textAlign = 'center';
  ctx.fillText('D1', a1.sx + (a1.sx - cx) * 0.18, a1.sy + (a1.sy - cy) * 0.18 + 4);
  ctx.fillText('D2', a2.sx + (a2.sx - cx) * 0.18, a2.sy + (a2.sy - cy) * 0.18 + 4);
  // pole labels
  const top = project(l, 0, 0, 1);
  const bot = project(l, 0, 0, -1);
  ctx.fillStyle = 'rgba(233,234,255,0.55)';
  ctx.fillText('upper', top.sx, top.sy - 10);
  ctx.fillText('lower', bot.sx, bot.sy + 18);

  // state arrow, coloured by its phase φ
  const [x, y, z] = blochVector(p);
  const s = project(l, x, y, z);
  const i = phaseIndex((p.phiDeg * Math.PI) / 180) * 3;
  const col = `rgb(${PHASE_LUT[i]},${PHASE_LUT[i + 1]},${PHASE_LUT[i + 2]})`;
  // shadow of the state on the measurement axis: its position gives P(D1) = (1 + projection)/2
  const proj = x * axis[0] + y * axis[1] + z * axis[2];
  const sh = project(l, proj * axis[0], proj * axis[1], proj * axis[2]);
  ctx.setLineDash([2, 3]);
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath();
  ctx.moveTo(s.sx, s.sy);
  ctx.lineTo(sh.sx, sh.sy);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(sh.sx, sh.sy, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = col;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(s.sx, s.sy);
  ctx.stroke();
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.arc(s.sx, s.sy, s.depth >= 0 ? 7 : 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(233,234,255,0.55)';
  ctx.textAlign = 'center';
  ctx.fillText('THE PHOTON’S STATE', cx, Math.min(cy + r + 38, l.height - 8));
  ctx.restore();
}

/* ---------------- Detector bars ---------------- */

export function drawBars(
  ctx: CanvasRenderingContext2D,
  l: SupLayout,
  sim: SuperpositionSimulation,
  opts: { showResults: boolean; showTheory: boolean; predictionD1: number | null },
) {
  const b = l.bars;
  const d = sim.derived();
  const colW = b.w * 0.32;
  const xs = [b.x + b.w * 0.12, b.x + b.w * 0.56];
  ctx.save();
  ctx.font = '11px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  [1, 2].forEach((det, idx) => {
    const x = xs[idx];
    ctx.strokeStyle = 'rgba(233,234,255,0.3)';
    ctx.strokeRect(x + 0.5, b.y + 0.5, colW, b.h);
    const count = det === 1 ? d.d1 : d.d2;
    const frac = d.total ? count / d.total : 0;
    if (opts.showResults) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(x + 1, b.y + b.h * (1 - frac), colW - 1, b.h * frac);
      ctx.fillStyle = 'rgba(233,234,255,0.8)';
      ctx.fillText(`${count}`, x + colW / 2, b.y - 8);
    }
    if (opts.showTheory) {
      const pr = det === 1 ? d.pD1 : d.pD2;
      const y = b.y + b.h * (1 - pr);
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = '#8aa0ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 4, y);
      ctx.lineTo(x + colW + 4, y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (opts.predictionD1 !== null) {
      const pr = det === 1 ? opts.predictionD1 : 1 - opts.predictionD1;
      const y = b.y + b.h * (1 - pr);
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = '#ffb37a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 6, y);
      ctx.lineTo(x + colW + 6, y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.fillStyle = 'rgba(233,234,255,0.65)';
    ctx.fillText(`D${det}`, x + colW / 2, b.y + b.h + 16);
  });
  ctx.restore();
}
