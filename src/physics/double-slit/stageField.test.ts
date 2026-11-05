import { describe, expect, it } from 'vitest';
import { DEFAULT_PARAMS, visibleStripes, type DoubleSlitParams } from './fraunhofer';
import { computeSlitFields, stageGeometry } from './stageField';

/** Count bright maxima of the computed field along the stage's screen column. */
function stageStripes(p: DoubleSlitParams, Lv = 520, H = 520): number {
  const g = stageGeometry(p, Lv, H);
  const cell = 2;
  const nx = Math.round(Lv / cell);
  const ny = Math.round(H / cell);
  const f = computeSlitFields({ nx, ny, cell }, g);
  const col = nx - 1;
  const I: number[] = [];
  for (let j = 0; j < ny; j++) {
    const k = j * nx + col;
    const re = f.re1[k] + f.re2[k];
    const im = f.im1[k] + f.im2[k];
    I.push(re * re + im * im);
  }
  const peak = Math.max(...I);
  let n = 0;
  for (let j = 1; j < ny - 1; j++) if (I[j] > I[j - 1] && I[j] >= I[j + 1] && I[j] > 0.05 * peak) n++;
  return n;
}

describe('stage wave picture', () => {
  it('shows roughly the same number of stripes as the true-scale screen (within max(2, 25%))', () => {
    const cases: Partial<DoubleSlitParams>[] = [
      {},
      { wavelengthNm: 680 },
      { wavelengthNm: 420, separationMm: 0.15 },
      { separationMm: 0.4, screenDistanceM: 1 },
      { separationMm: 0.1, screenDistanceM: 3 },
    ];
    for (const c of cases) {
      const p = { ...DEFAULT_PARAMS, ...c };
      const model = visibleStripes(p);
      expect(Math.abs(stageStripes(p) - model)).toBeLessThanOrEqual(Math.max(2, 0.25 * model));
    }
  });

  it('changes in the same direction as the real physics', () => {
    const base = stageStripes(DEFAULT_PARAMS);
    expect(stageStripes({ ...DEFAULT_PARAMS, wavelengthNm: 680 })).toBeLessThan(base); // redder → wider → fewer
    expect(stageStripes({ ...DEFAULT_PARAMS, separationMm: 0.4 })).toBeGreaterThan(base); // wider gap → more
    expect(stageStripes({ ...DEFAULT_PARAMS, screenDistanceM: 3 })).toBeLessThan(base); // farther → fewer
  });

  it('drawn wavelength grows with the real wavelength', () => {
    const blue = stageGeometry({ ...DEFAULT_PARAMS, wavelengthNm: 450 }, 500, 500).lambdaPx;
    const red = stageGeometry({ ...DEFAULT_PARAMS, wavelengthNm: 650 }, 500, 500).lambdaPx;
    expect(red).toBeGreaterThan(blue);
  });

  it('keeps the drawn slits on the stage', () => {
    const g = stageGeometry(
      { ...DEFAULT_PARAMS, separationMm: 0.4, wavelengthNm: 400, screenDistanceM: 1 },
      600,
      400,
    );
    expect(g.separationPx).toBeLessThanOrEqual(400 * 0.45 + 1e-9);
  });
});
