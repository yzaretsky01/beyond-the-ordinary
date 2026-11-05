/**
 * Draws the computed wave field. Colour = phase (cyclic map), brightness = probability density |ψ|².
 * The field is computed once per parameter/size change (physics/double-slit/stageField.ts); each
 * frame only multiplies by the time factor e^{−iωt}, which is exact for a single-frequency wave.
 */
import { PHASE_LUT, PHASE_LUT_SIZE } from '../../../physics/core/colour';
import type { DoubleSlitParams } from '../../../physics/double-slit/fraunhofer';
import { computeSlitFields, type SlitFields } from '../../../physics/double-slit/stageField';
import type { StageLayout } from './layout';

const PLANE_WAVE_AMPLITUDE = 0.7;
const BRIGHTNESS_GAIN = 1.6;
/** Display angular frequency (rad/s): how fast crests move on screen. Real light oscillates ~10^15 times faster. */
export const DISPLAY_OMEGA = 2 * Math.PI * 0.55;

export class FieldRenderer {
  private key = '';
  private fields: SlitFields | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private image: ImageData | null = null;
  /** phase and brightness sampled for the arrow overlay */
  private lastPhase = new Float32Array(0);
  private lastBright = new Float32Array(0);

  ensure(l: StageLayout, p: DoubleSlitParams): void {
    const g = l.geometry;
    const key = [
      l.width,
      l.height,
      l.cell,
      g.lambdaPx.toFixed(3),
      g.separationPx.toFixed(3),
      g.slitWidthPx.toFixed(3),
      l.nRight,
    ].join('|');
    if (key === this.key) return;
    this.key = key;
    this.fields = computeSlitFields({ nx: l.nRight, ny: l.ny, cell: l.cell }, g);
    const w = l.nLeft + l.nRight;
    this.canvas = document.createElement('canvas');
    this.canvas.width = w;
    this.canvas.height = l.ny;
    this.image = this.canvas.getContext('2d')!.createImageData(w, l.ny);
    this.lastPhase = new Float32Array(w * l.ny);
    this.lastBright = new Float32Array(w * l.ny);
    void p;
  }

  draw(ctx: CanvasRenderingContext2D, l: StageLayout, p: DoubleSlitParams, t: number): void {
    if (!this.fields || !this.image || !this.canvas) return;
    const { re1, im1, re2, im2 } = this.fields;
    const D = this.image.data;
    const w = l.nLeft + l.nRight;
    const co = Math.cos(DISPLAY_OMEGA * t);
    const si = Math.sin(DISPLAY_OMEGA * t);
    const up = p.openSlits !== 'lower' ? 1 : 0;
    const lo = p.openSlits !== 'upper' ? 1 : 0;
    const k = (2 * Math.PI) / l.geometry.lambdaPx;
    const phaseScale = PHASE_LUT_SIZE / (2 * Math.PI);

    for (let j = 0; j < l.ny; j++) {
      for (let i = 0; i < w; i++) {
        const o = j * w + i;
        let I: number;
        let ph: number;
        if (i < l.nLeft) {
          // plane wave approaching the slits: ψ = A e^{i(kx − ωt)}
          const x = (i - l.nLeft + 0.5) * l.cell;
          ph = k * x - DISPLAY_OMEGA * t;
          I = PLANE_WAVE_AMPLITUDE * PLANE_WAVE_AMPLITUDE;
        } else {
          const f = j * l.nRight + (i - l.nLeft);
          // multiply each slit's amplitude by e^{−iωt}
          const a = up * (re1[f] * co + im1[f] * si);
          const b = up * (im1[f] * co - re1[f] * si);
          const c = lo * (re2[f] * co + im2[f] * si);
          const d = lo * (im2[f] * co - re2[f] * si);
          if (p.detector) {
            // which-path known: probabilities add; show the phase of whichever path dominates here
            const I1 = a * a + b * b;
            const I2 = c * c + d * d;
            I = I1 + I2;
            ph = I1 >= I2 ? Math.atan2(b, a) : Math.atan2(d, c);
          } else {
            const re = a + c;
            const im = b + d;
            I = re * re + im * im;
            ph = Math.atan2(im, re);
          }
        }
        const bright = Math.pow(1 - Math.exp(-BRIGHTNESS_GAIN * I), 0.85);
        let hi = Math.floor(ph * phaseScale) % PHASE_LUT_SIZE;
        if (hi < 0) hi += PHASE_LUT_SIZE;
        const q = o * 4;
        D[q] = PHASE_LUT[hi * 3] * bright;
        D[q + 1] = PHASE_LUT[hi * 3 + 1] * bright;
        D[q + 2] = PHASE_LUT[hi * 3 + 2] * bright;
        D[q + 3] = 255;
        this.lastPhase[o] = ph;
        this.lastBright[o] = bright;
      }
    }
    this.canvas.getContext('2d')!.putImageData(this.image, 0, 0);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.canvas, l.slitX - l.nLeft * l.cell, l.top, w * l.cell, l.ny * l.cell);
    ctx.restore();
  }

  /**
   * Phase arrows: the same information as the colour, as a direction (for colour-blind visitors).
   * Arrow angle = phase; arrow opacity = brightness.
   */
  drawPhaseArrows(ctx: CanvasRenderingContext2D, l: StageLayout): void {
    const w = l.nLeft + l.nRight;
    const spacing = Math.max(22, l.screenHeight / 18);
    const len = spacing * 0.36;
    ctx.save();
    ctx.lineWidth = 1.4;
    ctx.lineCap = 'round';
    for (let y = l.top + spacing / 2; y < l.bottom; y += spacing) {
      for (let x = l.slitX - l.nLeft * l.cell + spacing / 2; x < l.screenX; x += spacing) {
        const i = Math.floor((x - (l.slitX - l.nLeft * l.cell)) / l.cell);
        const j = Math.floor((y - l.top) / l.cell);
        if (i < 0 || j < 0 || i >= w || j >= l.ny) continue;
        const o = j * w + i;
        const b = this.lastBright[o];
        if (b < 0.18) continue;
        const ph = this.lastPhase[o];
        const dx = Math.cos(ph) * len;
        const dy = -Math.sin(ph) * len;
        ctx.strokeStyle = `rgba(255,255,255,${(0.35 + 0.6 * b).toFixed(2)})`;
        ctx.beginPath();
        ctx.moveTo(x - dx, y - dy);
        ctx.lineTo(x + dx, y + dy);
        const ah = Math.atan2(dy, dx);
        ctx.lineTo(x + dx - Math.cos(ah - 0.5) * len * 0.5, y + dy - Math.sin(ah - 0.5) * len * 0.5);
        ctx.moveTo(x + dx, y + dy);
        ctx.lineTo(x + dx - Math.cos(ah + 0.5) * len * 0.5, y + dy - Math.sin(ah + 0.5) * len * 0.5);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}
