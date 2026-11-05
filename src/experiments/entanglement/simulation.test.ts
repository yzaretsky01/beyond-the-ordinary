import { describe, expect, it } from 'vitest';
import { DEFAULT_PARAMS, EntanglementSimulation } from './simulation';

describe('EntanglementSimulation', () => {
  it('defaults: same angles, entangled pairs always match', () => {
    const s = new EntanglementSimulation();
    s.fire(300);
    const d = s.derived();
    expect(d.pairs).toBe(300);
    expect(d.matchRate).toBe(1);
  });

  it('at 30° apart quantum pairs match ~75%, hidden instructions ~67%', () => {
    const q = new EntanglementSimulation({ ...DEFAULT_PARAMS, bDeg: 30 });
    q.fire(20000);
    expect(Math.abs(q.derived().matchRate - 0.75)).toBeLessThan(0.015);
    const h = new EntanglementSimulation({ ...DEFAULT_PARAMS, bDeg: 30, source: 'hidden' });
    h.fire(20000);
    expect(Math.abs(h.derived().matchRate - 2 / 3)).toBeLessThan(0.015);
  });

  it('Bell mode: quantum S ≈ 2.83 > 2; hidden instructions stay ≤ 2 within error', () => {
    const q = new EntanglementSimulation({ ...DEFAULT_PARAMS, bDeg: 22, mode: 'bell' });
    q.fire(40000);
    const dq = q.derived();
    expect(dq.S).toBeGreaterThan(2.6);
    expect(Math.abs(dq.S - dq.STheory)).toBeLessThan(4 * dq.SSE);
    const h = new EntanglementSimulation({ ...DEFAULT_PARAMS, bDeg: 22, mode: 'bell', source: 'hidden' });
    h.fire(40000);
    expect(h.derived().S).toBeLessThan(2 + 4 * h.derived().SSE);
  });

  it('settings in Bell mode are chosen at random, roughly equally', () => {
    const s = new EntanglementSimulation({ ...DEFAULT_PARAMS, mode: 'bell' });
    s.fire(8000);
    for (const c of s.derived().bellCounts) expect(Math.abs(c - 2000)).toBeLessThan(200);
  });

  it('every control reaches the physics and clears the statistics', () => {
    const s = new EntanglementSimulation();
    for (const change of [
      { aDeg: 20 },
      { bDeg: 50 },
      { source: 'hidden' as const },
      { mode: 'bell' as const },
    ]) {
      s.fire(20);
      const before = s.derived();
      s.setParams(change);
      const after = s.derived();
      expect(after.pairs).toBe(0);
      expect(
        before.pSameTheory !== after.pSameTheory || before.STheory !== after.STheory || change.mode,
      ).toBeTruthy();
    }
  });

  it('angles wrap every 180°; reset restores defaults', () => {
    const s = new EntanglementSimulation();
    s.setParams({ aDeg: 190 });
    expect(s.params.aDeg).toBe(10);
    s.setStreaming(true);
    s.reset();
    expect(s.params).toEqual(DEFAULT_PARAMS);
    expect(s.derived()).toMatchObject({ pairs: 0, streaming: false });
  });
});
