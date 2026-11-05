import { describe, expect, it } from 'vitest';
import { challengeDone, describe as describeState, unlockedDiscoveries } from './learning';
import { QuantumComputerSimulation, type PresetId } from './simulation';

function ctxFrom(s: QuantumComputerSimulation) {
  return { qubits: s.qubits, columns: s.columns, derived: s.derived(), preset: s.preset };
}
function preset(id: PresetId, shots = 20) {
  const s = new QuantumComputerSimulation();
  s.loadPreset(id);
  s.measureShots(shots);
  return ctxFrom(s);
}

describe('quantum computing discoveries', () => {
  it('interference, phase, entanglement, search', () => {
    expect(unlockedDiscoveries(preset('interference'))).toContain('interference');
    expect(unlockedDiscoveries(preset('phase'))).toContain('phase');
    expect(unlockedDiscoveries(preset('bell'))).toEqual(
      expect.arrayContaining(['superposition', 'entangled']),
    );
    expect(unlockedDiscoveries(preset('grover'))).toContain('search');
  });
  it('nothing about interference before measuring', () => {
    expect(unlockedDiscoveries(preset('interference', 0))).not.toContain('interference');
  });
});

describe('quantum computing challenges', () => {
  it('Bell and GHZ states are recognised', () => {
    expect(challengeDone('bell', preset('bell'))).toBe(true);
    expect(challengeDone('ghz', preset('ghz'))).toBe(true);
    expect(challengeDone('bell', preset('ghz'))).toBe(false);
  });
  it('a certain 1 without X: H·Z·H counts, an X gate does not', () => {
    expect(challengeDone('no-x', preset('phase'))).toBe(true);
    const s = new QuantumComputerSimulation(1);
    s.place('X', 0, 0);
    expect(challengeDone('no-x', ctxFrom(s))).toBe(false);
  });
});

describe('quantum computing description', () => {
  it('lists outcomes and measurements', () => {
    expect(describeState(preset('bell', 0))).toMatch(
      /2 qubits, 2 gates.*00 with 50 percent, 11 with 50 percent/,
    );
    expect(describeState(preset('grover', 5))).toMatch(/Measured 5 times; last result 11/);
  });
});
