/** Discoveries, challenges and screen-reader text for the entanglement room: pure functions. */
import { foldDelta } from '../../physics/entanglement/bell';
import type { ChallengeId, DiscoveryId } from './content';
import type { EntanglementDerived, EntanglementParams } from './simulation';

export interface LearningContext {
  params: EntanglementParams;
  derived: EntanglementDerived;
  /** Bob changed his angle since the last clear-free run of statistics */
  bobTurned: boolean;
}

export function unlockedDiscoveries(ctx: LearningContext): DiscoveryId[] {
  const { params: p, derived: d } = ctx;
  const out: DiscoveryId[] = [];
  const delta = foldDelta(p.aDeg - p.bDeg);
  if (d.pairs >= 20) out.push('coin');
  if (p.source === 'quantum' && p.mode === 'explore' && delta <= 2 && d.pairs >= 30) out.push('twins');
  if (p.source === 'quantum' && p.mode === 'explore' && delta >= 88 && d.pairs >= 30) out.push('opposites');
  if (ctx.bobTurned && d.pairs >= 200 && Math.abs(d.alicePlus - 0.5) < 0.1) out.push('no-signal');
  if (p.source === 'quantum' && p.mode === 'bell' && d.pairs >= 200 && d.S - 2 > 2 * d.SSE) out.push('beat');
  return out;
}

export function challengeDone(id: ChallengeId, ctx: LearningContext): boolean {
  const { params: p, derived: d } = ctx;
  switch (id) {
    case 'three-in-four':
      return p.source === 'quantum' && p.mode === 'explore' && Math.abs(d.pSameTheory - 0.75) <= 0.02;
    case 'hidden-best':
      return p.source === 'hidden' && p.mode === 'bell' && Math.abs(d.STheory) >= 1.95;
    case 'violate':
      return p.source === 'quantum' && p.mode === 'bell' && d.pairs >= 200 && d.S > 2.5;
  }
}

const pct = (x: number) => `${Math.round(x * 100)} percent`;

export function describe(ctx: LearningContext): string {
  const { params: p, derived: d } = ctx;
  const src = p.source === 'quantum' ? 'Entangled pairs' : 'Hidden-instruction pairs';
  const setup = `${src}. Alice’s polariser at ${p.aDeg} degrees, Bob’s at ${p.bDeg} degrees.`;
  if (d.pairs === 0) return `${setup} No pairs fired yet.`;
  if (p.mode === 'bell')
    return `${setup} Bell test with ${d.pairs} pairs: S equals ${d.S.toFixed(2)}, plus or minus ${d.SSE.toFixed(2)}. The classical limit is 2.`;
  return `${setup} ${d.pairs} pairs: results matched ${pct(d.matchRate)} of the time; the model predicts ${pct(d.pSameTheory)}. Alice saw plus ${pct(d.alicePlus)} of the time.`;
}
