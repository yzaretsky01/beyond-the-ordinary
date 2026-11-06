/**
 * Entanglement stage drawing. Photons fly from the central source to the two polarisers (the
 * timing is illustrative). Quantum pairs are drawn without any polarisation in flight, because in
 * quantum theory neither photon has one of its own before measurement. Hidden-instruction pairs
 * show their shared hidden polarisation λ as a small line, because in that model they carry one.
 * The chart and meter show the measured statistics against the two models' predictions.
 */
import { pSameHidden, pSameQuantum } from '../../../physics/entanglement/bell';
import { FLIGHT_S, type EntanglementParams, type EntanglementSimulation } from '../simulation';

/** Hidden-instruction model: a cool neutral, dotted, so it is never confused with the amber prediction. */
const HIDDEN = 'rgba(196,190,180,0.85)';

export interface EntLayout {
  width: number;
  height: number;
  source: { x: number; y: number };
  alice: { x: number; y: number };
  bob: { x: number; y: number };
  dialR: number;
  tapes: { x: number; y: number; w: number; row: number };
  chart: { x: number; y: number; w: number; h: number };
  meter: { x: number; y: number; w: number; h: number };
}

export function computeLayout(width: number, height: number): EntLayout {
  const pad = Math.max(14, width * 0.03);
  const y = height * 0.2;
  const dialR = Math.max(22, Math.min(40, width * 0.045));
  const chartTop = height * 0.5;
  const chartH = height * 0.4;
  return {
    width,
    height,
    source: { x: width / 2, y },
    alice: { x: pad + dialR + 36, y },
    bob: { x: width - pad - dialR - 36, y },
    dialR,
    tapes: { x: pad + 52, y: height * 0.34, w: width - 2 * pad - 52, row: 14 },
    chart: { x: pad + 30, y: chartTop, w: width * 0.58 - pad - 30, h: chartH },
    meter: { x: width * 0.66, y: chartTop, w: width * 0.34 - pad, h: chartH },
  };
}

const rad = (d: number) => (d * Math.PI) / 180;

function dial(
  ctx: CanvasRenderingContext2D,
  c: { x: number; y: number },
  r: number,
  angleDeg: number,
  label: string,
) {
  ctx.save();
  ctx.strokeStyle = 'rgba(230,223,210,0.45)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
  ctx.stroke();
  // polariser axis (angles repeat every 180°, so draw both ends)
  const dx = Math.cos(rad(angleDeg)) * r;
  const dy = -Math.sin(rad(angleDeg)) * r;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(c.x - dx, c.y - dy);
  ctx.lineTo(c.x + dx, c.y + dy);
  ctx.stroke();
  ctx.fillStyle = 'rgba(230,223,210,0.8)';
  ctx.font = "italic 13px 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif";
  ctx.textAlign = 'center';
  ctx.fillText(`${label} ${Math.round(angleDeg)}°`, c.x, c.y + r + 18);
  ctx.restore();
}

export function drawApparatus(
  ctx: CanvasRenderingContext2D,
  l: EntLayout,
  p: EntanglementParams,
  sim: EntanglementSimulation,
) {
  const t = sim.time;
  // source
  const g = ctx.createRadialGradient(l.source.x, l.source.y, 0, l.source.x, l.source.y, 22);
  g.addColorStop(0, 'rgba(255,255,255,0.9)');
  g.addColorStop(1, 'rgba(157,184,224,0)');
  ctx.fillStyle = g;
  ctx.fillRect(l.source.x - 22, l.source.y - 22, 44, 44);
  ctx.strokeStyle = 'rgba(230,223,210,0.15)';
  ctx.beginPath();
  ctx.moveTo(l.alice.x + l.dialR, l.source.y);
  ctx.lineTo(l.bob.x - l.dialR, l.source.y);
  ctx.stroke();

  // which settings are live: in Bell mode the most recent pair's choice is highlighted
  const last = sim.recent[sim.recent.length - 1];
  const aShown = p.mode === 'bell' && last ? last.aSet : p.aDeg;
  const bShown = p.mode === 'bell' && last ? last.bSet : p.bDeg;
  dial(ctx, l.alice, l.dialR, aShown, 'ALICE');
  dial(ctx, l.bob, l.dialR, bShown, 'BOB');

  // photons in flight, and the detector flash on arrival
  // draw only the most recent pairs: at high rates more would merge into a blob at the source
  for (const q of sim.inFlight.slice(-10)) {
    const f = (t - q.t0) / FLIGHT_S;
    if (f < 0) continue;
    if (f <= 1) {
      const xa = l.source.x + (l.alice.x + l.dialR - l.source.x) * f;
      const xb = l.source.x + (l.bob.x - l.dialR - l.source.x) * f;
      for (const x of [xa, xb]) {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x, l.source.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
        if (q.lambdaDeg !== undefined) {
          const dx = Math.cos(rad(q.lambdaDeg)) * 8;
          const dy = -Math.sin(rad(q.lambdaDeg)) * 8;
          ctx.strokeStyle = HIDDEN;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x - dx, l.source.y - dy);
          ctx.lineTo(x + dx, l.source.y + dy);
          ctx.stroke();
        }
      }
    } else {
      const k = 1 - (f - 1) / (0.5 / FLIGHT_S);
      if (k <= 0) continue;
      for (const [c, o, dir] of [
        [l.alice, q.a, -1],
        [l.bob, q.b, 1],
      ] as const) {
        const x = c.x + dir * (l.dialR + 20);
        const y = c.y + (o === 1 ? -14 : 14);
        ctx.fillStyle = `rgba(255,255,255,${(0.8 * k).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  // detector labels
  ctx.font = "italic 13px 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif";
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(230,223,210,0.6)';
  for (const [c, dir] of [
    [l.alice, -1],
    [l.bob, 1],
  ] as const) {
    const x = c.x + dir * (l.dialR + 20);
    ctx.strokeStyle = 'rgba(230,223,210,0.4)';
    ctx.strokeRect(x - 7, c.y - 21, 14, 14);
    ctx.strokeRect(x - 7, c.y + 7, 14, 14);
    ctx.fillText('+', x + dir * 16, c.y - 10);
    ctx.fillText('−', x + dir * 16, c.y + 18);
  }
  ctx.fillText('SOURCE', l.source.x, l.source.y + 34);
}

export function drawTapes(ctx: CanvasRenderingContext2D, l: EntLayout, sim: EntanglementSimulation) {
  const n = 40;
  const cell = Math.min(16, l.tapes.w / n);
  const items = sim.recent.slice(-n);
  ctx.save();
  ctx.font = "italic 13px 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif";
  ctx.fillStyle = 'rgba(230,223,210,0.55)';
  ctx.textAlign = 'right';
  ctx.fillText('ALICE', l.tapes.x - 8, l.tapes.y + 10);
  ctx.fillText('BOB', l.tapes.x - 8, l.tapes.y + 10 + l.tapes.row + 4);
  items.forEach((q, i) => {
    const x = l.tapes.x + i * cell;
    for (const [o, row] of [
      [q.a, 0],
      [q.b, 1],
    ] as const) {
      const y = l.tapes.y + row * (l.tapes.row + 4);
      if (o === 1) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(x, y, cell - 3, l.tapes.row);
      } else {
        ctx.strokeStyle = 'rgba(230,223,210,0.5)';
        ctx.strokeRect(x + 0.5, y + 0.5, cell - 4, l.tapes.row - 1);
      }
    }
    if (q.a !== q.b) {
      ctx.fillStyle = 'rgba(199,155,179,0.9)';
      ctx.fillRect(x, l.tapes.y + 2 * (l.tapes.row + 4), cell - 3, 3);
    }
  });
  ctx.restore();
}

export function drawChart(
  ctx: CanvasRenderingContext2D,
  l: EntLayout,
  p: EntanglementParams,
  sim: EntanglementSimulation,
  opts: { prediction: number | null; showResults: boolean },
) {
  const c = l.chart;
  const X = (d: number) => c.x + (d / 90) * c.w;
  const Y = (v: number) => c.y + c.h - v * c.h;
  ctx.save();
  ctx.strokeStyle = 'rgba(230,223,210,0.25)';
  ctx.strokeRect(c.x + 0.5, c.y + 0.5, c.w, c.h);
  ctx.font = "italic 13px 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif";
  ctx.fillStyle = 'rgba(230,223,210,0.55)';
  ctx.textAlign = 'center';
  for (const d of [0, 30, 60, 90]) ctx.fillText(`${d}°`, X(d), c.y + c.h + 14);
  ctx.fillText('ANGLE BETWEEN POLARISERS', c.x + c.w / 2, c.y + c.h + 28);
  ctx.textAlign = 'right';
  for (const v of [0, 0.5, 1]) ctx.fillText(`${v * 100}%`, c.x - 4, Y(v) + 4);
  ctx.save();
  ctx.translate(c.x - 22, c.y + c.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('RESULTS MATCH', 0, -6);
  ctx.restore();
  // model curves
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#9db8e0';
  ctx.beginPath();
  for (let d = 0; d <= 90; d += 1) (d ? ctx.lineTo : ctx.moveTo).call(ctx, X(d), Y(pSameQuantum(0, d)));
  ctx.stroke();
  ctx.setLineDash([2, 3]);
  ctx.strokeStyle = HIDDEN;
  ctx.beginPath();
  ctx.moveTo(X(0), Y(pSameHidden(0, 0)));
  ctx.lineTo(X(90), Y(pSameHidden(0, 90)));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#9db8e0';
  ctx.fillText('quantum', X(4), Y(0.18));
  ctx.fillStyle = HIDDEN;
  ctx.fillText('hidden instructions', X(4), Y(0.08));
  // current angle difference
  const d0 = Math.abs(p.aDeg - p.bDeg) % 180;
  const delta = d0 > 90 ? 180 - d0 : d0;
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.moveTo(X(delta), c.y);
  ctx.lineTo(X(delta), c.y + c.h);
  ctx.stroke();
  if (opts.prediction !== null) {
    ctx.strokeStyle = '#ffb37a';
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(X(30) - 14, Y(opts.prediction));
    ctx.lineTo(X(30) + 14, Y(opts.prediction));
    ctx.stroke();
    ctx.setLineDash([]);
  }
  const dd = sim.derived();
  if (opts.showResults && p.mode === 'explore' && dd.pairs > 0) {
    const y = Y(dd.matchRate);
    const e = 2 * dd.matchSE * c.h;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(X(delta), y - e);
    ctx.lineTo(X(delta), y + e);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(X(delta), y, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawMeter(
  ctx: CanvasRenderingContext2D,
  l: EntLayout,
  p: EntanglementParams,
  sim: EntanglementSimulation,
  showResults: boolean,
) {
  const m = l.meter;
  const d = sim.derived();
  ctx.save();
  ctx.font = "italic 13px 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif";
  ctx.textAlign = 'center';
  if (p.mode === 'bell') {
    // vertical scale 0..3 for S
    const bx = m.x + m.w * 0.3;
    const bw = m.w * 0.4;
    const Y = (s: number) => m.y + m.h - (Math.max(0, Math.min(3, s)) / 3) * m.h;
    ctx.strokeStyle = 'rgba(230,223,210,0.3)';
    ctx.strokeRect(bx + 0.5, m.y + 0.5, bw, m.h);
    if (showResults && d.pairs > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(bx + 1, Y(d.S), bw - 1, m.y + m.h - Y(d.S));
      ctx.strokeStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(bx + bw / 2, Y(d.S + 2 * d.SSE));
      ctx.lineTo(bx + bw / 2, Y(d.S - 2 * d.SSE));
      ctx.strokeStyle = '#0d0c0b';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    for (const [v, label, col] of [
      [2, 'classical limit 2', HIDDEN],
      [2 * Math.SQRT2, 'quantum max 2.83', '#9db8e0'],
    ] as const) {
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(bx - 8, Y(v));
      ctx.lineTo(bx + bw + 8, Y(v));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = col;
      ctx.textAlign = 'left';
      ctx.fillText(label, bx - 8, Y(v) - 5);
    }
    ctx.fillStyle = 'rgba(230,223,210,0.7)';
    ctx.textAlign = 'center';
    ctx.fillText(
      showResults && d.pairs ? `S = ${d.S.toFixed(2)} ± ${d.SSE.toFixed(2)}` : 'S = ?',
      bx + bw / 2,
      m.y + m.h + 16,
    );
  } else {
    // no-signalling: each side's own share of "+" results
    const cols = [
      ['ALICE +', d.alicePlus],
      ['BOB +', d.bobPlus],
    ] as const;
    cols.forEach(([label, v], i) => {
      const bx = m.x + m.w * (0.12 + i * 0.46);
      const bw = m.w * 0.32;
      ctx.strokeStyle = 'rgba(230,223,210,0.3)';
      ctx.strokeRect(bx + 0.5, m.y + 0.5, bw, m.h);
      if (showResults && d.pairs) {
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillRect(bx + 1, m.y + m.h * (1 - v), bw - 1, m.h * v);
      }
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = '#9db8e0';
      ctx.beginPath();
      ctx.moveTo(bx - 4, m.y + m.h / 2);
      ctx.lineTo(bx + bw + 4, m.y + m.h / 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(230,223,210,0.65)';
      ctx.fillText(label, bx + bw / 2, m.y + m.h + 16);
    });
  }
  ctx.restore();
}
