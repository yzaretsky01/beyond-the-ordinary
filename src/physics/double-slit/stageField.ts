/**
 * The wave picture drawn on the stage between the slits and the screen.
 *
 * Real wavelengths (~500 nm) are far too small to see, so the stage uses an enlarged geometry:
 * a drawn wavelength λv and slit spacing dv (in pixels) chosen so that the stage shows ROUGHLY the
 * same number of stripes as the true-scale screen (within about 25%; the compressed stage is in the
 * near field, so edge stripes differ). The quantitative result is the screen. The field itself is then
 * computed, not drawn by hand: each slit is a row of Huygens point sources, and each source
 * radiates a 2D cylindrical wave  e^{ikr} / √r  (the far-from-source form of the 2D wave solution).
 */
import { SCREEN_HALF_WIDTH_MM, type DoubleSlitParams } from './fraunhofer';

export interface StageGeometry {
  /** Drawn wavelength, px */
  lambdaPx: number;
  /** Drawn slit separation, px */
  separationPx: number;
  /** Drawn slit width, px */
  slitWidthPx: number;
}

/**
 * Enlarged geometry preserving the stripe count. Bright stripe m sits at sinθ = mλ/d, so the number
 * of stripes that fit on a screen is set by (d/λ)·sinθ_edge. Matching the stage's edge angle to the
 * real screen's edge angle gives  dv/λv = (d/λ) · sinθ_edge,real / sinθ_edge,stage.
 */
export function stageGeometry(
  p: DoubleSlitParams,
  slitToScreenPx: number,
  screenHeightPx: number,
): StageGeometry {
  const scale = Math.max(0.5, screenHeightPx / 540);
  let lambdaPx = (18 + ((p.wavelengthNm - 400) / 300) * 18) * scale; // longer real wavelength → longer drawn wave
  const sinEdgeReal = SCREEN_HALF_WIDTH_MM / Math.hypot(SCREEN_HALF_WIDTH_MM, p.screenDistanceM * 1000);
  const sinEdgeStage = screenHeightPx / 2 / Math.hypot(screenHeightPx / 2, slitToScreenPx);
  const ratio = (p.separationMm / (p.wavelengthNm * 1e-6)) * (sinEdgeReal / sinEdgeStage);
  let separationPx = ratio * lambdaPx;
  const maxSep = screenHeightPx * 0.45;
  if (separationPx > maxSep) {
    // keep the ratio (and so the stripe count) but shrink the drawing to fit
    lambdaPx *= maxSep / separationPx;
    separationPx = maxSep;
  }
  const slitWidthPx = Math.max(3, (p.slitWidthMm / p.separationMm) * separationPx);
  return { lambdaPx, separationPx, slitWidthPx };
}

export interface FieldGrid {
  nx: number;
  ny: number;
  /** cell size, px */
  cell: number;
}

export interface SlitFields {
  re1: Float32Array;
  im1: Float32Array;
  re2: Float32Array;
  im2: Float32Array;
}

const SOURCES_PER_SLIT = 5;

/**
 * Complex field on a grid to the right of the slits. Grid column 0 sits at the slit plane;
 * row ny/2 is the axis. Upper slit (field 1) is at −dv/2 in screen coordinates (y grows downwards).
 */
export function computeSlitFields(grid: FieldGrid, g: StageGeometry): SlitFields {
  const { nx, ny, cell } = grid;
  const n = nx * ny;
  const out: SlitFields = {
    re1: new Float32Array(n),
    im1: new Float32Array(n),
    re2: new Float32Array(n),
    im2: new Float32Array(n),
  };
  const k = (2 * Math.PI) / g.lambdaPx;
  const cy = (ny * cell) / 2;
  const offsets: number[] = [];
  for (let s = 0; s < SOURCES_PER_SLIT; s++) offsets.push((s / (SOURCES_PER_SLIT - 1) - 0.5) * g.slitWidthPx);
  const y1 = cy - g.separationPx / 2;
  const y2 = cy + g.separationPx / 2;
  // Amplitude scaled so each slit's field is ~0.5 at mid-distance, matching the screen normalisation.
  const norm = (0.5 * Math.sqrt((nx * cell) / 2)) / SOURCES_PER_SLIT;
  for (let j = 0; j < ny; j++) {
    const y = (j + 0.5) * cell;
    for (let i = 0; i < nx; i++) {
      const x = (i + 0.5) * cell;
      let a = 0;
      let b = 0;
      let c = 0;
      let d = 0;
      for (const o of offsets) {
        let dy = y - (y1 + o);
        let r = Math.sqrt(x * x + dy * dy) + 1;
        let m = norm / Math.sqrt(r);
        a += m * Math.cos(k * r);
        b += m * Math.sin(k * r);
        dy = y - (y2 + o);
        r = Math.sqrt(x * x + dy * dy) + 1;
        m = norm / Math.sqrt(r);
        c += m * Math.cos(k * r);
        d += m * Math.sin(k * r);
      }
      const idx = j * nx + i;
      out.re1[idx] = a;
      out.im1[idx] = b;
      out.re2[idx] = c;
      out.im2[idx] = d;
    }
  }
  return out;
}
