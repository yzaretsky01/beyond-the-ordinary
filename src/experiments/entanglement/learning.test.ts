import { describe, expect, it } from 'vitest';
import { challengeDone, describe as describeState, unlockedDiscoveries } from './learning';
import { DEFAULT_PARAMS, EntanglementSimulation, type EntanglementParams } from './simulation';

function ctx(p: Partial<EntanglementParams>, n: number, bobTurned = false) {
  const s = new EntanglementSimulation({ ...DEFAULT_PARAMS, ...p });
  s.fire(n);
  return { params: s.params, derived: s.derived(), bobTurned };
}

describe('entanglement discoveries', () => {
  it('coin, twins, opposites', () => {
    expect(unlockedDiscoveries(ctx({}, 10))).toEqual([]);
    expect(unlockedDiscoveries(ctx({}, 30))).toEqual(expect.arrayContaining(['coin', 'twins']));
    expect(unlockedDiscoveries(ctx({ bDeg: 90 }, 30))).toContain('opposites');
  });
  it('no-signalling needs Bob to have turned his dial', () => {
    expect(unlockedDiscoveries(ctx({ bDeg: 40 }, 300, true))).toContain('no-signal');
    expect(unlockedDiscoveries(ctx({ bDeg: 40 }, 300, false))).not.toContain('no-signal');
  });
  it('beating the classical limit needs a significant quantum S > 2', () => {
    expect(unlockedDiscoveries(ctx({ bDeg: 22, mode: 'bell' }, 2000))).toContain('beat');
    expect(unlockedDiscoveries(ctx({ bDeg: 22, mode: 'bell', source: 'hidden' }, 2000))).not.toContain(
      'beat',
    );
  });
});

describe('entanglement challenges', () => {
  it('three in four at 30°', () => {
    expect(challengeDone('three-in-four', ctx({ bDeg: 30 }, 0))).toBe(true);
    expect(challengeDone('three-in-four', ctx({ bDeg: 30, source: 'hidden' }, 0))).toBe(false);
  });
  it('hidden instructions reach exactly 2 at 22.5°-ish', () => {
    expect(challengeDone('hidden-best', ctx({ bDeg: 22, source: 'hidden', mode: 'bell' }, 0))).toBe(true);
    expect(challengeDone('hidden-best', ctx({ bDeg: 60, source: 'hidden', mode: 'bell' }, 0))).toBe(false);
  });
  it('violation needs measured S > 2.5', () => {
    expect(challengeDone('violate', ctx({ bDeg: 22, mode: 'bell' }, 4000))).toBe(true);
    expect(challengeDone('violate', ctx({ bDeg: 22, mode: 'bell' }, 10))).toBe(false);
  });
});

describe('entanglement description', () => {
  it('explore and Bell modes', () => {
    expect(describeState(ctx({}, 0))).toMatch(/No pairs fired yet/);
    expect(describeState(ctx({}, 100))).toMatch(/matched 100 percent.*predicts 100 percent/);
    expect(describeState(ctx({ mode: 'bell' }, 100))).toMatch(/S equals .* classical limit is 2/);
  });
});
