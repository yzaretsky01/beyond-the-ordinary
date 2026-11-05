import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/** Every room, in suggested order. `load` is shared by routing (lazy) and the hall (prefetch). */
export interface RoomEntry {
  n: string;
  id: string;
  title: string;
  question: string;
  load?: () => Promise<{ default: ComponentType }>;
}

export const ROOMS: RoomEntry[] = [
  {
    n: '01',
    id: 'double-slit',
    title: 'Double Slit',
    question: 'One particle, two paths',
    load: () => import('./double-slit/DoubleSlitRoom'),
  },
  {
    n: '02',
    id: 'superposition',
    title: 'Superposition',
    question: 'Two answers at once',
    load: () => import('./superposition/SuperpositionRoom'),
  },
  {
    n: '03',
    id: 'entanglement',
    title: 'Entanglement',
    question: 'Two particles, one story',
    load: () => import('./entanglement/EntanglementRoom'),
  },
  {
    n: '04',
    id: 'tunneling',
    title: 'Tunneling',
    question: 'Passing through the wall',
    load: () => import('./tunneling/TunnelingRoom'),
  },
  {
    n: '05',
    id: 'quantum-computing',
    title: 'Quantum Computing',
    question: 'Computing with waves',
    load: () => import('./quantum-computing/QcRoom'),
  },
];

const cache = new Map<string, LazyExoticComponent<ComponentType>>();
export function lazyRoom(r: RoomEntry): LazyExoticComponent<ComponentType> {
  let c = cache.get(r.id);
  if (!c) cache.set(r.id, (c = lazy(r.load!)));
  return c;
}
