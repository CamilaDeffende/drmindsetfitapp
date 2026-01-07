import { create } from "zustand";
import { readJSON, writeJSON } from "./storage";
import type { PR } from "../contracts/workout";

type Persisted = {
  streak: number;
  prs: PR[];
  updatedAt: number;
};

type ProgressState = Persisted & {
  hydrate: () => void;
  setStreak: (streak: number) => void;
  setPRs: (prs: PR[]) => void;
  touch: () => void;
};

const KEY = "dmf_progress_v1";

export const useProgressStore = create<ProgressState>((set, get) => ({
  streak: 0,
  prs: [],
  updatedAt: Date.now(),

  hydrate: () => {
    const p = readJSON<Persisted>(KEY, { streak: 0, prs: [], updatedAt: Date.now() });
    set(p);
  },

  setStreak: (streak) => {
    const next: Persisted = { streak, prs: get().prs, updatedAt: Date.now() };
    set(next);
    writeJSON(KEY, next);
  },

  setPRs: (prs) => {
    const next: Persisted = { streak: get().streak, prs, updatedAt: Date.now() };
    set(next);
    writeJSON(KEY, next);
  },

  touch: () => {
    const next: Persisted = { streak: get().streak, prs: get().prs, updatedAt: Date.now() };
    set({ updatedAt: next.updatedAt });
    writeJSON(KEY, next);
  },
}));
