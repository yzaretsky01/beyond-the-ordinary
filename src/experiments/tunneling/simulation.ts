/**
 * Tunneling simulation: launches a wave packet at the barrier and advances the Schrödinger
 * equation in real time (slowed down enormously: 1 s on screen ≈ 2 fs of electron time).
 */
import {
  DEFAULT_PARAMS,
  DT,
  TIME_UNIT_FS,
  Wave1D,
  predictions,
  sanitizeParams,
  type TunnelParams,
} from '../../physics/tunneling/schrodinger1d';
import type { Simulation, Unsubscribe } from '../../engine/Simulation';

/** simulated time units per real second */
export const PLAYBACK = 25;

export interface TunnelDerived {
  transmitted: number;
  reflected: number;
  plane: number;
  packet: number;
  timeFs: number;
  running: boolean;
  done: boolean;
  launched: boolean;
  /** what a classical ball with the same energy would do */
  classical: 'passes' | 'bounces';
}

export class TunnelingSimulation implements Simulation<
  TunnelParams,
  TunnelDerived,
  'params' | 'done' | 'launch'
> {
  params: TunnelParams;
  wave: Wave1D;
  running = false;
  done = false;
  launched = false;
  version = 0;
  private pred: { plane: number; packet: number };
  private listeners = new Map<string, Set<() => void>>();

  constructor(params: TunnelParams = DEFAULT_PARAMS) {
    this.params = sanitizeParams(params);
    this.wave = new Wave1D(this.params);
    this.pred = predictions(this.params);
  }

  setParams(next: Partial<TunnelParams>): void {
    const merged = sanitizeParams({ ...this.params, ...next });
    const p = this.params;
    if (
      merged.energyEv === p.energyEv &&
      merged.barrierEv === p.barrierEv &&
      merged.widthNm === p.widthNm &&
      merged.packetNm === p.packetNm
    )
      return;
    this.params = merged;
    this.pred = predictions(merged);
    this.rewind();
    this.emit('params');
  }

  /** Put a fresh packet at the start without running it. */
  rewind(): void {
    this.wave = new Wave1D(this.params);
    this.running = false;
    this.done = false;
    this.launched = false;
    this.version++;
  }

  /** Start (or restart) a run. */
  launch(): void {
    this.rewind();
    this.running = true;
    this.launched = true;
    this.emit('launch');
  }

  setRunning(on: boolean): void {
    if (this.done) return;
    this.running = on;
    if (on) this.launched = true;
    this.version++;
  }

  step(dt: number): void {
    if (!this.running) return;
    const steps = Math.max(1, Math.min(60, Math.round((PLAYBACK * dt) / DT)));
    this.wave.step(steps);
    this.version++;
    if (this.wave.collisionOver()) {
      this.running = false;
      this.done = true;
      this.emit('done');
    }
  }

  reset(): void {
    this.params = sanitizeParams(DEFAULT_PARAMS);
    this.pred = predictions(this.params);
    this.rewind();
    this.emit('params');
  }

  derived(): TunnelDerived {
    return {
      transmitted: this.wave.transmitted(),
      reflected: this.wave.reflected(),
      plane: this.pred.plane,
      packet: this.pred.packet,
      timeFs: this.wave.t * TIME_UNIT_FS,
      running: this.running,
      done: this.done,
      launched: this.launched,
      classical: this.params.energyEv > this.params.barrierEv ? 'passes' : 'bounces',
    };
  }

  /** Position of a classical ball with the same energy, starting at the packet centre. */
  classicalX(): number {
    const w = this.wave;
    const { left, right, height } = w.barrier;
    const tHit = (left - w.x0) / w.k0; // speed v = k in ħ = m = 1 units
    if (w.t <= tHit) return w.x0 + w.k0 * w.t;
    if (this.params.energyEv <= this.params.barrierEv) return left - w.k0 * (w.t - tHit); // bounces back
    // over the wall the ball keeps only E − V₀ of kinetic energy, so it slows to √(k₀² − 2V₀)
    const vIn = Math.sqrt(Math.max(1e-9, w.k0 * w.k0 - 2 * height));
    const tOut = tHit + (right - left) / vIn;
    if (w.t <= tOut) return left + vIn * (w.t - tHit);
    return right + w.k0 * (w.t - tOut);
  }

  on(event: 'params' | 'done' | 'launch', fn: () => void): Unsubscribe {
    let set = this.listeners.get(event);
    if (!set) this.listeners.set(event, (set = new Set()));
    set.add(fn);
    return () => set!.delete(fn);
  }

  private emit(e: string) {
    this.listeners.get(e)?.forEach((fn) => fn());
  }
}
