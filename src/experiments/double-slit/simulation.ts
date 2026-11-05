/**
 * Double-slit simulation: photons are emitted one at a time; each one either passes the slits or
 * is absorbed by the barrier, and if it passes it lands at a random screen position drawn from the
 * Born-rule distribution of the current model (see physics/double-slit/fraunhofer.ts).
 */
import { createRng, type Rng } from '../../physics/core/rng';
import { buildSamplingTable, sampleTable, type SamplingTable } from '../../physics/core/sampling';
import {
  DEFAULT_PARAMS,
  SCREEN_HALF_WIDTH_MM,
  fresnelNumber,
  fringeSpacingMm,
  hasInterference,
  intensity,
  sanitizeParams,
  screenIntegral,
  visibleStripes,
  type DoubleSlitParams,
} from '../../physics/double-slit/fraunhofer';
import type { Simulation, Unsubscribe } from '../../engine/Simulation';

export const HISTOGRAM_BINS = 120;
export const MAX_ARRIVALS = 20000;
export const DEFAULT_RATE = 80; // photons per second when streaming
export const RATE_RANGE = { min: 5, max: 1000, step: 5 };

export type DoubleSlitEvent = 'arrival' | 'params' | 'cleared';

export interface DoubleSlitDerived {
  arrivals: number;
  emitted: number;
  spacingMm: number;
  stripes: number;
  interference: boolean;
  fresnel: number;
  streaming: boolean;
  rate: number;
  full: boolean;
}

export class DoubleSlitSimulation implements Simulation<
  DoubleSlitParams,
  DoubleSlitDerived,
  DoubleSlitEvent
> {
  params: DoubleSlitParams;
  /** y positions (mm) of every arrival since the last clear, in arrival order */
  readonly hits = new Float32Array(MAX_ARRIVALS);
  /** random 0..1 horizontal jitter for drawing each dot across the screen strip */
  readonly hitJitter = new Float32Array(MAX_ARRIVALS);
  /** time (performance.now ms) of the most recent arrivals, for the arrival flash */
  recent: { y: number; t: number }[] = [];
  readonly bins = new Uint32Array(HISTOGRAM_BINS);
  arrivals = 0;
  emitted = 0;
  streaming = false;
  rate = DEFAULT_RATE;
  version = 0;
  /** Increments on every clear, so renderers know to wipe their accumulated drawing */
  generation = 0;

  private rng: Rng;
  private table!: SamplingTable;
  private passProbability = 1;
  private acc = 0;
  private listeners = new Map<DoubleSlitEvent, Set<() => void>>();

  constructor(params: DoubleSlitParams = DEFAULT_PARAMS, seed = 20240601) {
    this.rng = createRng(seed);
    this.params = sanitizeParams(params);
    this.rebuild();
  }

  setParams(next: Partial<DoubleSlitParams>): void {
    const merged = sanitizeParams({ ...this.params, ...next });
    const changed = (Object.keys(merged) as (keyof DoubleSlitParams)[]).some(
      (k) => merged[k] !== this.params[k],
    );
    if (!changed) return;
    this.params = merged;
    this.rebuild();
    this.clear(); // a new configuration is a new experiment: start with a clean screen
    this.emit('params');
  }

  setStreaming(on: boolean): void {
    if (on && this.arrivals >= MAX_ARRIVALS) this.clear();
    this.streaming = on;
    this.acc = 0;
    this.version++;
  }

  setRate(rate: number): void {
    this.rate = Math.min(RATE_RANGE.max, Math.max(RATE_RANGE.min, rate));
    this.version++;
  }

  /** Emit `n` photons now. */
  fire(n = 1): void {
    let landed = false;
    for (let i = 0; i < n; i++) {
      if (this.arrivals >= MAX_ARRIVALS) {
        this.streaming = false;
        break;
      }
      this.emitted++;
      if (this.rng() >= this.passProbability) continue; // absorbed by the barrier
      const y = sampleTable(this.table, this.rng(), this.rng());
      const k = this.arrivals++;
      this.hits[k] = y;
      this.hitJitter[k] = this.rng();
      const bin = Math.min(
        HISTOGRAM_BINS - 1,
        Math.floor(((y + SCREEN_HALF_WIDTH_MM) / (2 * SCREEN_HALF_WIDTH_MM)) * HISTOGRAM_BINS),
      );
      this.bins[bin]++;
      this.recent.push({ y, t: performance.now() });
      landed = true;
    }
    if (this.recent.length > 60) this.recent.splice(0, this.recent.length - 60);
    this.version++;
    if (landed) this.emit('arrival');
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
    this.bins.fill(0);
    this.arrivals = 0;
    this.emitted = 0;
    this.recent = [];
    this.acc = 0;
    this.generation++;
    this.version++;
    this.emit('cleared');
  }

  reset(): void {
    this.params = sanitizeParams(DEFAULT_PARAMS);
    this.rebuild();
    this.streaming = false;
    this.rate = DEFAULT_RATE;
    this.clear();
    this.emit('params');
  }

  derived(): DoubleSlitDerived {
    const p = this.params;
    return {
      arrivals: this.arrivals,
      emitted: this.emitted,
      spacingMm: fringeSpacingMm(p),
      stripes: visibleStripes(p),
      interference: hasInterference(p),
      fresnel: fresnelNumber(p),
      streaming: this.streaming,
      rate: this.rate,
      full: this.arrivals >= MAX_ARRIVALS,
    };
  }

  /** Probability density (normalised to the both-slit peak) the renderer uses for the theory curve. */
  density(yMm: number): number {
    return intensity(yMm, this.params);
  }

  /** ∫ density dy over the screen; converts histogram counts to the same scale as `density`. */
  densityIntegral(): number {
    return this.table.total;
  }

  on(event: DoubleSlitEvent, fn: () => void): Unsubscribe {
    let set = this.listeners.get(event);
    if (!set) this.listeners.set(event, (set = new Set()));
    set.add(fn);
    return () => set!.delete(fn);
  }

  private emit(event: DoubleSlitEvent) {
    this.listeners.get(event)?.forEach((fn) => fn());
  }

  private rebuild() {
    const p = this.params;
    this.table = buildSamplingTable(
      (y) => intensity(y, p),
      -SCREEN_HALF_WIDTH_MM,
      SCREEN_HALF_WIDTH_MM,
      4096,
    );
    // Fraction of photons that get through, relative to both slits open (which defines "1").
    const reference = screenIntegral({ ...p, openSlits: 'both', detector: false }, 2000);
    this.passProbability = Math.min(1, screenIntegral(p, 2000) / reference);
    this.version++;
  }
}
