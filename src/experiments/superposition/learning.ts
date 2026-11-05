/** Discoveries, challenges and screen-reader text for the superposition room: pure functions. */
import type { SuperpositionParams } from '../../physics/superposition/interferometer';
import type { ChallengeId, DiscoveryId } from './content';
import type { SuperpositionDerived } from './simulation';

export interface LearningContext {
  params: SuperpositionParams;
  derived: SuperpositionDerived;
  /** Has the visitor turned the phase while the second splitter was out? */
  phaseTurnedWhileOut: boolean;
}

export function unlockedDiscoveries(ctx: LearningContext): DiscoveryId[] {
  const { params: p, derived: d } = ctx;
  const out: DiscoveryId[] = [];
  if (d.total >= 1) out.push('whole');
  if (p.secondSplitter && d.total >= 50 && (d.pD1 > 0.995 || d.pD2 > 0.995)) {
    out.push(d.pD1 > 0.995 ? 'certain' : 'flip');
    if (d.pD2 > 0.995) out.push('certain');
  }
  if (!p.secondSplitter && Math.abs(p.thetaDeg - 90) <= 5 && d.total >= 100) out.push('coin');
  if (!p.secondSplitter && ctx.phaseTurnedWhileOut && d.total >= 50) out.push('blind');
  return [...new Set(out)];
}

export function challengeDone(id: ChallengeId, ctx: LearningContext): boolean {
  const { params: p, derived: d } = ctx;
  switch (id) {
    case 'all-d2':
      return d.pD2 > 0.99;
    case 'balance':
      return p.secondSplitter && Math.abs(d.pD1 - 0.5) <= 0.02;
    case 'three-quarters':
      return !p.secondSplitter && Math.abs(d.pD1 - 0.75) <= 0.02;
  }
}

const pct = (x: number) => `${Math.round(x * 100)} percent`;

export function describe(ctx: LearningContext): string {
  const { params: p, derived: d } = ctx;
  const setup = `First splitter sends ${pct(Math.cos((p.thetaDeg * Math.PI) / 360) ** 2)} of the amplitude squared to the upper path. Phase shift ${p.phiDeg} degrees. Second splitter ${p.secondSplitter ? 'in place' : 'removed'}.`;
  const model = `The model predicts ${pct(d.pD1)} of photons at detector 1.`;
  if (d.total === 0) return `${setup} ${model} No photons fired yet.`;
  return `${setup} ${model} So far ${d.d1} photons reached detector 1 and ${d.d2} reached detector 2.`;
}
