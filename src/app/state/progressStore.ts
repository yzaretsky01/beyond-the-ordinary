import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

/** localStorage that never throws (private windows, blocked storage): progress is a convenience, not a requirement. */
const safeStorage: StateStorage = {
  getItem: (k) => {
    try {
      return window.localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k, v) => {
    try {
      window.localStorage.setItem(k, v);
    } catch {
      /* ignore */
    }
  },
  removeItem: (k) => {
    try {
      window.localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  },
};

interface ProgressState {
  discoveries: Record<string, string[]>;
  challenges: Record<string, string[]>;
  addDiscovery: (room: string, id: string) => boolean;
  completeChallenge: (room: string, id: string) => void;
  resetRoom: (room: string) => void;
}

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      discoveries: {},
      challenges: {},
      addDiscovery: (room, id) => {
        const have = get().discoveries[room] ?? [];
        if (have.includes(id)) return false;
        set({ discoveries: { ...get().discoveries, [room]: [...have, id] } });
        return true;
      },
      completeChallenge: (room, id) => {
        const have = get().challenges[room] ?? [];
        if (have.includes(id)) return;
        set({ challenges: { ...get().challenges, [room]: [...have, id] } });
      },
      resetRoom: (room) =>
        set({
          discoveries: { ...get().discoveries, [room]: [] },
          challenges: { ...get().challenges, [room]: [] },
        }),
    }),
    { name: 'bto-progress-v1', storage: createJSONStorage(() => safeStorage) },
  ),
);
