/**
 * Entanglement model: polarisation-entangled photon pairs in the state
 *   |Φ⁺⟩ = (|HH⟩ + |VV⟩)/√2,
 * measured by polarisers at angles a (Alice) and b (Bob). Each result is +1 (photon passes) or −1.
 *
 * Quantum predictions (Born rule):
 *   P(++) = P(−−) = cos²(a − b)/2,   P(+−) = P(−+) = sin²(a − b)/2
 *   P(same) = cos²(a − b),            E(a, b) = cos 2(a − b)
 *   Each side alone: P(+) = 1/2 for every setting (no signalling).
 *
 * Hidden-instruction model (local hidden variables): each pair carries a shared polarisation λ,
 * uniformly random in [0°, 180°). Each photon passes its polariser if cos²(setting − λ) ≥ ½.
 *   P(same) = 1 − |Δ|/90° for |Δ| ≤ 90°,   E = 1 − 4|Δ|/π.
 *
 * CHSH: S = E(a, b) − E(a, b′) + E(a′, b) + E(a′, b′).
 *   Any local hidden-variable model: |S| ≤ 2.   Quantum: up to 2√2 ≈ 2.83.
 */
import type { Rng } from '../core/rng';

export type Outcome = 1 | -1;
export type Source = 'quantum' | 'hidden';

const rad = (d: number) => (d * Math.PI) / 180;

/** Fold an angle difference (degrees) into [0, 90]: polariser angles repeat every 180°. */
export function foldDelta(deltaDeg: number): number {
  const m = ((deltaDeg % 180) + 180) % 180;
  return m > 90 ? 180 - m : m;
}

export function pSameQuantum(aDeg: number, bDeg: number): number {
  return Math.cos(rad(aDeg - bDeg)) ** 2;
}

export function pSameHidden(aDeg: number, bDeg: number): number {
  return 1 - foldDelta(aDeg - bDeg) / 90;
}

export function pSame(source: Source, aDeg: number, bDeg: number): number {
  return source === 'quantum' ? pSameQuantum(aDeg, bDeg) : pSameHidden(aDeg, bDeg);
}

/** Correlation E = P(same) − P(different). */
export function correlation(source: Source, aDeg: number, bDeg: number): number {
  return 2 * pSame(source, aDeg, bDeg) - 1;
}

/** Quantum joint probabilities [P(++), P(+−), P(−+), P(−−)]. */
export function quantumJoint(aDeg: number, bDeg: number): [number, number, number, number] {
  const c = Math.cos(rad(aDeg - bDeg)) ** 2 / 2;
  const s = Math.sin(rad(aDeg - bDeg)) ** 2 / 2;
  return [c, s, s, c];
}

/** One hidden-instruction photon: pass if its hidden polarisation is within 45° of the polariser axis. */
export function hiddenOutcome(lambdaDeg: number, settingDeg: number): Outcome {
  return Math.cos(rad(settingDeg - lambdaDeg)) ** 2 >= 0.5 ? 1 : -1;
}

export interface PairResult {
  a: Outcome;
  b: Outcome;
  /** hidden polarisation, only for the hidden-instruction source */
  lambdaDeg?: number;
}

/** Sample one pair. Quantum: Alice's result is a fair coin, Bob's matches with probability cos²(a−b). */
export function samplePair(source: Source, aDeg: number, bDeg: number, rng: Rng): PairResult {
  if (source === 'quantum') {
    const a: Outcome = rng() < 0.5 ? 1 : -1;
    const same = rng() < pSameQuantum(aDeg, bDeg);
    return { a, b: same ? a : (-a as Outcome) };
  }
  const lambdaDeg = rng() * 180;
  return { a: hiddenOutcome(lambdaDeg, aDeg), b: hiddenOutcome(lambdaDeg, bDeg), lambdaDeg };
}

/** CHSH combination for Alice's settings {a, a + 45°} and Bob's {b, b + 45°}. */
export function chshSettings(aDeg: number, bDeg: number): { a: [number, number]; b: [number, number] } {
  return { a: [aDeg, aDeg + 45], b: [bDeg, bDeg + 45] };
}

/** S from the four correlations E[i][j] (i = Alice setting index, j = Bob's). */
export function chshFromE(E: number[][]): number {
  return E[0][0] - E[0][1] + E[1][0] + E[1][1];
}

/** Model value of S for a source and base angles. */
export function chshTheory(source: Source, aDeg: number, bDeg: number): number {
  const { a, b } = chshSettings(aDeg, bDeg);
  return chshFromE(a.map((ai) => b.map((bj) => correlation(source, ai, bj))));
}

/** S for every deterministic local strategy (pre-agreed answers for each of the four settings). */
export function deterministicStrategiesS(): number[] {
  const out: number[] = [];
  for (let m = 0; m < 16; m++) {
    const A = [m & 1 ? 1 : -1, m & 2 ? 1 : -1];
    const B = [m & 4 ? 1 : -1, m & 8 ? 1 : -1];
    out.push(A[0] * B[0] - A[0] * B[1] + A[1] * B[0] + A[1] * B[1]);
  }
  return out;
}
