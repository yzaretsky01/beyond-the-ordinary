import { describe, expect, it } from 'vitest';
import { createRng } from '../core/rng';
import {
  MATRICES,
  applyOp,
  copyState,
  fidelity,
  isEntangled,
  measure,
  norm,
  probabilities,
  qubitPurity,
  runCircuit,
  zeroState,
  type Op,
  type SingleGate,
} from './stateVector';

const R = Math.SQRT1_2;

describe('quantum computing: gates', () => {
  it('every single-qubit gate is unitary (U†U = I)', () => {
    for (const g of Object.keys(MATRICES) as SingleGate[]) {
      const m = MATRICES[g];
      const [a, b, c, d] = m;
      const conj = (z: [number, number]) => [z[0], -z[1]] as [number, number];
      const mul = (x: [number, number], y: [number, number]) => [
        x[0] * y[0] - x[1] * y[1],
        x[0] * y[1] + x[1] * y[0],
      ];
      const add = (x: number[], y: number[]) => [x[0] + y[0], x[1] + y[1]];
      // U†U entries
      const e00 = add(mul(conj(a), a), mul(conj(c), c));
      const e01 = add(mul(conj(a), b), mul(conj(c), d));
      const e11 = add(mul(conj(b), b), mul(conj(d), d));
      expect(e00[0]).toBeCloseTo(1, 12);
      expect(e11[0]).toBeCloseTo(1, 12);
      expect(Math.hypot(e01[0], e01[1])).toBeCloseTo(0, 12);
    }
  });

  it('circuits preserve the norm for random gate sequences', () => {
    const rng = createRng(4);
    const names = ['H', 'X', 'Z', 'S', 'T', 'CNOT', 'CZ'] as const;
    for (let trial = 0; trial < 50; trial++) {
      const st = zeroState(3);
      for (let k = 0; k < 20; k++) {
        const g = names[Math.floor(rng() * names.length)];
        const t = Math.floor(rng() * 3);
        const op: Op =
          g === 'CNOT' || g === 'CZ' ? { gate: g, control: (t + 1) % 3, target: t } : { gate: g, target: t };
        applyOp(st, op);
      }
      expect(norm(st)).toBeCloseTo(1, 12);
    }
  });

  it('HH = I and HZH = X', () => {
    const hh = runCircuit(1, [[{ gate: 'H', target: 0 }], [{ gate: 'H', target: 0 }]]);
    expect(fidelity(hh, { re: [1, 0] })).toBeCloseTo(1, 12);
    const hzh = runCircuit(1, [
      [{ gate: 'H', target: 0 }],
      [{ gate: 'Z', target: 0 }],
      [{ gate: 'H', target: 0 }],
    ]);
    expect(fidelity(hzh, { re: [0, 1] })).toBeCloseTo(1, 12);
  });

  it('T² = S and S² = Z', () => {
    const tt = runCircuit(1, [
      [{ gate: 'H', target: 0 }],
      [{ gate: 'T', target: 0 }],
      [{ gate: 'T', target: 0 }],
    ]);
    const s1 = runCircuit(1, [[{ gate: 'H', target: 0 }], [{ gate: 'S', target: 0 }]]);
    expect(fidelity(tt, { re: Array.from(s1.re), im: Array.from(s1.im) })).toBeCloseTo(1, 12);
    const ss = runCircuit(1, [
      [{ gate: 'H', target: 0 }],
      [{ gate: 'S', target: 0 }],
      [{ gate: 'S', target: 0 }],
    ]);
    expect(fidelity(ss, { re: [R, -R] })).toBeCloseTo(1, 12);
  });
});

describe('quantum computing: entanglement and algorithms', () => {
  it('H then CNOT makes the Bell state (|00⟩ + |11⟩)/√2, which is entangled', () => {
    const bell = runCircuit(2, [[{ gate: 'H', target: 0 }], [{ gate: 'CNOT', control: 0, target: 1 }]]);
    expect(fidelity(bell, { re: [R, 0, 0, R] })).toBeCloseTo(1, 12);
    expect(isEntangled(bell)).toBe(true);
    expect(qubitPurity(bell, 0)).toBeCloseTo(0.5, 12);
    expect(
      isEntangled(
        runCircuit(2, [
          [
            { gate: 'H', target: 0 },
            { gate: 'H', target: 1 },
          ],
        ]),
      ),
    ).toBe(false);
  });

  it('two-qubit Grover search finds the marked item |11⟩ with probability 1', () => {
    const cols: Op[][] = [
      [
        { gate: 'H', target: 0 },
        { gate: 'H', target: 1 },
      ],
      [{ gate: 'CZ', control: 0, target: 1 }], // oracle marks |11⟩
      [
        { gate: 'H', target: 0 },
        { gate: 'H', target: 1 },
      ],
      [
        { gate: 'X', target: 0 },
        { gate: 'X', target: 1 },
      ],
      [{ gate: 'CZ', control: 0, target: 1 }],
      [
        { gate: 'X', target: 0 },
        { gate: 'X', target: 1 },
      ],
      [
        { gate: 'H', target: 0 },
        { gate: 'H', target: 1 },
      ],
    ];
    expect(probabilities(runCircuit(2, cols))[3]).toBeCloseTo(1, 12);
  });

  it('measurement statistics follow the Born rule', () => {
    const st = runCircuit(2, [[{ gate: 'H', target: 0 }], [{ gate: 'CNOT', control: 0, target: 1 }]]);
    const rng = createRng(8);
    const counts = [0, 0, 0, 0];
    for (let i = 0; i < 20000; i++) counts[measure(st, rng)]++;
    expect(counts[1] + counts[2]).toBe(0); // never 01 or 10
    expect(Math.abs(counts[0] / 20000 - 0.5)).toBeLessThan(0.015);
  });

  it('runCircuit can stop part-way and copyState is independent', () => {
    const cols: Op[][] = [[{ gate: 'X', target: 0 }], [{ gate: 'X', target: 0 }]];
    expect(probabilities(runCircuit(1, cols, 1))[1]).toBe(1);
    const a = zeroState(1);
    const b = copyState(a);
    applyOp(b, { gate: 'X', target: 0 });
    expect(a.re[0]).toBe(1);
  });
});
