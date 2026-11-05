/**
 * Discoveries, challenges and the screen-reader description: pure functions of the parameters
 * and the simulation's derived values, so they can be unit-tested without rendering anything.
 */
import { DEFAULT_PARAMS, type DoubleSlitParams } from '../../physics/double-slit/fraunhofer';
import type { ChallengeId, DiscoveryId } from './content';
import type { DoubleSlitDerived } from './simulation';

export interface LearningContext {
  params: DoubleSlitParams;
  derived: DoubleSlitDerived;
}

/** Discoveries unlocked by the current state. Arrival counts reset with every change of settings. */
export function unlockedDiscoveries(ctx: LearningContext): DiscoveryId[] {
  const { params: p, derived: d } = ctx;
  const out: DiscoveryId[] = [];
  if (d.arrivals >= 1) out.push('one-dot');
  if (d.interference && d.arrivals >= 400) out.push('stripes');
  if (p.detector && p.openSlits === 'both' && d.arrivals >= 300) out.push('which-path');
  if (p.openSlits !== 'both' && d.arrivals >= 300) out.push('one-slit');
  if (d.interference && Math.abs(p.wavelengthNm - DEFAULT_PARAMS.wavelengthNm) >= 100 && d.arrivals >= 200)
    out.push('colour');
  return out;
}

export interface ChallengeBaseline {
  /** Stripe spacing (mm) when the visitor started experimenting */
  startSpacingMm: number;
}

export function challengeDone(id: ChallengeId, ctx: LearningContext, base: ChallengeBaseline): boolean {
  const { params: p, derived: d } = ctx;
  switch (id) {
    case 'double': {
      const r = d.spacingMm / base.startSpacingMm;
      return d.interference && r >= 1.9 && r <= 2.1;
    }
    case 'five':
      return d.interference && d.stripes === 5;
    case 'erase':
      return p.openSlits === 'both' && p.detector;
  }
}

const fmt = (n: number, digits = 1) =>
  n.toLocaleString('en-GB', { maximumFractionDigits: digits, minimumFractionDigits: digits });

/** What a sighted visitor sees, in words. */
export function describe(ctx: LearningContext): string {
  const { params: p, derived: d } = ctx;
  const setup = `${p.wavelengthNm} nanometre light, slits ${fmt(p.separationMm, 2)} millimetres apart, screen ${fmt(p.screenDistanceM, 2)} metres away.`;
  const slits =
    p.openSlits === 'both' ? '' : ` Only the ${p.openSlits === 'upper' ? 'top' : 'bottom'} slit is open.`;
  const det = p.detector ? ' The which-slit detector is on.' : '';
  if (d.arrivals === 0) return `${setup}${slits}${det} No photons have landed yet.`;
  const count = `${d.arrivals.toLocaleString('en-GB')} photon${d.arrivals === 1 ? ' has' : 's have'} landed.`;
  let pattern: string;
  if (d.arrivals < 150) pattern = 'So far the dots look scattered.';
  else if (d.interference)
    pattern = `They form ${d.stripes} bright stripes about ${fmt(d.spacingMm)} millimetres apart.`;
  else if (p.detector)
    pattern = 'They form one broad band with no stripes, because the detector records each photon’s path.';
  else pattern = 'They form one broad band with no stripes.';
  return `${setup}${slits}${det} ${count} ${pattern}`;
}

/** Number of bright bands in a prediction profile (peaks above 35% of the maximum). */
export function countPredictedBands(profile: number[]): number {
  const max = Math.max(...profile);
  if (max <= 0) return 0;
  let n = 0;
  let inBand = false;
  for (const v of profile) {
    const high = v >= 0.35 * max;
    if (high && !inBand) n++;
    inBand = high;
  }
  return n;
}

/** Turn a choice into a profile so all predictions can be drawn the same way. n = number of bins, top to bottom order = low y to high y. */
export function choiceToProfile(choice: string, n: number): number[] {
  const g = (x: number, c: number, s: number) => Math.exp(-(((x - c) / s) ** 2));
  return Array.from({ length: n }, (_, i) => {
    const x = (i + 0.5) / n - 0.5; // −0.5 … 0.5
    if (choice === 'one') return g(x, 0, 0.12);
    if (choice === 'two') return g(x, -0.08, 0.04) + g(x, 0.08, 0.04);
    return Math.cos(Math.PI * x * 9) ** 2 * g(x, 0, 0.3);
  });
}
