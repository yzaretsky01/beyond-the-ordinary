/** Source, barrier with slits, detectors and labels. */
import { wavelengthToRgb } from '../../../physics/core/colour';
import type { DoubleSlitParams } from '../../../physics/double-slit/fraunhofer';
import type { StageLayout } from './layout';

export function slitCentres(l: StageLayout): { upper: number; lower: number } {
  return { upper: l.cy - l.geometry.separationPx / 2, lower: l.cy + l.geometry.separationPx / 2 };
}

export function drawApparatus(ctx: CanvasRenderingContext2D, l: StageLayout, p: DoubleSlitParams): void {
  const { upper, lower } = slitCentres(l);
  const half = l.geometry.slitWidthPx / 2;
  const bw = 5;
  const x = l.slitX - bw / 2;

  // barrier
  ctx.fillStyle = '#d9d2c4';
  ctx.fillRect(x, l.top, bw, upper - half - l.top);
  ctx.fillRect(x, upper + half, bw, lower - half - (upper + half));
  ctx.fillRect(x, lower + half, bw, l.bottom - (lower + half));
  // closed slit: plugged, hatched so it reads without colour
  for (const [open, c] of [
    [p.openSlits !== 'lower', upper],
    [p.openSlits !== 'upper', lower],
  ] as const) {
    if (open) continue;
    ctx.fillStyle = '#d9d2c4';
    ctx.fillRect(x - 2, c - half - 1, bw + 4, 2 * half + 2);
    ctx.strokeStyle = '#0d0c0b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let yy = c - half; yy < c + half; yy += 3) {
      ctx.moveTo(x - 2, yy);
      ctx.lineTo(x + bw + 2, yy + 3);
    }
    ctx.stroke();
  }

  // detectors: a ring with a dot just behind each open slit
  if (p.detector) {
    ctx.strokeStyle = '#d9d2c4';
    ctx.fillStyle = '#d9d2c4';
    ctx.lineWidth = 1.5;
    for (const [open, c] of [
      [p.openSlits !== 'lower', upper],
      [p.openSlits !== 'upper', lower],
    ] as const) {
      if (!open) continue;
      ctx.beginPath();
      ctx.arc(l.slitX + 14, c, 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(l.slitX + 14, c, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // light source in the colour of its wavelength
  const [r, g, b] = wavelengthToRgb(p.wavelengthNm);
  const glow = ctx.createRadialGradient(l.sourceX, l.cy, 0, l.sourceX, l.cy, 26);
  glow.addColorStop(0, `rgba(${r},${g},${b},1)`);
  glow.addColorStop(0.35, `rgba(${r},${g},${b},0.55)`);
  glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(l.sourceX - 26, l.cy - 26, 52, 52);

  // labels
  ctx.fillStyle = 'rgba(230,223,210,0.55)';
  ctx.font = "italic 13px 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif";
  ctx.textAlign = 'center';
  ctx.fillText('SOURCE', l.sourceX, l.bottom + 18);
  ctx.fillText('SLITS', l.slitX, l.bottom + 18);
  // screen and histogram labels share a line; keep them from colliding on narrow stages
  ctx.textAlign = 'right';
  ctx.fillText('SCREEN', l.screenX + l.stripWidth, l.bottom + 18);
  ctx.textAlign = 'left';
  ctx.fillText(l.histWidth >= 110 ? 'WHERE THEY LAND' : 'LANDINGS', l.histX, l.bottom + 18);
}
