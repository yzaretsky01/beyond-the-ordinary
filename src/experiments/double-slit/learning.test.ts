import { describe, expect, it } from 'vitest';
import { DEFAULT_PARAMS, type DoubleSlitParams } from '../../physics/double-slit/fraunhofer';
import { DoubleSlitSimulation } from './simulation';
import {
  challengeDone,
  choiceToProfile,
  countPredictedBands,
  describe as describeState,
  unlockedDiscoveries,
} from './learning';

function ctx(params: Partial<DoubleSlitParams>, arrivals: number) {
  const s = new DoubleSlitSimulation({ ...DEFAULT_PARAMS, ...params });
  s.fire(arrivals * 3);
  // trim to an exact number of arrivals for predictable tests
  const d = { ...s.derived(), arrivals };
  return { params: s.params, derived: d };
}

describe('discoveries', () => {
  it('nothing before any photon lands', () => {
    expect(unlockedDiscoveries(ctx({}, 0))).toEqual([]);
  });
  it('first dot, then stripes after enough arrivals', () => {
    expect(unlockedDiscoveries(ctx({}, 1))).toEqual(['one-dot']);
    expect(unlockedDiscoveries(ctx({}, 400))).toContain('stripes');
  });
  it('which-path needs the detector with both slits open', () => {
    expect(unlockedDiscoveries(ctx({ detector: true }, 300))).toContain('which-path');
    expect(unlockedDiscoveries(ctx({ detector: true, openSlits: 'upper' }, 300))).not.toContain('which-path');
  });
  it('one slit and colour', () => {
    expect(unlockedDiscoveries(ctx({ openSlits: 'lower' }, 300))).toContain('one-slit');
    expect(unlockedDiscoveries(ctx({ wavelengthNm: 650 }, 200))).toContain('colour');
    expect(unlockedDiscoveries(ctx({ wavelengthNm: 600 }, 200))).not.toContain('colour');
  });
});

describe('challenges are checked from the simulation', () => {
  const base = { startSpacingMm: new DoubleSlitSimulation().derived().spacingMm };
  it('double the spacing (e.g. halve the separation)', () => {
    expect(challengeDone('double', ctx({}, 0), base)).toBe(false);
    expect(challengeDone('double', ctx({ separationMm: 0.125 }, 0), base)).toBe(true);
    expect(challengeDone('double', ctx({ screenDistanceM: 3 }, 0), base)).toBe(true);
  });
  it('exactly five stripes', () => {
    // spacing must be about 6–7.5 mm: e.g. d = 0.12 mm at defaults gives 6.65 mm
    expect(challengeDone('five', ctx({ separationMm: 0.12 }, 0), base)).toBe(true);
    expect(challengeDone('five', ctx({}, 0), base)).toBe(false);
  });
  it('erase with both slits open', () => {
    expect(challengeDone('erase', ctx({ detector: true }, 0), base)).toBe(true);
    expect(challengeDone('erase', ctx({ openSlits: 'upper' }, 0), base)).toBe(false);
  });
});

describe('screen-reader description', () => {
  it('describes the setup and the result', () => {
    expect(describeState(ctx({}, 0))).toMatch(/532 nanometre light.*No photons have landed yet/);
    expect(describeState(ctx({}, 1000))).toMatch(/9 bright stripes about 3\.2 millimetres apart/);
    expect(describeState(ctx({ detector: true }, 1000))).toMatch(/no stripes, because the detector/);
  });
});

describe('prediction helpers', () => {
  it('count bands in a profile', () => {
    expect(countPredictedBands(choiceToProfile('one', 120))).toBe(1);
    expect(countPredictedBands(choiceToProfile('two', 120))).toBe(2);
    expect(countPredictedBands(choiceToProfile('many', 120))).toBeGreaterThan(4);
    expect(countPredictedBands(new Array(10).fill(0))).toBe(0);
  });
});
