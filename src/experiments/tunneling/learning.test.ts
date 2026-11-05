import { describe, expect, it } from 'vitest';
import { DEFAULT_PARAMS, predictions, type TunnelParams } from '../../physics/tunneling/schrodinger1d';
import { challengeDone, describe as describeState, unlockedDiscoveries } from './learning';
import type { TunnelDerived } from './simulation';

function d(
  p: TunnelParams,
  over: Partial<TunnelDerived> = {},
): { params: TunnelParams; derived: TunnelDerived } {
  const pr = predictions(p);
  return {
    params: p,
    derived: {
      transmitted: pr.packet,
      reflected: 1 - pr.packet,
      plane: pr.plane,
      packet: pr.packet,
      timeFs: 10,
      running: false,
      done: true,
      launched: true,
      classical: p.energyEv > p.barrierEv ? 'passes' : 'bounces',
      ...over,
    },
  };
}

describe('tunneling discoveries', () => {
  it('nothing until a run has finished', () => {
    expect(unlockedDiscoveries(d(DEFAULT_PARAMS, { done: false }))).toEqual([]);
  });
  it('defaults tunnel and split', () => {
    expect(unlockedDiscoveries(d(DEFAULT_PARAMS))).toEqual(expect.arrayContaining(['through', 'split']));
  });
  it('thin walls, reflection above the wall, transparency', () => {
    expect(unlockedDiscoveries(d({ ...DEFAULT_PARAMS, widthNm: 0.1 }))).toContain('thin');
    expect(unlockedDiscoveries(d({ ...DEFAULT_PARAMS, energyEv: 8 }))).toContain('bounce-above');
    expect(
      unlockedDiscoveries(d({ ...DEFAULT_PARAMS, energyEv: 12 }, { transmitted: 0.97, reflected: 0.03 })),
    ).toContain('transparent');
  });
});

describe('tunneling challenges', () => {
  it('half through a taller wall', () => {
    // E = 5, V0 = 6, thin wall: tune width to reach ~50%
    expect(challengeDone('half', d({ ...DEFAULT_PARAMS, barrierEv: 6, widthNm: 0.1 }))).toBe(
      Math.abs(predictions({ ...DEFAULT_PARAMS, barrierEv: 6, widthNm: 0.1 }).packet - 0.5) <= 0.05,
    );
  });
  it('block 99.9% within 0.5 nm', () => {
    expect(challengeDone('block', d({ energyEv: 1, barrierEv: 20, widthNm: 0.5, packetNm: 1.5 }))).toBe(true);
    expect(challengeDone('block', d(DEFAULT_PARAMS))).toBe(false);
  });
  it('transparent above the wall (resonance)', () => {
    // resonance: E − V0 = (π/a)²/2 in solver units; for a = 0.3 nm, V0 = 7 eV → E ≈ 11.2 eV
    expect(
      challengeDone('transparent', d({ energyEv: 11.2, barrierEv: 7, widthNm: 0.3, packetNm: 0.8 })),
    ).toBe(true);
    expect(challengeDone('transparent', d(DEFAULT_PARAMS))).toBe(false);
  });
});

describe('tunneling description', () => {
  it('says what is happening', () => {
    expect(describeState(d(DEFAULT_PARAMS, { launched: false, done: false }))).toMatch(/not been launched/);
    expect(describeState(d(DEFAULT_PARAMS))).toMatch(/Finished: .* got through/);
  });
});
