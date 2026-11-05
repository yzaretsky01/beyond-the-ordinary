/**
 * Tunneling model: one electron in one dimension, governed by the time-dependent Schrödinger
 * equation  iħ ∂ψ/∂t = −(ħ²/2m) ∂²ψ/∂x² + V(x) ψ,  with a rectangular barrier V(x) = V₀ for
 * 0 ≤ x ≤ a. Solved with the split-operator Fourier method (Strang splitting):
 *   ψ(t+dt) = e^{−iV dt/2} · F⁻¹[ e^{−ik² dt/2} · F[ e^{−iV dt/2} ψ ] ]
 * which is unitary (conserves total probability) and second-order accurate in dt.
 *
 * Units: ħ = mₑ = 1, length unit 0.1 nm, so the energy unit is ħ²/(mₑ (0.1 nm)²) ≈ 7.62 eV and
 * the time unit is ħ/E ≈ 0.0864 fs (computed from CODATA constants below).
 * Absorbing edges remove probability that reaches the ends of the grid; the amount absorbed on
 * each side is recorded, so transmitted = (probability right of the barrier) + (absorbed on the right).
 */
import { ELECTRON_MASS, ELEMENTARY_CHARGE, HBAR } from '../core/constants';
import { fft } from '../core/fft';

export const LENGTH_UNIT_NM = 0.1;
export const ENERGY_UNIT_EV =
  (HBAR * HBAR) / (ELECTRON_MASS * (LENGTH_UNIT_NM * 1e-9) ** 2) / ELEMENTARY_CHARGE;
export const TIME_UNIT_FS = (HBAR / (ENERGY_UNIT_EV * ELEMENTARY_CHARGE)) * 1e15;

export interface TunnelParams {
  /** mean kinetic energy of the electron, eV */
  energyEv: number;
  /** barrier height, eV */
  barrierEv: number;
  /** barrier width, nm */
  widthNm: number;
  /** packet width (standard deviation of |ψ|²), nm */
  packetNm: number;
}

export const RANGES = {
  energyEv: { min: 1, max: 15, step: 0.1 },
  barrierEv: { min: 0, max: 20, step: 0.1 },
  widthNm: { min: 0.1, max: 1, step: 0.025 },
  packetNm: { min: 0.4, max: 1.5, step: 0.05 },
};

export const DEFAULT_PARAMS: TunnelParams = { energyEv: 5, barrierEv: 7, widthNm: 0.2, packetNm: 0.8 };

export const GRID = { n: 4096, dx: 0.125 }; // 512 units = 51.2 nm
export const DT = 0.02;
const ABSORB_FRACTION = 0.12;

export function sanitizeParams(p: TunnelParams): TunnelParams {
  const c = (v: number, r: { min: number; max: number }) => Math.min(r.max, Math.max(r.min, v));
  // snap the width to whole grid cells so the analytic comparison uses exactly the simulated barrier
  const cellNm = GRID.dx * LENGTH_UNIT_NM;
  return {
    energyEv: c(p.energyEv, RANGES.energyEv),
    barrierEv: c(p.barrierEv, RANGES.barrierEv),
    widthNm: Math.round(c(p.widthNm, RANGES.widthNm) / cellNm) * cellNm,
    packetNm: c(p.packetNm, RANGES.packetNm),
  };
}

export const toUnits = {
  energy: (ev: number) => ev / ENERGY_UNIT_EV,
  length: (nm: number) => nm / LENGTH_UNIT_NM,
};

export class Wave1D {
  readonly n = GRID.n;
  readonly dx = GRID.dx;
  readonly x: Float64Array;
  readonly V: Float64Array;
  re: Float64Array;
  im: Float64Array;
  t = 0;
  absorbedLeft = 0;
  absorbedRight = 0;
  readonly barrier: { left: number; right: number; height: number };
  readonly k0: number;
  readonly sigma: number;
  readonly x0: number;
  private kinRe: Float64Array;
  private kinIm: Float64Array;
  private potRe: Float64Array;
  private potIm: Float64Array;
  private mask: Float64Array;

  constructor(params: TunnelParams, opts: { absorb?: boolean; dt?: number } = {}) {
    const p = sanitizeParams(params);
    const { n, dx } = this;
    const dt = opts.dt ?? DT;
    this.x = Float64Array.from({ length: n }, (_, i) => (i - n / 2) * dx);
    const a = toUnits.length(p.widthNm);
    const V0 = toUnits.energy(p.barrierEv);
    this.barrier = { left: 0, right: a, height: V0 };
    // cell i covers [x_i, x_i + dx): the barrier occupies exactly a/dx cells starting at x = 0
    this.V = Float64Array.from(this.x, (xi) => (xi >= -1e-9 && xi < a - 1e-9 ? V0 : 0));
    this.k0 = Math.sqrt(2 * toUnits.energy(p.energyEv));
    this.sigma = toUnits.length(p.packetNm);
    this.x0 = -Math.max(60, 6 * this.sigma + 20);
    // initial Gaussian packet, |ψ|² has standard deviation σ
    this.re = new Float64Array(n);
    this.im = new Float64Array(n);
    const norm = Math.pow(2 * Math.PI * this.sigma * this.sigma, -0.25);
    for (let i = 0; i < n; i++) {
      const u = this.x[i] - this.x0;
      const amp = norm * Math.exp(-(u * u) / (4 * this.sigma * this.sigma));
      this.re[i] = amp * Math.cos(this.k0 * this.x[i]);
      this.im[i] = amp * Math.sin(this.k0 * this.x[i]);
    }
    // propagators
    this.kinRe = new Float64Array(n);
    this.kinIm = new Float64Array(n);
    const dk = (2 * Math.PI) / (n * dx);
    for (let i = 0; i < n; i++) {
      const k = (i < n / 2 ? i : i - n) * dk;
      const ph = -0.5 * k * k * dt;
      this.kinRe[i] = Math.cos(ph);
      this.kinIm[i] = Math.sin(ph);
    }
    this.potRe = Float64Array.from(this.V, (v) => Math.cos(-v * dt * 0.5));
    this.potIm = Float64Array.from(this.V, (v) => Math.sin(-v * dt * 0.5));
    this.mask = new Float64Array(n).fill(1);
    if (opts.absorb !== false) {
      const w = Math.floor(n * ABSORB_FRACTION);
      for (let i = 0; i < w; i++) {
        // clamp: rounding can make cos(π/2) a hair below zero, and a fractional power of that is NaN
        const m = Math.pow(Math.max(0, Math.cos(((Math.PI / 2) * (w - i)) / w)), 0.125);
        this.mask[i] = m;
        this.mask[n - 1 - i] = m;
      }
    }
    this.dt = dt;
  }

  readonly dt: number;

  step(count = 1): void {
    const { re, im, n } = this;
    for (let s = 0; s < count; s++) {
      this.halfPotential();
      fft(re, im);
      for (let i = 0; i < n; i++) {
        const a = re[i] * this.kinRe[i] - im[i] * this.kinIm[i];
        im[i] = re[i] * this.kinIm[i] + im[i] * this.kinRe[i];
        re[i] = a;
      }
      fft(re, im, true);
      this.halfPotential();
      this.absorb();
      this.t += this.dt;
    }
  }

  private halfPotential() {
    const { re, im, potRe, potIm, n } = this;
    for (let i = 0; i < n; i++) {
      const a = re[i] * potRe[i] - im[i] * potIm[i];
      im[i] = re[i] * potIm[i] + im[i] * potRe[i];
      re[i] = a;
    }
  }

  private absorb() {
    const { re, im, mask, n, dx } = this;
    const half = n / 2;
    for (let i = 0; i < n; i++) {
      const m = mask[i];
      if (m === 1) continue;
      const before = re[i] * re[i] + im[i] * im[i];
      re[i] *= m;
      im[i] *= m;
      const lost = (before - (re[i] * re[i] + im[i] * im[i])) * dx;
      if (i < half) this.absorbedLeft += lost;
      else this.absorbedRight += lost;
    }
  }

  /** ∫|ψ|² dx over [from, to) */
  probability(from = -Infinity, to = Infinity): number {
    let s = 0;
    for (let i = 0; i < this.n; i++) {
      const xi = this.x[i];
      if (xi >= from && xi < to) s += this.re[i] * this.re[i] + this.im[i] * this.im[i];
    }
    return s * this.dx;
  }

  transmitted(): number {
    return this.probability(this.barrier.right) + this.absorbedRight;
  }

  reflected(): number {
    return this.probability(-Infinity, this.barrier.left) + this.absorbedLeft;
  }

  /** Probability still near the barrier: when small, the collision is over. */
  inInteraction(): number {
    return this.probability(this.barrier.left - 15, this.barrier.right + 15);
  }

  /** The collision is over: the packet centre has had time to arrive, and almost nothing remains near the barrier. */
  collisionOver(): boolean {
    const arrival = (this.barrier.left - this.x0) / this.k0;
    return this.t > arrival && this.inInteraction() < 1e-3;
  }

  /** Standard deviation of |ψ|² (for spreading tests). */
  width(): number {
    let m0 = 0;
    let m1 = 0;
    let m2 = 0;
    for (let i = 0; i < this.n; i++) {
      const p = this.re[i] * this.re[i] + this.im[i] * this.im[i];
      m0 += p;
      m1 += p * this.x[i];
      m2 += p * this.x[i] * this.x[i];
    }
    const mean = m1 / m0;
    return Math.sqrt(m2 / m0 - mean * mean);
  }
}

/** Plane-wave transmission through a rectangular barrier (ħ = m = 1 units). */
export function transmissionPlane(E: number, V0: number, a: number): number {
  if (E <= 0) return 0;
  if (V0 === 0 || a === 0) return 1;
  if (Math.abs(E - V0) < 1e-12) return 1 / (1 + (V0 * a * a) / 2);
  if (E < V0) {
    const kappa = Math.sqrt(2 * (V0 - E));
    const s = Math.sinh(kappa * a);
    return 1 / (1 + (V0 * V0 * s * s) / (4 * E * (V0 - E)));
  }
  const k2 = Math.sqrt(2 * (E - V0));
  const s = Math.sin(k2 * a);
  return 1 / (1 + (V0 * V0 * s * s) / (4 * E * (E - V0)));
}

/**
 * Transmission averaged over the packet's momentum spread: the packet's |φ(k)|² is Gaussian
 * around k₀ with standard deviation 1/(2σ). This is the fair comparison for a finite packet.
 */
export function transmissionPacket(k0: number, sigma: number, V0: number, a: number): number {
  const sk = 1 / (2 * sigma);
  let num = 0;
  let den = 0;
  const steps = 600;
  for (let i = 0; i <= steps; i++) {
    const k = k0 - 6 * sk + (12 * sk * i) / steps;
    const w = Math.exp(-((k - k0) ** 2) / (2 * sk * sk));
    den += w;
    if (k > 0) num += w * transmissionPlane((k * k) / 2, V0, a);
  }
  return num / den;
}

/** Model predictions for a parameter set, in convenient form. */
export function predictions(p: TunnelParams): { plane: number; packet: number } {
  const q = sanitizeParams(p);
  const E = toUnits.energy(q.energyEv);
  const V0 = toUnits.energy(q.barrierEv);
  const a = toUnits.length(q.widthNm);
  return {
    plane: transmissionPlane(E, V0, a),
    packet: transmissionPacket(Math.sqrt(2 * E), toUnits.length(q.packetNm), V0, a),
  };
}
