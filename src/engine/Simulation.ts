/**
 * The contract every experiment's simulation follows. Simulations are plain TypeScript objects:
 * the frame loop calls `step`, renderers read `snapshot`-style fields directly, and React only
 * reads the small, slow-changing `derived()` summary.
 */
export type Unsubscribe = () => void;

export interface Simulation<P, D, E extends string = string> {
  readonly params: Readonly<P>;
  setParams(next: Partial<P>): void;
  step(dt: number): void;
  reset(): void;
  derived(): D;
  /** Increments whenever anything visible changes; lets React subscribe cheaply. */
  readonly version: number;
  on(event: E, fn: () => void): Unsubscribe;
}
