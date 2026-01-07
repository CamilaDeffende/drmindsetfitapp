import { create } from "zustand";

export type HistoryWorkout = {
  date: string; // YYYY-MM-DD
  exercises: {
    name: string;
    muscle: string;
    sets: { reps: number; load: number }[];
  }[];
};

type HistoryState = {
  selectedDate: string;
  history: Record<string, HistoryWorkout>;
  selectDate: (d: string) => void;
  saveWorkout: (w: HistoryWorkout) => void;
};

const today = () => new Date().toISOString().slice(0, 10);

export const useHistoryStore = create<HistoryState>((set) => ({
  selectedDate: today(),
  history: JSON.parse(localStorage.getItem("history") || "{}"),

  selectDate: (d) => set({ selectedDate: d }),

  saveWorkout: (w) =>
    set((state) => {
      const next = { ...state.history, [w.date]: w };
      localStorage.setItem("history", JSON.stringify(next));
      return { history: next };
    }),
}));
