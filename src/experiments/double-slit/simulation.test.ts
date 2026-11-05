import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_PARAMS, SCREEN_HALF_WIDTH_MM } from '../../physics/double-slit/fraunhofer';
import { DoubleSlitSimulation, HISTOGRAM_BINS, MAX_ARRIVALS } from './simulation';

describe('DoubleSlitSimulation', () => {
  it('starts with sensible defaults and an empty screen', () => {
    const s = new DoubleSlitSimulation();
    expect(s.params).toEqual(DEFAULT_PARAMS);
    expect(s.derived()).toMatchObject({ arrivals: 0, stripes: 9, interference: true, streaming: false });
  });

  it('fire() lands photons on the screen inside its bounds', () => {
    const s = new DoubleSlitSimulation();
    s.fire(500);
    expect(s.arrivals).toBe(500); // both slits: every photon in the model passes
    for (let i = 0; i < s.arrivals; i++)
      expect(Math.abs(s.hits[i])).toBeLessThanOrEqual(SCREEN_HALF_WIDTH_MM);
    expect(s.bins.reduce((a, b) => a + b, 0)).toBe(500);
  });

  it('closing a slit means about half the photons are absorbed', () => {
    const s = new DoubleSlitSimulation();
    s.setParams({ openSlits: 'upper' });
    s.fire(10000);
    expect(s.arrivals / s.emitted).toBeGreaterThan(0.47);
    expect(s.arrivals / s.emitted).toBeLessThan(0.53);
  });

  it('every parameter change rebuilds the model and clears the screen', () => {
    const s = new DoubleSlitSimulation();
    const keys = [
      { wavelengthNm: 650 },
      { separationMm: 0.3 },
      { slitWidthMm: 0.05 },
      { screenDistanceM: 2 },
      { openSlits: 'lower' as const },
      { detector: true },
    ];
    for (const change of keys) {
      s.fire(50);
      const before = s.derived();
      s.setParams(change);
      expect(s.arrivals).toBe(0);
      expect(s.params).toMatchObject(change);
      // the change must reach the physics: some derived quantity differs
      const after = s.derived();
      const sameShape =
        before.spacingMm === after.spacingMm &&
        before.stripes === after.stripes &&
        before.interference === after.interference;
      const sameDensity =
        Math.abs(s.density(1.3) - new DoubleSlitSimulation({ ...s.params, ...DEFAULT_PARAMS }).density(1.3)) <
        1e-12;
      expect(sameShape && sameDensity).toBe(false);
    }
  });

  it('the histogram converges to the model distribution', () => {
    const s = new DoubleSlitSimulation();
    s.fire(MAX_ARRIVALS);
    const binW = (2 * SCREEN_HALF_WIDTH_MM) / HISTOGRAM_BINS;
    const centre = HISTOGRAM_BINS / 2; // bin just above y = 0 (bright)
    const measured = s.bins[centre] / (s.arrivals * binW);
    const expected = s.density(binW / 2) / s.densityIntegral();
    expect(Math.abs(measured - expected) / expected).toBeLessThan(0.12);
  });

  it('streaming emits at the chosen rate and stops when the screen is full', () => {
    const s = new DoubleSlitSimulation();
    s.setRate(100);
    s.setStreaming(true);
    for (let i = 0; i < 10; i++) s.step(0.1);
    expect(s.emitted).toBe(100);
    s.setRate(1000);
    for (let i = 0; i < 400; i++) s.step(0.05);
    expect(s.arrivals).toBe(MAX_ARRIVALS);
    expect(s.streaming).toBe(false);
  });

  it('reset restores defaults and clears everything', () => {
    const s = new DoubleSlitSimulation();
    s.setParams({ wavelengthNm: 450, detector: true });
    s.setStreaming(true);
    s.fire(10);
    s.reset();
    expect(s.params).toEqual(DEFAULT_PARAMS);
    expect(s.derived()).toMatchObject({ arrivals: 0, streaming: false });
  });

  it('notifies listeners', () => {
    const s = new DoubleSlitSimulation();
    const onArrival = vi.fn();
    const onParams = vi.fn();
    s.on('arrival', onArrival);
    s.on('params', onParams);
    s.fire(1);
    s.setParams({ wavelengthNm: 600 });
    expect(onArrival).toHaveBeenCalled();
    expect(onParams).toHaveBeenCalledTimes(1);
  });

  it('is reproducible for a fixed seed', () => {
    const a = new DoubleSlitSimulation(DEFAULT_PARAMS, 7);
    const b = new DoubleSlitSimulation(DEFAULT_PARAMS, 7);
    a.fire(100);
    b.fire(100);
    expect(Array.from(a.hits.slice(0, 100))).toEqual(Array.from(b.hits.slice(0, 100)));
  });
});
