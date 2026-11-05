/**
 * Entanglement simulation: photon pairs sent to Alice and Bob. In "explore" mode both always use
 * angles a and b. In "bell" mode each side picks one of two settings at random for every pair
 * (Alice: a or a+45°, Bob: b or b+45°), as real Bell tests do, and the CHSH value S is estimated.
 */
import { createRng, type Rng } from '../../physics/core/rng';
import {
  chshFromE,
  chshSettings,
  chshTheory,
  pSame,
  samplePair,
  type Outcome,
  type Source,
} from '../../physics/entanglement/bell';
import type { Simulation, Unsubscribe } from '../../engine/Simulation';

export type Mode = 'explore' | 'bell';

export interface EntanglementParams {
  aDeg: number;
  bDeg: number;
  source: Source;
  mode: Mode;
}

export const DEFAULT_PARAMS: EntanglementParams = { aDeg: 0, bDeg: 0, source: 'quantum', mode: 'explore' };
export const ANGLE_RANGE = { min: 0, max: 179, step: 1 };
export const RATE_RANGE = { min: 1, max: 300, step: 1 };
export const DEFAULT_RATE = 25;
/** how long a photon takes to fly from source to polariser on screen, s (illustrative) */
export const FLIGHT_S = 0.7;

export interface Pair {
  t0: number;
  a: Outcome;
  b: Outcome;
  aSet: number;
  bSet: number;
  lambdaDeg?: number;
}

export interface EntanglementDerived {
  pairs: number;
  matchRate: number;
  matchSE: number;
  alicePlus: number;
  bobPlus: number;
  pSameTheory: number;
  S: number;
  SSE: number;
  STheory: number;
  bellCounts: number[];
  streaming: boolean;
  rate: number;
}

const sanitizeAngle = (v: number) => ((Math.round(v) % 180) + 180) % 180;

export class EntanglementSimulation implements Simulation<
  EntanglementParams,
  EntanglementDerived,
  'pair' | 'params' | 'cleared'
> {
  params: EntanglementParams;
  version = 0;
  streaming = false;
  rate = DEFAULT_RATE;
  /** pairs still drawn on screen */
  inFlight: Pair[] = [];
  /** last outcomes for the result tapes */
  recent: Pair[] = [];
  private n = 0;
  private same = 0;
  private aPlus = 0;
  private bPlus = 0;
  /** bell mode: per (i, j) count and sum of a·b */
  private bn = [
    [0, 0],
    [0, 0],
  ];
  private bsum = [
    [0, 0],
    [0, 0],
  ];
  private rng: Rng;
  private acc = 0;
  private clock = 0;
  private listeners = new Map<string, Set<() => void>>();

  constructor(params: EntanglementParams = DEFAULT_PARAMS, seed = 1964) {
    this.params = { ...params, aDeg: sanitizeAngle(params.aDeg), bDeg: sanitizeAngle(params.bDeg) };
    this.rng = createRng(seed);
  }

  setParams(next: Partial<EntanglementParams>): void {
    const merged = { ...this.params, ...next };
    merged.aDeg = sanitizeAngle(merged.aDeg);
    merged.bDeg = sanitizeAngle(merged.bDeg);
    const p = this.params;
    if (
      merged.aDeg === p.aDeg &&
      merged.bDeg === p.bDeg &&
      merged.source === p.source &&
      merged.mode === p.mode
    )
      return;
    this.params = merged;
    this.clear();
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

  fire(count = 1): void {
    const p = this.params;
    const { a: aS, b: bS } = chshSettings(p.aDeg, p.bDeg);
    for (let k = 0; k < count; k++) {
      let i = 0;
      let j = 0;
      if (p.mode === 'bell') {
        i = this.rng() < 0.5 ? 0 : 1;
        j = this.rng() < 0.5 ? 0 : 1;
      }
      const aSet = aS[i];
      const bSet = bS[j];
      const r = samplePair(p.source, aSet, bSet, this.rng);
      this.n++;
      if (r.a === r.b) this.same++;
      if (r.a === 1) this.aPlus++;
      if (r.b === 1) this.bPlus++;
      this.bn[i][j]++;
      this.bsum[i][j] += r.a * r.b;
      const pair: Pair = { t0: this.clock, a: r.a, b: r.b, aSet, bSet, lambdaDeg: r.lambdaDeg };
      this.inFlight.push(pair);
      this.recent.push(pair);
    }
    if (this.inFlight.length > 40) this.inFlight.splice(0, this.inFlight.length - 40);
    if (this.recent.length > 40) this.recent.splice(0, this.recent.length - 40);
    this.version++;
    this.emit('pair');
  }

  step(dt: number): void {
    this.clock += dt;
    this.inFlight = this.inFlight.filter((q) => this.clock - q.t0 < FLIGHT_S + 0.5);
    if (!this.streaming) return;
    this.acc += dt * this.rate;
    const k = Math.floor(this.acc);
    if (k > 0) {
      this.acc -= k;
      this.fire(k);
    }
  }

  /** Current animation clock (s), for renderers */
  get time(): number {
    return this.clock;
  }

  clear(): void {
    this.n = this.same = this.aPlus = this.bPlus = 0;
    this.bn = [
      [0, 0],
      [0, 0],
    ];
    this.bsum = [
      [0, 0],
      [0, 0],
    ];
    this.inFlight = [];
    this.recent = [];
    this.acc = 0;
    this.version++;
    this.emit('cleared');
  }

  reset(): void {
    this.params = { ...DEFAULT_PARAMS };
    this.streaming = false;
    this.rate = DEFAULT_RATE;
    this.clear();
    this.emit('params');
  }

  derived(): EntanglementDerived {
    const p = this.params;
    const m = this.n ? this.same / this.n : 0;
    const E = this.bn.map((row, i) => row.map((c, j) => (c ? this.bsum[i][j] / c : 0)));
    // standard error of each E ≈ √((1 − E²)/n); errors add in quadrature
    let v = 0;
    for (let i = 0; i < 2; i++)
      for (let j = 0; j < 2; j++) v += this.bn[i][j] ? Math.max(1e-9, 1 - E[i][j] ** 2) / this.bn[i][j] : 1;
    return {
      pairs: this.n,
      matchRate: m,
      matchSE: this.n ? Math.sqrt(Math.max(m * (1 - m), 1e-9) / this.n) : 0,
      alicePlus: this.n ? this.aPlus / this.n : 0,
      bobPlus: this.n ? this.bPlus / this.n : 0,
      pSameTheory: pSame(p.source, p.aDeg, p.bDeg),
      S: chshFromE(E),
      SSE: Math.sqrt(v),
      STheory: chshTheory(p.source, p.aDeg, p.bDeg),
      bellCounts: this.bn.flat(),
      streaming: this.streaming,
      rate: this.rate,
    };
  }

  on(event: 'pair' | 'params' | 'cleared', fn: () => void): Unsubscribe {
    let set = this.listeners.get(event);
    if (!set) this.listeners.set(event, (set = new Set()));
    set.add(fn);
    return () => set!.delete(fn);
  }

  private emit(e: string) {
    this.listeners.get(e)?.forEach((fn) => fn());
  }
}
