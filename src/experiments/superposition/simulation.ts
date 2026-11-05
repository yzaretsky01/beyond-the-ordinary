/**
 * Superposition simulation: single photons sent through the interferometer one at a time.
 * Each photon is detected whole at exactly one detector, chosen at random with the Born-rule
 * probabilities of physics/superposition/interferometer.ts.
 */
import { createRng, type Rng } from '../../physics/core/rng';
import {
  DEFAULT_PARAMS,
  detectorProbabilities,
  sanitizeParams,
  type SuperpositionParams,
} from '../../physics/superposition/interferometer';
import type { Simulation, Unsubscribe } from '../../engine/Simulation';

export const DEFAULT_RATE = 20;
export const RATE_RANGE = { min: 1, max: 200, step: 1 };
export const MAX_PHOTONS = 100000;

export type SuperpositionEvent = 'detect' | 'params' | 'cleared';

export interface SuperpositionDerived {
  d1: number;
  d2: number;
  total: number;
  /** model probabilities */
  pD1: number;
  pD2: number;
  streaming: boolean;
  rate: number;
}

export class SuperpositionSimulation implements Simulation<
  SuperpositionParams,
  SuperpositionDerived,
  SuperpositionEvent
> {
  params: SuperpositionParams;
  d1 = 0;
  d2 = 0;
  streaming = false;
  rate = DEFAULT_RATE;
  version = 0;
  /** most recent detections for the detector flash: which detector and when (performance.now) */
  recent: { det: 1 | 2; t: number }[] = [];
  private rng: Rng;
  private acc = 0;
  private listeners = new Map<SuperpositionEvent, Set<() => void>>();

  constructor(params: SuperpositionParams = DEFAULT_PARAMS, seed = 1801) {
    this.params = sanitizeParams(params);
    this.rng = createRng(seed);
  }

  setParams(next: Partial<SuperpositionParams>): void {
    const merged = sanitizeParams({ ...this.params, ...next });
    if (
      merged.thetaDeg === this.params.thetaDeg &&
      merged.phiDeg === this.params.phiDeg &&
      merged.secondSplitter === this.params.secondSplitter
    )
      return;
    this.params = merged;
    this.clear(); // new settings, new experiment
    this.emit('params');
  }

  setStreaming(on: boolean) {
    this.streaming = on;
    this.acc = 0;
    this.version++;
  }

  setRate(r: number) {
    this.rate = Math.min(RATE_RANGE.max, Math.max(RATE_RANGE.min, r));
    this.version++;
  }

  fire(n = 1): void {
    const { d1: p1 } = detectorProbabilities(this.params);
    const now = performance.now();
    for (let i = 0; i < n; i++) {
      if (this.d1 + this.d2 >= MAX_PHOTONS) {
        this.streaming = false;
        break;
      }
      const det = this.rng() < p1 ? 1 : 2;
      if (det === 1) this.d1++;
      else this.d2++;
      this.recent.push({ det, t: now });
    }
    if (this.recent.length > 30) this.recent.splice(0, this.recent.length - 30);
    this.version++;
    this.emit('detect');
  }

  step(dt: number): void {
    if (!this.streaming) return;
    this.acc += dt * this.rate;
    const n = Math.floor(this.acc);
    if (n > 0) {
      this.acc -= n;
      this.fire(n);
    }
  }

  clear(): void {
    this.d1 = 0;
    this.d2 = 0;
    this.recent = [];
    this.acc = 0;
    this.version++;
    this.emit('cleared');
  }

  reset(): void {
    this.params = sanitizeParams(DEFAULT_PARAMS);
    this.streaming = false;
    this.rate = DEFAULT_RATE;
    this.clear();
    this.emit('params');
  }

  derived(): SuperpositionDerived {
    const p = detectorProbabilities(this.params);
    return {
      d1: this.d1,
      d2: this.d2,
      total: this.d1 + this.d2,
      pD1: p.d1,
      pD2: p.d2,
      streaming: this.streaming,
      rate: this.rate,
    };
  }

  on(event: SuperpositionEvent, fn: () => void): Unsubscribe {
    let set = this.listeners.get(event);
    if (!set) this.listeners.set(event, (set = new Set()));
    set.add(fn);
    return () => set!.delete(fn);
  }

  private emit(e: SuperpositionEvent) {
    this.listeners.get(e)?.forEach((fn) => fn());
  }
}
