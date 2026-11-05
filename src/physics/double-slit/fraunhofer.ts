/**
 * Double-slit model: scalar wave optics in the far field (Fraunhofer diffraction).
 *
 * Each open slit contributes an amplitude
 *   ψ_j(y) = ½ · sinc(β) · e^{iφ_j},   β = π a sinθ / λ,
 * and the two slits differ in phase by Δφ = 2π d sinθ / λ, where sinθ = y / √(y² + L²).
 *
 * Probability density on the screen (Born rule):
 *   both slits, no detector:  |ψ₁ + ψ₂|²   = sinc²(β) · cos²(π d sinθ / λ)
 *   both slits, detector:     |ψ₁|² + |ψ₂|² = ½ · sinc²(β)        (which-path known → no interference)
 *   one slit:                 |ψ_j|²        = ¼ · sinc²(β)
 * Normalised so the central maximum with both slits open and no detector equals 1.
 *
 * Assumptions: monochromatic, fully coherent source; identical, ideal thin slits; screen in the far
 * field (Fresnel number ≪ 1, see `fresnelNumber`); scalar waves (no polarisation); a which-path
 * detector that gives complete path information without otherwise disturbing the particle's motion.
 */

export type OpenSlits = 'both' | 'upper' | 'lower';

export interface DoubleSlitParams {
  /** Wavelength of the light, nanometres */
  wavelengthNm: number;
  /** Centre-to-centre slit separation d, millimetres */
  separationMm: number;
  /** Width of each slit a, millimetres */
  slitWidthMm: number;
  /** Distance from slits to screen L, metres */
  screenDistanceM: number;
  /** Which slits are open */
  openSlits: OpenSlits;
  /** Which-slit detector switched on */
  detector: boolean;
}

export interface Range {
  min: number;
  max: number;
  step: number;
}

/**
 * Parameter ranges. Chosen so the far-field approximation holds everywhere
 * (Fresnel number ≤ 0.15 at every corner; checked by tests) and the slits never overlap.
 */
export const RANGES = {
  wavelengthNm: { min: 400, max: 700, step: 1 },
  separationMm: { min: 0.1, max: 0.4, step: 0.01 },
  slitWidthMm: { min: 0.02, max: 0.06, step: 0.005 },
  screenDistanceM: { min: 1, max: 3, step: 0.05 },
} satisfies Record<string, Range>;

/** Physical half-height of the screen, millimetres. The screen spans −15 mm … +15 mm. */
export const SCREEN_HALF_WIDTH_MM = 15;

/** Sensible defaults: a green laser pointer (532 nm) through slits a quarter-millimetre apart. */
export const DEFAULT_PARAMS: DoubleSlitParams = {
  wavelengthNm: 532,
  separationMm: 0.25,
  slitWidthMm: 0.04,
  screenDistanceM: 1.5,
  openSlits: 'both',
  detector: false,
};

const clamp = (v: number, r: Range) => Math.min(r.max, Math.max(r.min, v));

/** Clamp every numeric parameter into its valid range and keep the slits from overlapping. */
export function sanitizeParams(p: DoubleSlitParams): DoubleSlitParams {
  const separationMm = clamp(p.separationMm, RANGES.separationMm);
  const slitWidthMm = Math.min(clamp(p.slitWidthMm, RANGES.slitWidthMm), separationMm * 0.6);
  return {
    ...p,
    wavelengthNm: clamp(p.wavelengthNm, RANGES.wavelengthNm),
    separationMm,
    slitWidthMm,
    screenDistanceM: clamp(p.screenDistanceM, RANGES.screenDistanceM),
  };
}

const NM_TO_MM = 1e-6;

/** sin θ for a point y (mm) on a screen L (m) away. Exact geometry, no small-angle approximation. */
export function sinTheta(yMm: number, screenDistanceM: number): number {
  const L = screenDistanceM * 1000;
  return yMm / Math.hypot(yMm, L);
}

function sinc(x: number): number {
  return Math.abs(x) < 1e-12 ? 1 : Math.sin(x) / x;
}

/** Complex amplitude of each slit at screen position y. Returns [re1, im1, re2, im2]; a closed slit gives 0. */
export function slitAmplitudes(yMm: number, p: DoubleSlitParams): [number, number, number, number] {
  const s = sinTheta(yMm, p.screenDistanceM);
  const lambda = p.wavelengthNm * NM_TO_MM;
  const env = 0.5 * sinc((Math.PI * p.slitWidthMm * s) / lambda);
  // Phases measured from the midpoint between the slits: upper slit at +d/2 is closer to points with y > 0.
  const half = (Math.PI * p.separationMm * s) / lambda;
  const up = p.openSlits !== 'lower';
  const lo = p.openSlits !== 'upper';
  return [
    up ? env * Math.cos(-half) : 0,
    up ? env * Math.sin(-half) : 0,
    lo ? env * Math.cos(half) : 0,
    lo ? env * Math.sin(half) : 0,
  ];
}

/** Probability density (relative intensity) at screen position y, in [0, 1]. */
export function intensity(yMm: number, p: DoubleSlitParams): number {
  const [a, b, c, d] = slitAmplitudes(yMm, p);
  if (p.detector) return a * a + b * b + c * c + d * d; // which-path known: probabilities add
  const re = a + c;
  const im = b + d;
  return re * re + im * im; // which-path unknown: amplitudes add
}

/** Fringe spacing on the screen in the small-angle approximation: Δy = λL / d (mm). */
export function fringeSpacingMm(
  p: Pick<DoubleSlitParams, 'wavelengthNm' | 'separationMm' | 'screenDistanceM'>,
): number {
  return (p.wavelengthNm * NM_TO_MM * p.screenDistanceM * 1000) / p.separationMm;
}

/** Exact screen position (mm) of bright fringe m, from d sinθ = mλ. NaN if it does not exist. */
export function brightFringeMm(m: number, p: DoubleSlitParams): number {
  const s = (m * p.wavelengthNm * NM_TO_MM) / p.separationMm;
  if (Math.abs(s) >= 1) return NaN;
  return p.screenDistanceM * 1000 * Math.tan(Math.asin(s));
}

/** Exact screen position (mm) of dark fringe between m and m+1, from d sinθ = (m + ½)λ. */
export function darkFringeMm(m: number, p: DoubleSlitParams): number {
  const s = ((m + 0.5) * p.wavelengthNm * NM_TO_MM) / p.separationMm;
  if (Math.abs(s) >= 1) return NaN;
  return p.screenDistanceM * 1000 * Math.tan(Math.asin(s));
}

/** First zero of the single-slit envelope (mm), from a sinθ = λ. */
export function envelopeZeroMm(p: DoubleSlitParams): number {
  const s = (p.wavelengthNm * NM_TO_MM) / p.slitWidthMm;
  if (s >= 1) return Infinity;
  return p.screenDistanceM * 1000 * Math.tan(Math.asin(s));
}

/** True when the screen shows interference stripes (both slits open, no detector). */
export function hasInterference(p: DoubleSlitParams): boolean {
  return p.openSlits === 'both' && !p.detector;
}

/**
 * Number of bright stripes visible on the screen: bright fringes inside ±SCREEN_HALF_WIDTH_MM whose
 * brightness is at least 5% of the central maximum. Returns 0 when there is no interference.
 */
export function visibleStripes(p: DoubleSlitParams): number {
  if (!hasInterference(p)) return 0;
  let n = 0;
  for (let m = -200; m <= 200; m++) {
    const y = brightFringeMm(m, p);
    if (Number.isNaN(y) || Math.abs(y) > SCREEN_HALF_WIDTH_MM) continue;
    if (intensity(y, p) >= 0.05) n++;
  }
  return n;
}

/**
 * Fresnel number N_F = (D/2)² / (λL) for the whole aperture of size D = d + a.
 * The far-field (Fraunhofer) formula is accurate when N_F ≪ 1.
 */
export function fresnelNumber(p: DoubleSlitParams): number {
  const halfApertureMm = (p.separationMm + p.slitWidthMm) / 2;
  return (halfApertureMm * halfApertureMm) / (p.wavelengthNm * NM_TO_MM * p.screenDistanceM * 1000);
}

/** Integral of the intensity across the screen (mm). Proportional to the fraction of particles that arrive. */
export function screenIntegral(p: DoubleSlitParams, n = 4000): number {
  const dy = (2 * SCREEN_HALF_WIDTH_MM) / n;
  let s = 0;
  for (let i = 0; i < n; i++) s += intensity(-SCREEN_HALF_WIDTH_MM + (i + 0.5) * dy, p) * dy;
  return s;
}
