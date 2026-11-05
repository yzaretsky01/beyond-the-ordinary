import { describe, expect, it } from 'vitest';
import { createRng } from '../core/rng';
import {
  chshSettings,
  chshTheory,
  correlation,
  deterministicStrategiesS,
  foldDelta,
  pSameHidden,
  quantumJoint,
  samplePair,
  type Source,
} from './bell';

function sampleE(source: Source, a: number, b: number, n: number, seed: number) {
  const rng = createRng(seed);
  let sum = 0;
  let aPlus = 0;
  let bPlus = 0;
  for (let i = 0; i < n; i++) {
    const r = samplePair(source, a, b, rng);
    sum += r.a * r.b;
    if (r.a === 1) aPlus++;
    if (r.b === 1) bPlus++;
  }
  return { E: sum / n, aPlus: aPlus / n, bPlus: bPlus / n };
}

describe('entanglement: quantum predictions', () => {
  it('joint probabilities are normalised', () => {
    for (let d = 0; d <= 180; d += 7.5) expect(quantumJoint(0, d).reduce((x, y) => x + y)).toBeCloseTo(1, 12);
  });

  it('E = cos 2(a − b)', () => {
    for (let d = 0; d <= 180; d += 15)
      expect(correlation('quantum', 10, 10 + d)).toBeCloseTo(Math.cos((2 * d * Math.PI) / 180), 12);
  });

  it('sampled correlations converge to cos 2Δ (fixed seed)', () => {
    for (const d of [0, 22.5, 45, 60, 90]) {
      const { E } = sampleE('quantum', 0, d, 40000, 11 + d);
      const expected = Math.cos((2 * d * Math.PI) / 180);
      const se = Math.sqrt((1 - expected ** 2) / 40000) + 1e-3;
      expect(Math.abs(E - expected)).toBeLessThan(5 * se);
    }
  });

  it('CHSH reaches 2√2 at b − a = 22.5°', () => {
    expect(chshTheory('quantum', 0, 22.5)).toBeCloseTo(2 * Math.SQRT2, 12);
    expect(chshSettings(0, 22.5)).toEqual({ a: [0, 45], b: [22.5, 67.5] });
  });

  it('each side alone is a fair coin, whatever the other side does (no signalling)', () => {
    for (const b of [0, 30, 60, 90]) {
      const r = sampleE('quantum', 0, b, 40000, 100 + b);
      expect(Math.abs(r.aPlus - 0.5)).toBeLessThan(0.015);
      expect(Math.abs(r.bPlus - 0.5)).toBeLessThan(0.015);
    }
  });
});

describe('entanglement: hidden instructions (local hidden variables)', () => {
  it('every deterministic local strategy has |S| ≤ 2', () => {
    const all = deterministicStrategiesS();
    expect(all).toHaveLength(16);
    expect(Math.max(...all.map(Math.abs))).toBe(2);
  });

  it('the shared-polarisation model gives P(same) = 1 − Δ/90° and |S| ≤ 2 for all settings', () => {
    for (let d = 0; d <= 90; d += 5) expect(pSameHidden(0, d)).toBeCloseTo(1 - d / 90, 12);
    for (let a = 0; a < 180; a += 7)
      for (let b = 0; b < 180; b += 7)
        expect(Math.abs(chshTheory('hidden', a, b))).toBeLessThanOrEqual(2 + 1e-12);
    expect(chshTheory('hidden', 0, 22.5)).toBeCloseTo(2, 12); // this model just reaches the limit
  });

  it('sampling the hidden model matches its analytic correlation', () => {
    for (const d of [0, 30, 45, 75]) {
      const { E } = sampleE('hidden', 0, d, 40000, 7 + d);
      expect(Math.abs(E - correlation('hidden', 0, d))).toBeLessThan(0.02);
    }
  });

  it('both models agree at 0° and 90° but differ in between', () => {
    for (const d of [0, 90])
      expect(correlation('hidden', 0, d)).toBeCloseTo(correlation('quantum', 0, d), 12);
    expect(correlation('quantum', 0, 30) - correlation('hidden', 0, 30)).toBeGreaterThan(0.15);
  });

  it('foldDelta wraps polariser angles every 180°', () => {
    expect(foldDelta(170)).toBe(10);
    expect(foldDelta(-30)).toBe(30);
    expect(foldDelta(90)).toBe(90);
  });
});
