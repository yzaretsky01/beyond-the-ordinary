import { describe, expect, it } from 'vitest';
import { fft } from './fft';
import { createRng } from './rng';

describe('fft', () => {
  it('matches a direct DFT', () => {
    const n = 16;
    const rng = createRng(1);
    const re = Float64Array.from({ length: n }, () => rng() - 0.5);
    const im = Float64Array.from({ length: n }, () => rng() - 0.5);
    const r2 = Float64Array.from(re);
    const i2 = Float64Array.from(im);
    fft(r2, i2);
    for (let k = 0; k < n; k++) {
      let sr = 0;
      let si = 0;
      for (let j = 0; j < n; j++) {
        const a = (-2 * Math.PI * k * j) / n;
        sr += re[j] * Math.cos(a) - im[j] * Math.sin(a);
        si += re[j] * Math.sin(a) + im[j] * Math.cos(a);
      }
      expect(r2[k]).toBeCloseTo(sr, 10);
      expect(i2[k]).toBeCloseTo(si, 10);
    }
  });

  it('inverse undoes forward, and Parseval holds', () => {
    const n = 1024;
    const rng = createRng(2);
    const re = Float64Array.from({ length: n }, () => rng() - 0.5);
    const im = Float64Array.from({ length: n }, () => rng() - 0.5);
    const r = Float64Array.from(re);
    const i = Float64Array.from(im);
    fft(r, i);
    let eT = 0;
    let eF = 0;
    for (let k = 0; k < n; k++) {
      eT += re[k] ** 2 + im[k] ** 2;
      eF += r[k] ** 2 + i[k] ** 2;
    }
    expect(eF / n).toBeCloseTo(eT, 9);
    fft(r, i, true);
    for (let k = 0; k < n; k++) {
      expect(r[k]).toBeCloseTo(re[k], 12);
      expect(i[k]).toBeCloseTo(im[k], 12);
    }
  });

  it('rejects lengths that are not powers of two', () => {
    expect(() => fft(new Float64Array(6), new Float64Array(6))).toThrow();
  });
});
