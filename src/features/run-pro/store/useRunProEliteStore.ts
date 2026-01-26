import { create } from "zustand";
import type { RunFix } from "@/features/run-pro/types/runTypes";
import type { HardeningConfig, HardeningState } from "@/features/run-pro/engine/runHardening";
import { defaultHardening, initHardening } from "@/features/run-pro/engine/runHardening";

type State = {
  isRunning: boolean;
  config: HardeningConfig;
  state: HardeningState;
  rawFixes: RunFix[];
  smoothFixes: RunFix[];
};

type Actions = {
  start: (at?: number) => void;
  stop: (at?: number) => void;
  reset: () => void;
  setConfig: (cfg: Partial<HardeningConfig>) => void;
  pushFix: (raw: RunFix, smooth?: RunFix) => void;
  setState: (st: HardeningState) => void;
};

export const useRunProEliteStore = create<State & Actions>((set, get) => ({
  isRunning: false,
  config: defaultHardening,
  state: initHardening(Date.now()),
  rawFixes: [],
  smoothFixes: [],

  start: (at) => {
    const ts = at ?? Date.now();
    set({
      isRunning: true,
      state: initHardening(ts),
      rawFixes: [],
      smoothFixes: [],
    });
  },

  stop: (at) => {
    const ts = at ?? Date.now();
    const cur = get().state;
    cur.stats.endedAt = ts;
    cur.stats.elapsedMs = ts - cur.stats.startedAt;
    set({ isRunning: false, state: cur });
  },

  reset: () => set({
    isRunning: false,
    config: defaultHardening,
    state: initHardening(Date.now()),
    rawFixes: [],
    smoothFixes: [],
  }),

  setConfig: (cfg) => set({ config: { ...get().config, ...cfg } }),

  pushFix: (raw, smooth) => {
    const a = get().rawFixes;
    const b = get().smoothFixes;
    a.push(raw);
    if (smooth) b.push(smooth);
    // limita histórico pra não estourar memória (MVP)
    if (a.length > 5000) a.splice(0, a.length - 5000);
    if (b.length > 5000) b.splice(0, b.length - 5000);
    set({ rawFixes: a, smoothFixes: b });
  },

  setState: (st) => set({ state: st }),
}));
