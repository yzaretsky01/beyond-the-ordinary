import { describe, expect, it } from 'vitest';
import { createRng } from '../core/rng';
import { buildSamplingTable, sampleTable } from '../core/sampling';
import {
  DEFAULT_PARAMS,
  RANGES,
  SCREEN_HALF_WIDTH_MM,
  brightFringeMm,
  darkFringeMm,
  envelopeZeroMm,
  fresnelNumber,
  fringeSpacingMm,
  intensity,
  sanitizeParams,
  screenIntegral,
  visibleStripes,
  type DoubleSlitParams,
} from './fraunhofer';

const P = DEFAULT_PARAMS;
const with_ = (o: Partial<DoubleSlitParams>): DoubleSlitParams => ({ ...P, ...o });

describe('double-slit intensity (Fraunhofer)', () => {
  it('is 1 at the centre with both slits open', () => {
    expect(intensity(0, P)).toBeCloseTo(1, 12);
  });

  it('is symmetric about the centre', () => {
    for (const y of [0.3, 1.7, 4.2, 11]) expect(intensity(y, P)).toBeCloseTo(intensity(-y, P), 12);
  });

  it('at d sinθ = mλ the two waves are exactly in step: intensity equals the single-slit envelope', () => {
    for (let m = 1; m <= 4; m++) {
      const y = brightFringeMm(m, P);
      const s = y / Math.hypot(y, P.screenDistanceM * 1000);
      const beta = (Math.PI * P.slitWidthMm * s) / (P.wavelengthNm * 1e-6);
      const envelope = (Math.sin(beta) / beta) ** 2;
      expect(intensity(y, P)).toBeCloseTo(envelope, 10);
    }
  });

  it('true brightness peaks lie within 5% of a spacing of d sinθ = mλ (the sloping envelope pulls them inward)', () => {
    const spacing = fringeSpacingMm(P);
    for (let m = 1; m <= 4; m++) {
      const y0 = brightFringeMm(m, P);
      let best = y0;
      for (let y = y0 - 0.2 * spacing; y <= y0 + 0.2 * spacing; y += spacing / 4000)
        if (intensity(y, P) > intensity(best, P)) best = y;
      expect(Math.abs(best - y0) / spacing).toBeLessThan(0.05);
      expect(best).toBeLessThanOrEqual(y0); // shifted toward the centre, as expected
    }
  });

  it('is zero at dark fringes, d sinθ = (m + ½)λ', () => {
    for (let m = 0; m <= 4; m++) expect(intensity(darkFringeMm(m, P), P)).toBeLessThan(1e-20);
  });

  it('is zero at the first envelope zero, a sinθ = λ', () => {
    const p = with_({ slitWidthMm: 0.06, screenDistanceM: 1 }); // zero inside the screen
    const y = envelopeZeroMm(p);
    expect(y).toBeLessThan(SCREEN_HALF_WIDTH_MM);
    expect(intensity(y, p)).toBeLessThan(1e-20);
  });

  it('fringe spacing matches λL/d (small-angle) to better than 0.1%', () => {
    const exact = brightFringeMm(1, P) - brightFringeMm(0, P);
    expect(Math.abs(exact - fringeSpacingMm(P)) / fringeSpacingMm(P)).toBeLessThan(1e-3);
    expect(fringeSpacingMm(P)).toBeCloseTo((532e-6 * 1500) / 0.25, 12); // 3.192 mm
  });

  it('longer wavelength or longer distance spreads the fringes; wider separation squeezes them', () => {
    const s0 = fringeSpacingMm(P);
    expect(fringeSpacingMm(with_({ wavelengthNm: 650 }))).toBeGreaterThan(s0);
    expect(fringeSpacingMm(with_({ screenDistanceM: 2.5 }))).toBeGreaterThan(s0);
    expect(fringeSpacingMm(with_({ separationMm: 0.4 }))).toBeLessThan(s0);
  });
});

describe('which-path and single-slit cases', () => {
  it('detector removes the fringes: intensity at a dark fringe equals its neighbour bright fringe envelope', () => {
    const p = with_({ detector: true });
    const yDark = darkFringeMm(0, P);
    const yBright = brightFringeMm(1, P);
    // with which-path information there is no modulation, only the smooth single-slit envelope (×½)
    const env = (y: number) => 2 * intensity(y, with_({ openSlits: 'upper' }));
    expect(intensity(yDark, p)).toBeCloseTo(0.5 * env(yDark) * 2, 12);
    expect(intensity(yBright, p)).toBeCloseTo(0.5 * env(yBright) * 2, 12);
    expect(intensity(yDark, p)).toBeGreaterThan(0.4);
  });

  it('detector pattern is exactly the sum of the two single-slit patterns', () => {
    for (const y of [0, 0.8, 2.3, 7.1]) {
      const sum = intensity(y, with_({ openSlits: 'upper' })) + intensity(y, with_({ openSlits: 'lower' }));
      expect(intensity(y, with_({ detector: true }))).toBeCloseTo(sum, 12);
    }
  });

  it('one slit gives a quarter of the two-slit peak and no stripes', () => {
    const p = with_({ openSlits: 'lower' });
    expect(intensity(0, p)).toBeCloseTo(0.25, 12);
    expect(visibleStripes(p)).toBe(0);
  });

  it('closing one slit halves the arrivals; the detector does not change the total', () => {
    const both = screenIntegral(P);
    expect(screenIntegral(with_({ openSlits: 'upper' })) / both).toBeCloseTo(0.5, 2);
    expect(screenIntegral(with_({ detector: true })) / both).toBeCloseTo(1, 2);
  });
});

describe('stripe count', () => {
  it('counts the default pattern correctly', () => {
    // spacing 3.19 mm on a ±15 mm screen: fringes m = −4…4 lie inside; all are above 5% of the peak
    expect(visibleStripes(P)).toBe(9);
  });
  it('is zero with a detector', () => {
    expect(visibleStripes(with_({ detector: true }))).toBe(0);
  });
});

describe('model validity', () => {
  it('far-field approximation holds at every corner of the parameter ranges (Fresnel number ≤ 0.15)', () => {
    const corners: DoubleSlitParams[] = [];
    for (const wavelengthNm of [RANGES.wavelengthNm.min, RANGES.wavelengthNm.max])
      for (const separationMm of [RANGES.separationMm.min, RANGES.separationMm.max])
        for (const slitWidthMm of [RANGES.slitWidthMm.min, RANGES.slitWidthMm.max])
          for (const screenDistanceM of [RANGES.screenDistanceM.min, RANGES.screenDistanceM.max])
            corners.push(sanitizeParams({ ...P, wavelengthNm, separationMm, slitWidthMm, screenDistanceM }));
    for (const c of corners) expect(fresnelNumber(c)).toBeLessThanOrEqual(0.15);
  });

  it('sanitizeParams clamps values and keeps the slits from overlapping', () => {
    const s = sanitizeParams(with_({ wavelengthNm: 9999, separationMm: 0.1, slitWidthMm: 0.06 }));
    expect(s.wavelengthNm).toBe(700);
    expect(s.slitWidthMm).toBeLessThan(s.separationMm);
  });
});

describe('particle sampling (Born rule)', () => {
  it('sampled arrivals match the predicted distribution (χ² test, fixed seed)', () => {
    const table = buildSamplingTable(
      (y) => intensity(y, P),
      -SCREEN_HALF_WIDTH_MM,
      SCREEN_HALF_WIDTH_MM,
      4096,
    );
    const rng = createRng(42);
    const bins = 60;
    const counts = new Array(bins).fill(0);
    const N = 60000;
    for (let i = 0; i < N; i++) {
      const y = sampleTable(table, rng(), rng());
      counts[
        Math.min(bins - 1, Math.floor(((y + SCREEN_HALF_WIDTH_MM) / (2 * SCREEN_HALF_WIDTH_MM)) * bins))
      ]++;
    }
    const total = screenIntegral(P, 8000);
    let chi2 = 0;
    let dof = 0;
    const w = (2 * SCREEN_HALF_WIDTH_MM) / bins;
    for (let b = 0; b < bins; b++) {
      let p = 0;
      for (let k = 0; k < 50; k++)
        p += intensity(-SCREEN_HALF_WIDTH_MM + (b + (k + 0.5) / 50) * w, P) * (w / 50);
      const expected = (N * p) / total;
      if (expected < 5) continue;
      chi2 += (counts[b] - expected) ** 2 / expected;
      dof++;
    }
    // For ~dof degrees of freedom, χ² well above dof + 4√(2·dof) would signal a mismatch.
    expect(chi2).toBeLessThan(dof + 4 * Math.sqrt(2 * dof));
  });
});
