import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PARAMS,
  ENERGY_UNIT_EV,
  TIME_UNIT_FS,
  Wave1D,
  predictions,
  sanitizeParams,
  transmissionPlane,
  type TunnelParams,
} from './schrodinger1d';

function runToEnd(p: TunnelParams) {
  const w = new Wave1D(p);
  for (let i = 0; i < 400 && !w.collisionOver(); i++) w.step(50);
  return w;
}

describe('tunneling: units', () => {
  it('energy and time units follow from CODATA constants', () => {
    expect(ENERGY_UNIT_EV).toBeCloseTo(7.62, 2);
    expect(TIME_UNIT_FS).toBeCloseTo(0.0864, 3);
  });
});

describe('tunneling: split-operator solver', () => {
  it('conserves probability: drift < 1e-6 per 1000 steps without absorbers', () => {
    const w = new Wave1D(DEFAULT_PARAMS, { absorb: false });
    const n0 = w.probability();
    expect(n0).toBeCloseTo(1, 6);
    w.step(1000);
    expect(Math.abs(w.probability() - n0)).toBeLessThan(1e-6);
  });

  it('a free packet spreads as σ(t) = σ√(1 + (t/2σ²)²)', () => {
    const p = { ...DEFAULT_PARAMS, barrierEv: 0 };
    const w = new Wave1D(p, { absorb: false });
    const s0 = w.sigma;
    expect(w.width()).toBeCloseTo(s0, 3);
    w.step(2000); // t = 40
    const expected = s0 * Math.sqrt(1 + (w.t / (2 * s0 * s0)) ** 2);
    expect(Math.abs(w.width() - expected) / expected).toBeLessThan(0.005);
  });

  it('with no barrier everything is transmitted', () => {
    const w = runToEnd({ ...DEFAULT_PARAMS, barrierEv: 0 });
    expect(w.transmitted()).toBeGreaterThan(0.999);
  });

  it('measured transmission matches the packet-averaged formula within 2%', () => {
    const cases: TunnelParams[] = [
      DEFAULT_PARAMS, // E < V0: tunneling
      { energyEv: 5, barrierEv: 7, widthNm: 0.1, packetNm: 0.8 },
      { energyEv: 3, barrierEv: 5, widthNm: 0.15, packetNm: 1.0 },
      { energyEv: 9, barrierEv: 7, widthNm: 0.3, packetNm: 1.0 }, // E > V0: partial reflection
      { energyEv: 6, barrierEv: 4, widthNm: 0.5, packetNm: 1.2 },
    ];
    for (const c of cases) {
      const w = runToEnd(c);
      const { packet } = predictions(c);
      const T = w.transmitted();
      expect(Math.abs(T - packet)).toBeLessThan(0.02);
      expect(T + w.reflected()).toBeCloseTo(1, 3);
    }
  }, 60_000);
});

describe('tunneling: analytic formula', () => {
  it('limits and sanity', () => {
    expect(transmissionPlane(1, 0, 3)).toBe(1);
    expect(transmissionPlane(0.5, 1, 0)).toBe(1);
    // thicker barriers transmit exponentially less
    const t1 = transmissionPlane(0.5, 1, 2);
    const t2 = transmissionPlane(0.5, 1, 4);
    expect(t2).toBeLessThan(t1 * 0.2);
    // continuous across E = V0
    expect(transmissionPlane(1 - 1e-7, 1, 2)).toBeCloseTo(transmissionPlane(1, 1, 2), 5);
    expect(transmissionPlane(1 + 1e-7, 1, 2)).toBeCloseTo(transmissionPlane(1, 1, 2), 5);
    // resonance above the barrier: sin(k₂a) = 0 → T = 1
    const a = 3;
    const E = 1 + (Math.PI / a) ** 2 / 2;
    expect(transmissionPlane(E, 1, a)).toBeCloseTo(1, 12);
  });

  it('sanitizeParams snaps the width to whole grid cells', () => {
    const s = sanitizeParams({ ...DEFAULT_PARAMS, widthNm: 0.207 });
    expect(Math.abs(s.widthNm / 0.0125 - Math.round(s.widthNm / 0.0125))).toBeLessThan(1e-9);
  });
});
