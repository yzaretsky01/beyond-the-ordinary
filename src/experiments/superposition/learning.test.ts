import { describe, expect, it } from 'vitest';
import { DEFAULT_PARAMS, type SuperpositionParams } from '../../physics/superposition/interferometer';
import { challengeDone, describe as describeState, unlockedDiscoveries } from './learning';
import { SuperpositionSimulation } from './simulation';

function ctx(p: Partial<SuperpositionParams>, fired: number, phaseTurnedWhileOut = false) {
  const s = new SuperpositionSimulation({ ...DEFAULT_PARAMS, ...p });
  s.fire(fired);
  return { params: s.params, derived: s.derived(), phaseTurnedWhileOut };
}

describe('superposition discoveries', () => {
  it('first photon is detected whole', () => {
    expect(unlockedDiscoveries(ctx({}, 0))).toEqual([]);
    expect(unlockedDiscoveries(ctx({}, 1))).toContain('whole');
  });
  it('certainty and the half-wave flip need both splitters', () => {
    expect(unlockedDiscoveries(ctx({}, 50))).toContain('certain');
    expect(unlockedDiscoveries(ctx({ phiDeg: 180 }, 50))).toContain('flip');
    expect(unlockedDiscoveries(ctx({ secondSplitter: false }, 50))).not.toContain('certain');
  });
  it('coin toss and phase-blindness without the second splitter', () => {
    expect(unlockedDiscoveries(ctx({ secondSplitter: false }, 100))).toContain('coin');
    expect(unlockedDiscoveries(ctx({ secondSplitter: false, phiDeg: 90 }, 50, true))).toContain('blind');
    expect(unlockedDiscoveries(ctx({ secondSplitter: false, phiDeg: 90 }, 50, false))).not.toContain('blind');
  });
});

describe('superposition challenges', () => {
  it('all to D2', () => {
    expect(challengeDone('all-d2', ctx({ phiDeg: 180 }, 0))).toBe(true);
    expect(challengeDone('all-d2', ctx({}, 0))).toBe(false);
  });
  it('balance with both splitters (e.g. φ = 90°)', () => {
    expect(challengeDone('balance', ctx({ phiDeg: 90 }, 0))).toBe(true);
    expect(challengeDone('balance', ctx({ secondSplitter: false }, 0))).toBe(false);
  });
  it('three in four without the second splitter (θ = 60°)', () => {
    expect(challengeDone('three-quarters', ctx({ secondSplitter: false, thetaDeg: 60 }, 0))).toBe(true);
    expect(challengeDone('three-quarters', ctx({ thetaDeg: 60 }, 0))).toBe(false);
  });
});

describe('superposition description', () => {
  it('describes setup, prediction and counts', () => {
    expect(describeState(ctx({}, 0))).toMatch(/50 percent.*predicts 100 percent.*No photons fired/);
    expect(describeState(ctx({}, 10))).toMatch(/10 photons reached detector 1 and 0 reached detector 2/);
  });
});
