/** Discoveries, challenges and screen-reader text for the quantum computing room: pure functions. */
import {
  basisLabel,
  fidelity,
  probabilities,
  runCircuit,
  type Op,
} from '../../physics/quantum-computing/stateVector';
import type { ChallengeId, DiscoveryId } from './content';
import type { PresetId, QcDerived } from './simulation';

export interface LearningContext {
  qubits: number;
  columns: Op[][];
  derived: QcDerived;
  preset: PresetId | null;
}

/** The sequence of single-qubit gate names on qubit q, in order, ignoring empty steps. */
function sequenceOn(columns: Op[][], q: number): string[] {
  const out: string[] = [];
  for (const col of columns)
    for (const op of col) if (op.target === q || ('control' in op && op.control === q)) out.push(op.gate);
  return out;
}

const containsRun = (seq: string[], run: string[]) =>
  seq.some((_, i) => run.every((g, j) => seq[i + j] === g));

export function unlockedDiscoveries(ctx: LearningContext): DiscoveryId[] {
  const out: DiscoveryId[] = [];
  const st = ctx.derived.state;
  const p = probabilities(st);
  if (ctx.columns.some((c) => c.some((o) => o.gate === 'H')) && p.filter((x) => x > 0.01).length >= 2)
    out.push('superposition');
  const shots = ctx.derived.totalShots;
  for (let q = 0; q < ctx.qubits; q++) {
    const seq = sequenceOn(ctx.columns, q);
    if (shots >= 1 && containsRun(seq, ['H', 'H'])) out.push('interference');
    if (shots >= 1 && containsRun(seq, ['H', 'Z', 'H'])) out.push('phase');
  }
  if (ctx.derived.entangled && shots >= 10) out.push('entangled');
  if (ctx.preset === 'grover' && shots >= 10) out.push('search');
  return [...new Set(out)];
}

const R = Math.SQRT1_2;

export function challengeDone(id: ChallengeId, ctx: LearningContext): boolean {
  const final = runCircuit(ctx.qubits, ctx.columns);
  switch (id) {
    case 'bell':
      return ctx.qubits === 2 && fidelity(final, { re: [R, 0, 0, R] }) > 0.999;
    case 'ghz':
      return ctx.qubits === 3 && fidelity(final, { re: [R, 0, 0, 0, 0, 0, 0, R] }) > 0.999;
    case 'no-x': {
      if (ctx.columns.some((c) => c.some((o) => o.gate === 'X' || o.gate === 'CNOT'))) return false;
      const p = probabilities(final);
      for (let q = 0; q < ctx.qubits; q++) {
        let p1 = 0;
        p.forEach((v, b) => (p1 += b & (1 << q) ? v : 0));
        if (p1 > 0.999) return true;
      }
      return false;
    }
  }
}

export function describe(ctx: LearningContext): string {
  const d = ctx.derived;
  const gates = ctx.columns.flat().length;
  const p = probabilities(d.state);
  const likely = p
    .map((v, b) => ({ v, b }))
    .filter((x) => x.v > 0.005)
    .map((x) => `${basisLabel(x.b, d.qubits).replace(/[|⟩]/g, '')} with ${Math.round(x.v * 100)} percent`)
    .join(', ');
  const base = `${d.qubits} qubit${d.qubits > 1 ? 's' : ''}, ${gates} gate${gates === 1 ? '' : 's'}. After step ${d.view}, outcomes: ${likely}.`;
  if (!d.totalShots) return base;
  return `${base} Measured ${d.totalShots} times; last result ${basisLabel(d.lastOutcome ?? 0, d.qubits).replace(/[|⟩]/g, '')}.`;
}
