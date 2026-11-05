/** Discoveries, challenges and screen-reader text for the tunneling room: pure functions. */
import type { TunnelParams } from '../../physics/tunneling/schrodinger1d';
import type { ChallengeId, DiscoveryId } from './content';
import type { TunnelDerived } from './simulation';

export interface LearningContext {
  params: TunnelParams;
  derived: TunnelDerived;
}

export function unlockedDiscoveries({ params: p, derived: d }: LearningContext): DiscoveryId[] {
  const out: DiscoveryId[] = [];
  if (!d.done) return out;
  const below = p.energyEv < p.barrierEv;
  if (below && d.transmitted > 0.01) out.push('through');
  if (d.transmitted > 0.05 && d.reflected > 0.05) out.push('split');
  if (below && p.widthNm <= 0.15 && d.transmitted > 0.3) out.push('thin');
  if (!below && p.barrierEv > 0 && d.reflected > 0.02) out.push('bounce-above');
  if (!below && p.barrierEv > 0 && d.transmitted > 0.95) out.push('transparent');
  return out;
}

export function challengeDone(id: ChallengeId, { params: p, derived: d }: LearningContext): boolean {
  switch (id) {
    case 'half':
      return p.energyEv < p.barrierEv && Math.abs(d.packet - 0.5) <= 0.05;
    case 'block':
      return p.widthNm <= 0.5 + 1e-9 && d.packet < 0.001;
    case 'transparent':
      return p.energyEv > p.barrierEv && p.barrierEv > 0 && d.plane >= 0.99;
  }
}

const pct = (x: number) => `${(x * 100).toFixed(1)} percent`;

export function describe({ params: p, derived: d }: LearningContext): string {
  const setup = `Electron energy ${p.energyEv.toFixed(1)} electronvolts, wall ${p.barrierEv.toFixed(1)} electronvolts high and ${p.widthNm.toFixed(3)} nanometres thick.`;
  const model = `The model predicts ${pct(d.packet)} gets through.`;
  if (!d.launched) return `${setup} ${model} The electron has not been launched.`;
  const now = `${pct(d.transmitted)} has got through and ${pct(d.reflected)} has reflected`;
  return `${setup} ${model} ${d.done ? `Finished: ${now}.` : `Running: so far ${now}.`}`;
}
