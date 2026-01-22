import { create } from "zustand";
import type { LatLng, RunSession } from "./types";
import { distM } from "./utils";

type State = {
  active?: RunSession;
  history: RunSession[];
  isRunning: boolean;
  isPaused: boolean;

  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  addPoint: (p: LatLng) => void;
  load: () => void;
  clearHistory: () => void;
};

const KEY = "mf_runpro_history_v1";

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;
}

function computeDerived(points: LatLng[], startedAt: number) {
  let distanceM = 0;
  for (let i=1;i<points.length;i++) distanceM += distM(points[i-1], points[i]);

  const lastT = points.length ? points[points.length-1].t : startedAt;
  const totalSec = Math.max(0, Math.round((lastT - startedAt)/1000));

  const paceSecPerKm = distanceM > 10 && totalSec > 0 ? (totalSec / (distanceM/1000)) : undefined;
  const avgSpeedMps = totalSec > 0 ? (distanceM / totalSec) : undefined;

  // splits por km completo (aprox por timestamp no ponto que cruza o km)
  const splits: Array<{ km: number; splitSec: number; paceSecPerKm: number }> = [];
  let kmTarget = 1;
  let accDist = 0;
  let lastSplitT = startedAt;

  for (let i=1;i<points.length;i++) {
    accDist += distM(points[i-1], points[i]);
    if (accDist >= kmTarget*1000) {
      const t = points[i].t;
      const splitSec = Math.max(1, Math.round((t - lastSplitT)/1000));
      splits.push({ km: kmTarget, splitSec, paceSecPerKm: splitSec });
      kmTarget++;
      lastSplitT = t;
    }
  }

  return { distanceM, totalSec, paceSecPerKm, avgSpeedMps, splits };
}

export const useRunProStore = create<State>((set, get) => ({
  active: undefined,
  history: [],
  isRunning: false,
  isPaused: false,

  load: () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) set({ history: arr });
    } catch {}
  },

  clearHistory: () => {
    localStorage.removeItem(KEY);
    set({ history: [] });
  },

  start: () => {
    const startedAt = Date.now();
    set({
      active: {
        id: uid(),
        name: "Corrida",
        points: [],
        stats: { startedAt, durationSec: 0, totalSec: 0, distanceM: 0, splits: [] }
      },
      isRunning: true,
      isPaused: false
    });
  },

  pause: () => set({ isPaused: true }),
  resume: () => set({ isPaused: false }),

  stop: () => {
    const st = get();
    if (!st.active) return;
    const endedAt = Date.now();
    const fin: RunSession = {
      ...st.active,
      stats: { ...st.active.stats, endedAt }
    };

    const nextHistory = [fin, ...(st.history ?? [])].slice(0, 50);
    set({ history: nextHistory, active: undefined, isRunning: false, isPaused: false });
    try { localStorage.setItem(KEY, JSON.stringify(nextHistory)); } catch {}
  },

  addPoint: (p) => {
    const st = get();
    if (!st.isRunning || st.isPaused || !st.active) return;

    const now = p.t;
    const prev = st.active.points[st.active.points.length - 1];

    // filtros simples
    if (prev) {
      const dt = (now - prev.t)/1000;
      const d = distM(prev, p);
      if (dt <= 0) return;
      const speed = d/dt;
      if (speed > 12) return; // outlier
      if (d < 1) return;
    }

    const points = [...st.active.points, p];
    const derived = computeDerived(points, st.active.stats.startedAt);

    set({
      active: {
        ...st.active,
        points,
        stats: {
          ...st.active.stats,
          totalSec: derived.totalSec,
          durationSec: derived.totalSec, // pausa bloqueia pontos; então tempo em movimento = tempo total ativo
          distanceM: derived.distanceM,
          paceSecPerKm: derived.paceSecPerKm,
          avgSpeedMps: derived.avgSpeedMps,
          splits: derived.splits
        }
      }
    });
  },
}));
