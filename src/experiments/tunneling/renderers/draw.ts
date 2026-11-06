/**
 * Tunneling stage drawing. The filled curve is |ψ(x)|² computed by the solver, coloured by the
 * phase of ψ(x); the barrier and the dashed energy line share one energy axis (eV). The bars show
 * the measured reflected/transmitted probability against the model predictions.
 */
import { PHASE_LUT, phaseIndex } from '../../../physics/core/colour';
import { LENGTH_UNIT_NM, TIME_UNIT_FS, toUnits } from '../../../physics/tunneling/schrodinger1d';
import type { TunnelParams } from '../../../physics/tunneling/schrodinger1d';
import type { TunnelingSimulation } from '../simulation';

export interface TunLayout {
  width: number;
  height: number;
  plot: { x: number; y: number; w: number; h: number };
  bars: { x: number; y: number; w: number; h: number };
  /** visible x range in solver units */
  xMin: number;
  xMax: number;
  /** energy at the top of the plot, eV */
  eMax: number;
}

export function computeLayout(width: number, height: number, p: TunnelParams): TunLayout {
  const pad = 14;
  const barsW = Math.max(90, Math.min(170, width * 0.2));
  return {
    width,
    height,
    plot: { x: pad + 30, y: 36, w: width - pad * 2 - barsW - 56, h: height - 36 - 44 },
    bars: { x: width - pad - barsW, y: 36, w: barsW, h: height - 36 - 44 },
    xMin: -110,
    xMax: 110,
    eMax: Math.max(10, Math.max(p.barrierEv, p.energyEv) * 1.3),
  };
}

export const xToPx = (l: TunLayout, x: number) => l.plot.x + ((x - l.xMin) / (l.xMax - l.xMin)) * l.plot.w;
export const pxToX = (l: TunLayout, px: number) => l.xMin + ((px - l.plot.x) / l.plot.w) * (l.xMax - l.xMin);
export const eToPx = (l: TunLayout, ev: number) => l.plot.y + l.plot.h - (ev / l.eMax) * l.plot.h;
export const pxToE = (l: TunLayout, py: number) => ((l.plot.y + l.plot.h - py) / l.plot.h) * l.eMax;

export function drawTunnel(
  ctx: CanvasRenderingContext2D,
  l: TunLayout,
  p: TunnelParams,
  sim: TunnelingSimulation,
  opts: { arrows: boolean; classical: boolean },
) {
  const w = sim.wave;
  const { plot } = l;
  ctx.save();
  // axes
  ctx.strokeStyle = 'rgba(230,223,210,0.25)';
  ctx.strokeRect(plot.x + 0.5, plot.y + 0.5, plot.w, plot.h);
  ctx.font = "italic 13px 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif";
  ctx.fillStyle = 'rgba(230,223,210,0.55)';
  ctx.textAlign = 'center';
  for (let nm = -10; nm <= 10; nm += 5)
    ctx.fillText(`${nm} nm`, xToPx(l, toUnits.length(nm)), plot.y + plot.h + 14);
  ctx.textAlign = 'right';
  const stepE = l.eMax > 16 ? 5 : 2;
  for (let e = 0; e <= l.eMax; e += stepE) ctx.fillText(`${e}`, plot.x - 4, eToPx(l, e) + 4);
  ctx.save();
  ctx.translate(plot.x - 26, plot.y + plot.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('ENERGY (eV)', 0, 0);
  ctx.restore();

  // barrier
  const bx0 = xToPx(l, w.barrier.left);
  const bx1 = xToPx(l, w.barrier.right);
  const by = eToPx(l, p.barrierEv);
  ctx.fillStyle = 'rgba(230,223,210,0.22)';
  ctx.fillRect(bx0, by, Math.max(2, bx1 - bx0), plot.y + plot.h - by);
  ctx.strokeStyle = '#d9d2c4';
  ctx.strokeRect(bx0 + 0.5, by + 0.5, Math.max(2, bx1 - bx0), plot.y + plot.h - by);

  // |ψ|², coloured by phase; scale: the initial packet peak fills ~55% of the plot height
  const peak0 = 1 / (w.sigma * Math.sqrt(2 * Math.PI));
  // leave headroom: where incoming and reflected waves overlap, |ψ|² can reach ~4× the starting peak
  const scale = (plot.h * 0.26) / peak0;
  const base = plot.y + plot.h;
  const i0 = Math.max(0, Math.floor((l.xMin - w.x[0]) / w.dx));
  const i1 = Math.min(w.n - 1, Math.ceil((l.xMax - w.x[0]) / w.dx));
  const stride = Math.max(1, Math.floor((i1 - i0) / plot.w));
  for (let i = i0; i < i1; i += stride) {
    const d = w.re[i] * w.re[i] + w.im[i] * w.im[i];
    const h = Math.min(plot.h, d * scale);
    if (h < 0.3) continue;
    const k = phaseIndex(Math.atan2(w.im[i], w.re[i])) * 3;
    ctx.fillStyle = `rgba(${PHASE_LUT[k]},${PHASE_LUT[k + 1]},${PHASE_LUT[k + 2]},0.82)`;
    const x = xToPx(l, w.x[i]);
    ctx.fillRect(x, base - h, Math.max(1, (plot.w / (i1 - i0)) * stride + 0.5), h);
  }
  // white outline of |ψ|²
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = i0; i < i1; i += stride) {
    const d = w.re[i] * w.re[i] + w.im[i] * w.im[i];
    const y = base - Math.min(plot.h, d * scale);
    const x = xToPx(l, w.x[i]);
    if (i === i0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  if (opts.arrows) {
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1.3;
    const every = Math.max(1, Math.round(22 / (plot.w / (i1 - i0))));
    for (let i = i0; i < i1; i += every) {
      const d = w.re[i] * w.re[i] + w.im[i] * w.im[i];
      if (d * scale < 6) continue;
      const ph = Math.atan2(w.im[i], w.re[i]);
      const x = xToPx(l, w.x[i]);
      const y = base - Math.min(plot.h, d * scale) - 10;
      const dx = Math.cos(ph) * 6;
      const dy = -Math.sin(ph) * 6;
      ctx.beginPath();
      ctx.moveTo(x - dx, y - dy);
      ctx.lineTo(x + dx, y + dy);
      ctx.stroke();
    }
  }

  // mean energy line
  const ey = eToPx(l, p.energyEv);
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath();
  ctx.moveTo(plot.x, ey);
  ctx.lineTo(plot.x + plot.w, ey);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.textAlign = 'left';
  ctx.fillText(`electron energy ${p.energyEv.toFixed(1)} eV`, plot.x + 44, ey - 6);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#d9d2c4';
  ctx.fillText(
    `barrier ${p.barrierEv.toFixed(1)} eV · ${p.widthNm.toFixed(3)} nm`,
    (bx0 + bx1) / 2,
    Math.max(plot.y + 12, by - 46),
  );

  // classical ball with the same energy
  if (opts.classical && sim.launched) {
    const cx = xToPx(l, sim.classicalX());
    if (cx >= plot.x && cx <= plot.x + plot.w) {
      ctx.fillStyle = '#e6dfd2';
      ctx.beginPath();
      ctx.arc(cx, ey, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = 'rgba(230,223,210,0.55)';
  ctx.textAlign = 'right';
  ctx.fillText(`t = ${(w.t * TIME_UNIT_FS).toFixed(1)} fs`, plot.x + plot.w - 6, plot.y + 14);
  // the curve and the energy axis share the plot but not a scale; say so on the plot itself
  ctx.textAlign = 'left';
  ctx.fillText('curve: probability density · its height is not in eV', plot.x + 6, plot.y + 14);
  void LENGTH_UNIT_NM;
  ctx.restore();
}

export function drawBars(
  ctx: CanvasRenderingContext2D,
  l: TunLayout,
  sim: TunnelingSimulation,
  opts: { showResults: boolean; prediction: number | null; showTheory: boolean },
) {
  const b = l.bars;
  const d = sim.derived();
  const colW = b.w * 0.34;
  ctx.save();
  ctx.font = "italic 13px 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif";
  ctx.textAlign = 'center';
  const cols = [
    { label: d.done ? 'REFLECTED' : 'LEFT', v: d.reflected, x: b.x + b.w * 0.08, theory: 1 - d.packet },
    { label: d.done ? 'THROUGH' : 'RIGHT', v: d.transmitted, x: b.x + b.w * 0.58, theory: d.packet },
  ];
  for (const c of cols) {
    ctx.strokeStyle = 'rgba(230,223,210,0.3)';
    ctx.strokeRect(c.x + 0.5, b.y + 0.5, colW, b.h);
    if (opts.showResults) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(c.x + 1, b.y + b.h * (1 - c.v), colW - 1, b.h * c.v);
      ctx.fillStyle = 'rgba(230,223,210,0.85)';
      ctx.fillText(`${(c.v * 100).toFixed(1)}%`, c.x + colW / 2, b.y - 8);
    }
    if (opts.showTheory) {
      ctx.strokeStyle = '#9db8e0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(c.x - 4, b.y + b.h * (1 - c.theory));
      ctx.lineTo(c.x + colW + 4, b.y + b.h * (1 - c.theory));
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(230,223,210,0.65)';
    ctx.fillText(c.label, c.x + colW / 2, b.y + b.h + 16);
  }
  if (opts.prediction !== null) {
    const c = cols[1];
    const y = b.y + b.h * (1 - opts.prediction);
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = '#ffb37a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(c.x - 6, y);
    ctx.lineTo(c.x + colW + 6, y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}
