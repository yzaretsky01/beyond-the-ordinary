import { describe, expect, it } from 'vitest';
import { DEFAULT_PARAMS } from '../../physics/superposition/interferometer';
import { SuperpositionSimulation } from './simulation';

describe('SuperpositionSimulation', () => {
  it('defaults: even split, no phase, both splitters: every photon reaches D1', () => {
    const s = new SuperpositionSimulation();
    expect(s.params).toEqual(DEFAULT_PARAMS);
    s.fire(500);
    expect(s.d1).toBe(500);
    expect(s.d2).toBe(0);
  });

  it('each photon is counted at exactly one detector', () => {
    const s = new SuperpositionSimulation({ thetaDeg: 90, phiDeg: 90, secondSplitter: true });
    s.fire(1000);
    expect(s.d1 + s.d2).toBe(1000);
  });

  it('counts converge to the model probabilities', () => {
    const s = new SuperpositionSimulation({ thetaDeg: 120, phiDeg: 60, secondSplitter: true });
    s.fire(50000);
    const d = s.derived();
    expect(Math.abs(d.d1 / d.total - d.pD1)).toBeLessThan(0.01);
  });

  it('every control changes the physics and clears the counts', () => {
    const s = new SuperpositionSimulation();
    for (const change of [{ thetaDeg: 45 }, { phiDeg: 180 }, { secondSplitter: false }]) {
      s.fire(10);
      const before = s.derived().pD1;
      s.setParams(change);
      expect(s.derived().total).toBe(0);
      expect(s.derived().pD1).not.toBeCloseTo(before, 6);
    }
  });

  it('streaming follows the rate; reset restores defaults', () => {
    const s = new SuperpositionSimulation();
    s.setRate(50);
    s.setStreaming(true);
    for (let i = 0; i < 10; i++) s.step(0.1);
    expect(s.derived().total).toBe(50);
    s.setParams({ phiDeg: 90 });
    s.reset();
    expect(s.params).toEqual(DEFAULT_PARAMS);
    expect(s.derived()).toMatchObject({ total: 0, streaming: false });
  });
});
