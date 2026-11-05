/**
 * Superposition model: one photon in a Mach–Zehnder interferometer, treated as a two-state system
 * (a qubit) whose two states are the two paths.
 *
 * First splitter (adjustable):   |in⟩ → cos(θ/2)|upper⟩ + sin(θ/2)|lower⟩
 * Phase plate in the lower path: |lower⟩ → e^{iφ}|lower⟩
 * So inside the interferometer:  |ψ⟩ = cos(θ/2)|upper⟩ + e^{iφ} sin(θ/2)|lower⟩
 *
 * Second splitter IN (50/50, Hadamard convention):
 *   |upper⟩ → (|D1⟩ + |D2⟩)/√2,   |lower⟩ → (|D1⟩ − |D2⟩)/√2
 *   P(D1) = |cos(θ/2) + e^{iφ} sin(θ/2)|² / 2 = (1 + sinθ cosφ)/2
 * Second splitter OUT: each path runs straight to its own detector (upper → D1, lower → D2),
 *   which is a which-path measurement:  P(D1) = cos²(θ/2), independent of φ.
 *
 * Assumptions: ideal lossless splitters and mirrors, equal arm lengths, single photons, perfect
 * detectors, no decoherence. Splitter phase conventions are chosen so that with an even split and
 * no extra phase, every photon leaves towards D1.
 */
export interface SuperpositionParams {
  /** Splitting angle θ in degrees (0 = all upper, 90 = even, 180 = all lower) */
  thetaDeg: number;
  /** Phase φ added to the lower path, degrees */
  phiDeg: number;
  /** Is the second splitter in place? */
  secondSplitter: boolean;
}

export const RANGES = {
  thetaDeg: { min: 0, max: 180, step: 1 },
  phiDeg: { min: 0, max: 360, step: 1 },
};

export const DEFAULT_PARAMS: SuperpositionParams = { thetaDeg: 90, phiDeg: 0, secondSplitter: true };

const rad = (deg: number) => (deg * Math.PI) / 180;

export function sanitizeParams(p: SuperpositionParams): SuperpositionParams {
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  return {
    thetaDeg: clamp(p.thetaDeg, RANGES.thetaDeg.min, RANGES.thetaDeg.max),
    phiDeg: ((p.phiDeg % 360) + 360) % 360 || (p.phiDeg >= 360 ? 360 : 0),
    secondSplitter: p.secondSplitter,
  };
}

export interface Complex {
  re: number;
  im: number;
}

/** Path amplitudes inside the interferometer (after the phase plate). */
export function pathAmplitudes(p: SuperpositionParams): { upper: Complex; lower: Complex } {
  const t = rad(p.thetaDeg) / 2;
  const f = rad(p.phiDeg);
  return {
    upper: { re: Math.cos(t), im: 0 },
    lower: { re: Math.sin(t) * Math.cos(f), im: Math.sin(t) * Math.sin(f) },
  };
}

/** Amplitudes arriving at each detector. */
export function detectorAmplitudes(p: SuperpositionParams): { d1: Complex; d2: Complex } {
  const { upper: u, lower: l } = pathAmplitudes(p);
  if (!p.secondSplitter) return { d1: u, d2: l };
  const s = Math.SQRT1_2;
  return {
    d1: { re: s * (u.re + l.re), im: s * (u.im + l.im) },
    d2: { re: s * (u.re - l.re), im: s * (u.im - l.im) },
  };
}

const abs2 = (c: Complex) => c.re * c.re + c.im * c.im;

/** Born rule: detection probabilities. They always sum to 1. */
export function detectorProbabilities(p: SuperpositionParams): { d1: number; d2: number } {
  const a = detectorAmplitudes(p);
  return { d1: abs2(a.d1), d2: abs2(a.d2) };
}

/** Closed form of P(D1), used to check the amplitude calculation. */
export function pD1ClosedForm(p: SuperpositionParams): number {
  const t = rad(p.thetaDeg);
  return p.secondSplitter ? (1 + Math.sin(t) * Math.cos(rad(p.phiDeg))) / 2 : Math.cos(t / 2) ** 2;
}

/** Bloch vector (x, y, z) of the path state; z = +1 is |upper⟩. */
export function blochVector(p: SuperpositionParams): [number, number, number] {
  const t = rad(p.thetaDeg);
  const f = rad(p.phiDeg);
  return [Math.sin(t) * Math.cos(f), Math.sin(t) * Math.sin(f), Math.cos(t)];
}

/**
 * Which-path measurement with collapse: returns the path found and the state afterwards.
 * Measuring again gives the same answer with certainty.
 */
export function measurePath(
  p: SuperpositionParams,
  u: number,
): { path: 'upper' | 'lower'; after: SuperpositionParams } {
  const pUpper = Math.cos(rad(p.thetaDeg) / 2) ** 2;
  const path = u < pUpper ? 'upper' : 'lower';
  return { path, after: { ...p, thetaDeg: path === 'upper' ? 0 : 180 } };
}
