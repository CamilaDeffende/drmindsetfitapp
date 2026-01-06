import { create } from "zustand";

type UIState = {
  selectedMuscle: string | null;
  setSelectedMuscle: (m: string | null) => void;
};

export const useUIStore = create<UIState>((set) => ({
  selectedMuscle: null,
  setSelectedMuscle: (m) => set({ selectedMuscle: m }),
}));
