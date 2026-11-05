/**
 * Screen and histogram. Dots are the simulated photon arrivals; the histogram is their measured
 * density; the dashed periwinkle curve is the model's prediction; the dashed amber curve is the
 * visitor's own prediction. All three share one density scale so they can be compared honestly.
 */
import { SCREEN_HALF_WIDTH_MM } from '../../../physics/double-slit/fraunhofer';
import { HISTOGRAM_BINS, type DoubleSlitSimulation } from '../simulation';
import { screenMmToY, type StageLayout } from './layout';

const DOT = 1.7;

export class ScreenRenderer {
  private strip: HTMLCanvasElement | null = null;
  private drawn = 0;
  private generation = -1;
  private stripKey = '';

  draw(
    ctx: CanvasRenderingContext2D,
    l: StageLayout,
    sim: DoubleSlitSimulation,
    opts: { showResults: boolean; showTheory: boolean; prediction: number[] | null },
  ): void {
    // screen body
    ctx.fillStyle = 'rgba(12, 14, 40, 0.95)';
    ctx.fillRect(l.screenX, l.top, l.stripWidth, l.screenHeight);
    ctx.strokeStyle = 'rgba(233,234,255,0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(l.screenX + 0.5, l.top + 0.5, l.stripWidth - 1, l.screenHeight - 1);

    // histogram frame + axis ticks (mm)
    ctx.strokeStyle = 'rgba(233,234,255,0.12)';
    ctx.beginPath();
    ctx.moveTo(l.histX + 0.5, l.top);
    ctx.lineTo(l.histX + 0.5, l.bottom);
    ctx.stroke();
    ctx.fillStyle = 'rgba(233,234,255,0.5)';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    for (const mm of [-10, 0, 10]) {
      const y = screenMmToY(l, mm);
      ctx.fillRect(l.histX - 3, y, 3, 1);
    }
    ctx.textAlign = 'left';
    ctx.fillText(`+${SCREEN_HALF_WIDTH_MM} mm`, l.histX + 4, l.top + 10);
    ctx.fillText(`−${SCREEN_HALF_WIDTH_MM} mm`, l.histX + 4, l.bottom - 3);

    // scale: theory density peak (+15%) spans the histogram width
    const total = sim.densityIntegral();
    let peak = 0;
    for (let k = 0; k <= 200; k++)
      peak = Math.max(peak, sim.density(-SCREEN_HALF_WIDTH_MM + (k / 200) * 2 * SCREEN_HALF_WIDTH_MM));
    const scale = (l.histWidth * 0.85) / (peak / total || 1);

    if (opts.showResults) {
      this.drawDots(ctx, l, sim);
      this.drawFlashes(ctx, l, sim);
      if (sim.arrivals > 0) {
        const binMm = (2 * SCREEN_HALF_WIDTH_MM) / HISTOGRAM_BINS;
        const binPx = l.screenHeight / HISTOGRAM_BINS;
        ctx.beginPath();
        ctx.moveTo(l.histX, l.bottom);
        for (let b = 0; b < HISTOGRAM_BINS; b++) {
          const dens = sim.bins[b] / (sim.arrivals * binMm);
          const x = l.histX + Math.min(l.histWidth, dens * scale);
          const yTop = l.bottom - (b + 1) * binPx;
          const yBot = l.bottom - b * binPx;
          ctx.lineTo(x, yBot);
          ctx.lineTo(x, yTop);
        }
        ctx.lineTo(l.histX, l.top);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      if (opts.showTheory) {
        ctx.beginPath();
        for (let py = 0; py <= l.screenHeight; py += 1.5) {
          const yMm = ((l.screenHeight / 2 - py) / (l.screenHeight / 2)) * SCREEN_HALF_WIDTH_MM;
          const x = l.histX + (sim.density(yMm) / total) * scale;
          if (py === 0) ctx.moveTo(x, l.top + py);
          else ctx.lineTo(x, l.top + py);
        }
        ctx.setLineDash([3, 4]);
        ctx.strokeStyle = 'rgba(138,160,255,0.95)';
        ctx.lineWidth = 1.3;
        ctx.stroke();
        ctx.setLineDash([]);
      }
    } else {
      // results covered until the visitor has predicted
      ctx.fillStyle = 'rgba(6,7,26,0.9)';
      ctx.fillRect(l.screenX, l.top, l.stripWidth, l.screenHeight);
    }

    if (opts.prediction) {
      const n = opts.prediction.length;
      const pmax = Math.max(...opts.prediction, 1e-6);
      ctx.beginPath();
      for (let b = 0; b < n; b++) {
        const y = l.bottom - ((b + 0.5) / n) * l.screenHeight;
        const x = l.histX + (opts.prediction[b] / pmax) * l.histWidth * 0.85;
        if (b === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = '#ffb37a';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  /** Accumulate dots into an offscreen strip so thousands of arrivals cost nothing per frame. */
  private drawDots(ctx: CanvasRenderingContext2D, l: StageLayout, sim: DoubleSlitSimulation) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const key = `${l.stripWidth}|${l.screenHeight}|${dpr}`;
    if (
      !this.strip ||
      key !== this.stripKey ||
      sim.generation !== this.generation ||
      sim.arrivals < this.drawn
    ) {
      this.strip = this.strip ?? document.createElement('canvas');
      this.strip.width = Math.round(l.stripWidth * dpr);
      this.strip.height = Math.round(l.screenHeight * dpr);
      this.stripKey = key;
      this.generation = sim.generation;
      this.drawn = 0;
    }
    const sctx = this.strip.getContext('2d')!;
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sctx.fillStyle = 'rgba(255,255,255,0.4)';
    for (let i = this.drawn; i < sim.arrivals; i++) {
      const y = l.screenHeight / 2 - (sim.hits[i] / SCREEN_HALF_WIDTH_MM) * (l.screenHeight / 2);
      sctx.fillRect(1 + sim.hitJitter[i] * (l.stripWidth - 2 - DOT), y - DOT / 2, DOT, DOT);
    }
    this.drawn = sim.arrivals;
    ctx.drawImage(this.strip, l.screenX, l.top, l.stripWidth, l.screenHeight);
  }

  private drawFlashes(ctx: CanvasRenderingContext2D, l: StageLayout, sim: DoubleSlitSimulation) {
    const now = performance.now();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    // only the latest few arrivals flash; at high rates more would merge into blobs and hide the pattern
    const flashes = sim.recent.slice(-8);
    const strength = sim.streaming && sim.rate > 60 ? 0.35 : 0.6;
    for (const h of flashes) {
      const age = (now - h.t) / 500;
      if (age > 1) continue;
      const y = screenMmToY(l, h.y);
      ctx.fillStyle = `rgba(255,255,255,${(strength * (1 - age)).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(l.screenX + l.stripWidth / 2, y, 2 + 5 * (1 - age), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
