import { describe, expect, it } from 'vitest';
import { DEFAULT_PARAMS } from '../../physics/tunneling/schrodinger1d';
import { TunnelingSimulation } from './simulation';

function runToDone(s: TunnelingSimulation) {
  s.launch();
  for (let i = 0; i < 2000 && !s.done; i++) s.step(0.05);
}

describe('TunnelingSimulation', () => {
  it('starts with a packet waiting at the start', () => {
    const s = new TunnelingSimulation();
    const d = s.derived();
    expect(d).toMatchObject({ running: false, done: false, launched: false, classical: 'bounces' });
    expect(d.transmitted).toBeLessThan(1e-6);
  });

  it('a run finishes on its own and matches the packet-averaged prediction', () => {
    const s = new TunnelingSimulation();
    runToDone(s);
    const d = s.derived();
    expect(d.done).toBe(true);
    expect(Math.abs(d.transmitted - d.packet)).toBeLessThan(0.02);
    expect(d.transmitted).toBeGreaterThan(0.05); // the default setup visibly tunnels
  }, 30_000);

  it('every control changes the predictions and rewinds the packet', () => {
    const s = new TunnelingSimulation();
    for (const change of [{ energyEv: 6 }, { barrierEv: 8 }, { widthNm: 0.3 }, { packetNm: 1.2 }]) {
      s.launch();
      s.step(0.2);
      const before = s.derived().packet;
      s.setParams(change);
      expect(s.derived()).toMatchObject({ running: false, launched: false });
      expect(s.derived().packet).not.toBeCloseTo(before, 6);
    }
  });

  it('pause and resume; reset restores defaults', () => {
    const s = new TunnelingSimulation();
    s.launch();
    s.step(0.1);
    s.setRunning(false);
    const t = s.derived().timeFs;
    s.step(0.1);
    expect(s.derived().timeFs).toBe(t);
    s.setParams({ energyEv: 10 });
    s.reset();
    expect(s.params).toEqual(DEFAULT_PARAMS);
  });

  it('the classical ball bounces when the energy is below the barrier, passes when above', () => {
    const s = new TunnelingSimulation();
    s.launch();
    for (let i = 0; i < 200; i++) s.step(0.05);
    expect(s.classicalX()).toBeLessThan(0);
    const t = new TunnelingSimulation({ ...DEFAULT_PARAMS, energyEv: 9 });
    t.launch();
    for (let i = 0; i < 200; i++) t.step(0.05);
    expect(t.classicalX()).toBeGreaterThan(0);
  });
});
