export type HudState = {
  speed: number;
  s: number;
  progress: number;
  position: number;
  racers: number;
  time: number;
  checkpoint: number;
  checkpointTotal: number;
  prompt: string | null;
  branchChoice: string | null;
  rivalS: number[];
  trafficS: [number, number][]; // [s, lateral]
  collisions: number;
};

const initial: HudState = {
  speed: 0,
  s: 0,
  progress: 0,
  position: 1,
  racers: 1,
  time: 0,
  checkpoint: 0,
  checkpointTotal: 0,
  prompt: null,
  branchChoice: null,
  rivalS: [],
  trafficS: [],
  collisions: 0,
};

let state: HudState = { ...initial };
const listeners = new Set<() => void>();

export const hudStore = {
  get: () => state,
  reset: () => {
    state = { ...initial };
    listeners.forEach((l) => l());
  },
  set: (patch: Partial<HudState>) => {
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
  },
  subscribe: (fn: () => void) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
