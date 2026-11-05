/**
 * Quantum computing model: an exact state-vector simulator for n ≤ 3 qubits.
 * The state is 2ⁿ complex amplitudes; basis index b has qubit k's value in bit k (qubit 0 is the
 * rightmost digit of |q₂q₁q₀⟩). Gates are ideal unitary matrices; measurement follows the Born rule.
 * Assumptions: noiseless gates, perfect measurement, no decoherence.
 */
import type { Rng } from '../core/rng';

export type SingleGate = 'H' | 'X' | 'Z' | 'S' | 'T';
export type TwoGate = 'CNOT' | 'CZ';
export type GateName = SingleGate | TwoGate;

export type Op = { gate: SingleGate; target: number } | { gate: TwoGate; control: number; target: number };

export interface State {
  n: number;
  re: Float64Array;
  im: Float64Array;
}

/** 2×2 matrices as [a, b, c, d] for [[a, b], [c, d]], each entry [re, im]. */
const s = Math.SQRT1_2;
export const MATRICES: Record<SingleGate, [number, number][]> = {
  H: [
    [s, 0],
    [s, 0],
    [s, 0],
    [-s, 0],
  ],
  X: [
    [0, 0],
    [1, 0],
    [1, 0],
    [0, 0],
  ],
  Z: [
    [1, 0],
    [0, 0],
    [0, 0],
    [-1, 0],
  ],
  S: [
    [1, 0],
    [0, 0],
    [0, 0],
    [0, 1],
  ],
  T: [
    [1, 0],
    [0, 0],
    [0, 0],
    [s, s],
  ],
};

export function zeroState(n: number): State {
  const re = new Float64Array(1 << n);
  re[0] = 1;
  return { n, re, im: new Float64Array(1 << n) };
}

export function copyState(st: State): State {
  return { n: st.n, re: Float64Array.from(st.re), im: Float64Array.from(st.im) };
}

export function applySingle(st: State, gate: SingleGate, target: number): void {
  const m = MATRICES[gate];
  const bit = 1 << target;
  for (let b = 0; b < st.re.length; b++) {
    if (b & bit) continue;
    const b1 = b | bit;
    const ar = st.re[b];
    const ai = st.im[b];
    const br = st.re[b1];
    const bi = st.im[b1];
    st.re[b] = m[0][0] * ar - m[0][1] * ai + m[1][0] * br - m[1][1] * bi;
    st.im[b] = m[0][0] * ai + m[0][1] * ar + m[1][0] * bi + m[1][1] * br;
    st.re[b1] = m[2][0] * ar - m[2][1] * ai + m[3][0] * br - m[3][1] * bi;
    st.im[b1] = m[2][0] * ai + m[2][1] * ar + m[3][0] * bi + m[3][1] * br;
  }
}

export function applyControlled(st: State, gate: TwoGate, control: number, target: number): void {
  if (control === target) throw new Error('control and target must differ');
  const cb = 1 << control;
  const tb = 1 << target;
  for (let b = 0; b < st.re.length; b++) {
    if (!(b & cb)) continue;
    if (gate === 'CZ') {
      if (b & tb) {
        st.re[b] = -st.re[b];
        st.im[b] = -st.im[b];
      }
    } else if (!(b & tb)) {
      const b1 = b | tb;
      const r = st.re[b];
      const i = st.im[b];
      st.re[b] = st.re[b1];
      st.im[b] = st.im[b1];
      st.re[b1] = r;
      st.im[b1] = i;
    }
  }
}

export function applyOp(st: State, op: Op): void {
  if (op.gate === 'CNOT' || op.gate === 'CZ') applyControlled(st, op.gate, op.control, op.target);
  else applySingle(st, op.gate, op.target);
}

/** Run a circuit given as columns of operations, up to (not including) column `upTo`. */
export function runCircuit(n: number, columns: Op[][], upTo = columns.length): State {
  const st = zeroState(n);
  for (let c = 0; c < Math.min(upTo, columns.length); c++) for (const op of columns[c]) applyOp(st, op);
  return st;
}

export function probabilities(st: State): number[] {
  return Array.from(st.re, (r, i) => r * r + st.im[i] * st.im[i]);
}

export function norm(st: State): number {
  return probabilities(st).reduce((a, b) => a + b, 0);
}

/** |⟨target|state⟩|² */
export function fidelity(st: State, target: { re: number[]; im?: number[] }): number {
  let r = 0;
  let i = 0;
  for (let b = 0; b < st.re.length; b++) {
    const tr = target.re[b] ?? 0;
    const ti = target.im?.[b] ?? 0;
    // conj(target) · state
    r += tr * st.re[b] + ti * st.im[b];
    i += tr * st.im[b] - ti * st.re[b];
  }
  return r * r + i * i;
}

/** Sample one measurement of all qubits; returns the basis index. */
export function measure(st: State, rng: Rng): number {
  const p = probabilities(st);
  let u = rng();
  for (let b = 0; b < p.length; b++) {
    u -= p[b];
    if (u < 0) return b;
  }
  return p.length - 1;
}

/** Purity Tr(ρ_k²) of qubit k's reduced state: 1 for an unentangled qubit, 1/2 when maximally entangled. */
export function qubitPurity(st: State, k: number): number {
  // ρ = [[a, c], [c*, d]] with a = Σ|ψ_{bit=0}|², d = Σ|ψ_{bit=1}|², c = Σ ψ_{b} ψ*_{b|bit}
  const bit = 1 << k;
  let a = 0;
  let d = 0;
  let cr = 0;
  let ci = 0;
  for (let b = 0; b < st.re.length; b++) {
    if (b & bit) continue;
    const b1 = b | bit;
    a += st.re[b] ** 2 + st.im[b] ** 2;
    d += st.re[b1] ** 2 + st.im[b1] ** 2;
    cr += st.re[b] * st.re[b1] + st.im[b] * st.im[b1];
    ci += st.im[b] * st.re[b1] - st.re[b] * st.im[b1];
  }
  return a * a + d * d + 2 * (cr * cr + ci * ci);
}

export function isEntangled(st: State): boolean {
  for (let k = 0; k < st.n; k++) if (qubitPurity(st, k) < 0.999) return true;
  return false;
}

/** Label of basis state b for n qubits, e.g. "|01⟩" (qubit 0 rightmost). */
export function basisLabel(b: number, n: number): string {
  return `|${b.toString(2).padStart(n, '0')}⟩`;
}
