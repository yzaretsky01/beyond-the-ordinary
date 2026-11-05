/**
 * Quantum-computing simulation: an editable circuit of up to 8 steps on 1–3 qubits, the exact
 * state after any step, and repeated measurement ("shots") sampled with the Born rule.
 */
import { createRng, type Rng } from '../../physics/core/rng';
import {
  isEntangled,
  measure,
  probabilities,
  runCircuit,
  type GateName,
  type Op,
  type State,
} from '../../physics/quantum-computing/stateVector';
import type { Unsubscribe } from '../../engine/Simulation';

export const COLS = 8;
export type PresetId = 'interference' | 'phase' | 'bell' | 'ghz' | 'grover';

const H = (t: number): Op => ({ gate: 'H', target: t });
const X = (t: number): Op => ({ gate: 'X', target: t });
export const PRESETS: Record<PresetId, { qubits: number; columns: Op[][] }> = {
  interference: { qubits: 1, columns: [[H(0)], [H(0)]] },
  phase: { qubits: 1, columns: [[H(0)], [{ gate: 'Z', target: 0 }], [H(0)]] },
  bell: { qubits: 2, columns: [[H(0)], [{ gate: 'CNOT', control: 0, target: 1 }]] },
  ghz: {
    qubits: 3,
    columns: [[H(0)], [{ gate: 'CNOT', control: 0, target: 1 }], [{ gate: 'CNOT', control: 1, target: 2 }]],
  },
  grover: {
    qubits: 2,
    columns: [
      [H(0), H(1)],
      [{ gate: 'CZ', control: 0, target: 1 }],
      [H(0), H(1)],
      [X(0), X(1)],
      [{ gate: 'CZ', control: 0, target: 1 }],
      [X(0), X(1)],
      [H(0), H(1)],
    ],
  },
};

export interface QcDerived {
  qubits: number;
  /** state shown (after `view` steps) */
  state: State;
  /** probabilities at the end of the circuit */
  final: number[];
  shots: number[];
  totalShots: number;
  lastOutcome: number | null;
  view: number;
  entangled: boolean;
  /** number of columns that contain at least one gate */
  used: number;
}

const emptyColumns = () => Array.from({ length: COLS }, () => [] as Op[]);
const touches = (op: Op, q: number) => op.target === q || ('control' in op && op.control === q);

export class QuantumComputerSimulation {
  qubits: number;
  columns: Op[][];
  view = COLS;
  shots: number[];
  lastOutcome: number | null = null;
  version = 0;
  preset: PresetId | null = null;
  private rng: Rng;
  private listeners = new Set<() => void>();

  constructor(qubits = 2, seed = 1982) {
    this.qubits = qubits;
    this.columns = emptyColumns();
    this.shots = new Array(1 << qubits).fill(0);
    this.rng = createRng(seed);
  }

  private changed(clearShots = true) {
    if (clearShots) {
      this.shots = new Array(1 << this.qubits).fill(0);
      this.lastOutcome = null;
    }
    this.version++;
    this.listeners.forEach((fn) => fn());
  }

  setQubits(n: number) {
    const q = Math.min(3, Math.max(1, Math.round(n)));
    if (q === this.qubits) return;
    this.qubits = q;
    this.columns = emptyColumns();
    this.view = COLS;
    this.preset = null;
    this.changed();
  }

  /** Place a gate. Two-qubit gates use `qubit` as control and the next qubit down (wrapping) as target. */
  place(gate: GateName, qubit: number, col: number): boolean {
    if (col < 0 || col >= COLS || qubit < 0 || qubit >= this.qubits) return false;
    let op: Op;
    if (gate === 'CNOT' || gate === 'CZ') {
      if (this.qubits < 2) return false;
      op = { gate, control: qubit, target: (qubit + 1) % this.qubits };
    } else op = { gate, target: qubit };
    const column = this.columns[col].filter(
      (o) => !touches(o, op.target) && !('control' in op && touches(o, op.control)),
    );
    column.push(op);
    this.columns[col] = column;
    this.preset = null;
    this.changed();
    return true;
  }

  remove(qubit: number, col: number) {
    const before = this.columns[col].length;
    this.columns[col] = this.columns[col].filter((o) => !touches(o, qubit));
    if (this.columns[col].length !== before) {
      this.preset = null;
      this.changed();
    }
  }

  /** The op occupying (qubit, col), if any, and the qubit's role in it. */
  cell(qubit: number, col: number): { op: Op; role: 'single' | 'control' | 'target' } | null {
    for (const op of this.columns[col]) {
      if ('control' in op && op.control === qubit) return { op, role: 'control' };
      if (op.target === qubit) return { op, role: 'control' in op ? 'target' : 'single' };
    }
    return null;
  }

  clearCircuit() {
    this.columns = emptyColumns();
    this.view = COLS;
    this.preset = null;
    this.changed();
  }

  loadPreset(id: PresetId) {
    const p = PRESETS[id];
    this.qubits = p.qubits;
    this.columns = emptyColumns();
    p.columns.forEach((c, i) => (this.columns[i] = c.map((o) => ({ ...o }))));
    this.view = COLS;
    this.preset = id;
    this.changed();
  }

  setView(k: number) {
    this.view = Math.min(COLS, Math.max(0, Math.round(k)));
    this.changed(false);
  }

  measureShots(count: number): number | null {
    const st = runCircuit(this.qubits, this.columns);
    let last: number | null = null;
    for (let i = 0; i < count; i++) {
      last = measure(st, this.rng);
      this.shots[last]++;
    }
    this.lastOutcome = last;
    this.changed(false);
    return last;
  }

  reset() {
    this.qubits = 2;
    this.columns = emptyColumns();
    this.view = COLS;
    this.preset = null;
    this.changed();
  }

  derived(): QcDerived {
    const state = runCircuit(this.qubits, this.columns, this.view);
    const finalState = runCircuit(this.qubits, this.columns);
    return {
      qubits: this.qubits,
      state,
      final: probabilities(finalState),
      shots: [...this.shots],
      totalShots: this.shots.reduce((a, b) => a + b, 0),
      lastOutcome: this.lastOutcome,
      view: this.view,
      entangled: isEntangled(finalState),
      used: this.columns.filter((c) => c.length).length,
    };
  }

  on(fn: () => void): Unsubscribe {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}
