import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/** Every room, in suggested order. `load` is shared by routing (lazy) and the hall (prefetch). */
export interface RoomEntry {
  n: string;
  id: string;
  title: string;
  question: string;
  load?: () => Promise<{ default: ComponentType }>;
  /** the room's explanation page, at /<id>/about */
  about?: () => Promise<{ default: ComponentType }>;
}

export const ROOMS: RoomEntry[] = [
  {
    n: '01',
    id: 'double-slit',
    title: 'Double Slit',
    question: 'One particle, two paths',
    load: () => import('./double-slit/DoubleSlitRoom'),
    about: () => import('./double-slit/About'),
  },
  {
    n: '02',
    id: 'superposition',
    title: 'Superposition',
    question: 'Two answers at once',
    load: () => import('./superposition/SuperpositionRoom'),
    about: () => import('./superposition/About'),
  },
  {
    n: '03',
    id: 'entanglement',
    title: 'Entanglement',
    question: 'Two particles, one story',
    load: () => import('./entanglement/EntanglementRoom'),
    about: () => import('./entanglement/About'),
  },
  {
    n: '04',
    id: 'tunneling',
    title: 'Tunneling',
    question: 'Passing through the wall',
    load: () => import('./tunneling/TunnelingRoom'),
    about: () => import('./tunneling/About'),
  },
  {
    n: '05',
    id: 'quantum-computing',
    title: 'Quantum Computing',
    question: 'Computing with waves',
    load: () => import('./quantum-computing/QcRoom'),
    about: () => import('./quantum-computing/About'),
  },
];

const cache = new Map<string, LazyExoticComponent<ComponentType>>();
export function lazyRoom(r: RoomEntry): LazyExoticComponent<ComponentType> {
  return cached(r.id, r.load!);
}

export function lazyAbout(r: RoomEntry): LazyExoticComponent<ComponentType> {
  return cached(r.id + '/about', r.about!);
}

function cached(key: string, load: () => Promise<{ default: ComponentType }>) {
  let c = cache.get(key);
  if (!c) cache.set(key, (c = lazy(load)));
  return c;
}
