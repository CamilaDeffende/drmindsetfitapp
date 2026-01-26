import { create } from "zustand";

export type LiveCoords = {
  lat: number;
  lon: number;
  accuracyM?: number;
  headingDeg?: number | null;
  speedMps?: number | null;
  altitudeM?: number | null;
  updatedAt: number; // epoch ms
};

export type LiveLocationStatus =
  | "idle"
  | "starting"
  | "watching"
  | "denied"
  | "unavailable"
  | "error";

type State = {
  status: LiveLocationStatus;
  coords?: LiveCoords;
  tzIana?: string;
  locale?: string;
  error?: string;
  watchId?: number;
  // clock: mantém um "now" ao vivo (para UI/PDF) sem depender do relógio do backend
  nowTick: number; // epoch ms atualizado
};

type Actions = {
  setStatus: (s: LiveLocationStatus) => void;
  setCoords: (c?: LiveCoords) => void;
  setTzIana: (tz?: string) => void;
  setLocale: (loc?: string) => void;
  setError: (e?: string) => void;
  setWatchId: (id?: number) => void;
  tickNow: () => void;
  reset: () => void;
};

export const useGlobalLocationStore = create<State & Actions>((set) => ({
  status: "idle",
  coords: undefined,
  tzIana: undefined,
  locale: undefined,
  error: undefined,
  watchId: undefined,
  nowTick: Date.now(),

  setStatus: (status) => set({ status }),
  setCoords: (coords) => set({ coords }),
  setTzIana: (tzIana) => set({ tzIana }),
  setLocale: (locale) => set({ locale }),
  setError: (error) => set({ error }),
  setWatchId: (watchId) => set({ watchId }),
  tickNow: () => set({ nowTick: Date.now() }),

  reset: () => set({
    status: "idle",
    coords: undefined,
    tzIana: undefined,
    locale: undefined,
    error: undefined,
    watchId: undefined,
    nowTick: Date.now(),
  }),
}));
