import { describe, expect, it } from 'vitest';
import { createRng } from '../core/rng';
import {
  DEFAULT_PARAMS,
  blochVector,
  detectorProbabilities,
  measurePath,
  pD1ClosedForm,
  pathAmplitudes,
  sanitizeParams,
  type SuperpositionParams,
} from './interferometer';

const grid: SuperpositionParams[] = [];
for (let t = 0; t <= 180; t += 15)
  for (let f = 0; f <= 360; f += 30)
    for (const s of [true, false]) grid.push({ thetaDeg: t, phiDeg: f, secondSplitter: s });

describe('superposition: Mach–Zehnder interferometer', () => {
  it('the path state is normalised', () => {
    for (const p of grid) {
      const { upper: u, lower: l } = pathAmplitudes(p);
      expect(u.re ** 2 + u.im ** 2 + l.re ** 2 + l.im ** 2).toBeCloseTo(1, 12);
    }
  });

  it('probabilities always sum to 1 (the second splitter is unitary)', () => {
    for (const p of grid) {
      const pr = detectorProbabilities(p);
      expect(pr.d1 + pr.d2).toBeCloseTo(1, 12);
    }
  });

  it('amplitude calculation matches the closed form (1 + sinθ cosφ)/2 and cos²(θ/2)', () => {
    for (const p of grid) expect(detectorProbabilities(p).d1).toBeCloseTo(pD1ClosedForm(p), 12);
  });

  it('even split with both splitters: P(D1) = cos²(φ/2)', () => {
    for (let f = 0; f <= 360; f += 10) {
      const p = { thetaDeg: 90, phiDeg: f, secondSplitter: true };
      expect(detectorProbabilities(p).d1).toBeCloseTo(Math.cos((f * Math.PI) / 360) ** 2, 12);
    }
    expect(detectorProbabilities(DEFAULT_PARAMS).d1).toBeCloseTo(1, 12); // all photons to D1
    expect(detectorProbabilities({ ...DEFAULT_PARAMS, phiDeg: 180 }).d2).toBeCloseTo(1, 12); // all to D2
  });

  it('without the second splitter the phase cannot be seen', () => {
    for (let f = 0; f <= 360; f += 15)
      expect(detectorProbabilities({ thetaDeg: 60, phiDeg: f, secondSplitter: false }).d1).toBeCloseTo(
        Math.cos(Math.PI / 6) ** 2,
        12,
      );
  });

  it('Bloch vector has length 1 and its x component gives P(D1) = (1 + x)/2', () => {
    for (const p of grid) {
      const [x, y, z] = blochVector(p);
      expect(x * x + y * y + z * z).toBeCloseTo(1, 12);
      if (p.secondSplitter) expect(detectorProbabilities(p).d1).toBeCloseTo((1 + x) / 2, 12);
      else expect(detectorProbabilities(p).d1).toBeCloseTo((1 + z) / 2, 12);
    }
  });

  it('Born-rule sampling matches the probability (fixed seed)', () => {
    const rng = createRng(3);
    const p = { thetaDeg: 70, phiDeg: 40, secondSplitter: true };
    const P = detectorProbabilities(p).d1;
    const N = 40000;
    let n = 0;
    for (let i = 0; i < N; i++) if (rng() < P) n++;
    const sigma = Math.sqrt(N * P * (1 - P));
    expect(Math.abs(n - N * P)).toBeLessThan(4 * sigma);
  });

  it('repeated which-path measurement gives the same answer (collapse)', () => {
    const rng = createRng(9);
    for (let i = 0; i < 200; i++) {
      const first = measurePath({ thetaDeg: 90, phiDeg: 45, secondSplitter: false }, rng());
      const second = measurePath(first.after, rng());
      expect(second.path).toBe(first.path);
    }
  });

  it('sanitizeParams keeps angles in range', () => {
    expect(sanitizeParams({ thetaDeg: 400, phiDeg: -90, secondSplitter: true })).toEqual({
      thetaDeg: 180,
      phiDeg: 270,
      secondSplitter: true,
    });
    expect(sanitizeParams({ thetaDeg: 90, phiDeg: 360, secondSplitter: true }).phiDeg).toBe(360);
  });
});
