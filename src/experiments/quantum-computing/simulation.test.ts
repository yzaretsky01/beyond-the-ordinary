import { describe, expect, it } from 'vitest';
import { COLS, QuantumComputerSimulation } from './simulation';

describe('QuantumComputerSimulation', () => {
  it('starts with 2 qubits in |00⟩ and an empty circuit', () => {
    const s = new QuantumComputerSimulation();
    const d = s.derived();
    expect(d.qubits).toBe(2);
    expect(d.final[0]).toBe(1);
    expect(d.used).toBe(0);
  });

  it('placing gates changes the state; two-qubit gates take the next qubit as target', () => {
    const s = new QuantumComputerSimulation();
    s.place('H', 0, 0);
    s.place('CNOT', 0, 1);
    expect(s.cell(1, 1)).toMatchObject({ role: 'target' });
    const d = s.derived();
    expect(d.final[0]).toBeCloseTo(0.5, 12);
    expect(d.final[3]).toBeCloseTo(0.5, 12);
    expect(d.entangled).toBe(true);
  });

  it('a new gate replaces whatever used the same qubit in that step; remove deletes it', () => {
    const s = new QuantumComputerSimulation();
    s.place('H', 0, 0);
    s.place('X', 0, 0);
    expect(s.columns[0]).toEqual([{ gate: 'X', target: 0 }]);
    s.remove(0, 0);
    expect(s.columns[0]).toEqual([]);
  });

  it('viewing earlier steps shows the intermediate state', () => {
    const s = new QuantumComputerSimulation();
    s.loadPreset('interference');
    s.setView(1);
    expect(s.derived().state.re[0]).toBeCloseTo(Math.SQRT1_2, 12);
    s.setView(COLS);
    expect(s.derived().final[0]).toBeCloseTo(1, 12);
  });

  it('shots follow the Born rule and clear when the circuit changes', () => {
    const s = new QuantumComputerSimulation();
    s.loadPreset('bell');
    s.measureShots(4000);
    const d = s.derived();
    expect(d.totalShots).toBe(4000);
    expect(d.shots[1] + d.shots[2]).toBe(0);
    expect(Math.abs(d.shots[0] / 4000 - 0.5)).toBeLessThan(0.03);
    s.place('X', 1, 2);
    expect(s.derived().totalShots).toBe(0);
  });

  it('Grover preset finds |11⟩ every time; qubit count and reset work', () => {
    const s = new QuantumComputerSimulation();
    s.loadPreset('grover');
    s.measureShots(200);
    expect(s.derived().shots[3]).toBe(200);
    s.setQubits(3);
    expect(s.derived().final).toHaveLength(8);
    expect(s.place('CNOT', 0, 0)).toBe(true);
    s.setQubits(1);
    expect(s.place('CNOT', 0, 0)).toBe(false);
    s.reset();
    expect(s.derived().qubits).toBe(2);
  });
});
