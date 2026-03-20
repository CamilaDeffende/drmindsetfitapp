import { create } from "zustand";
import { TrainingPlan } from "@/engine/training/core/types";

type State = {
  currentPlan: TrainingPlan | null;
  lastDecision: unknown | null;
  setCurrentPlan: (plan: TrainingPlan | null) => void;
  setLastDecision: (decision: unknown | null) => void;
};

export const useTrainingEngineStore = create<State>((set) => ({
  currentPlan: null,
  lastDecision: null,
  setCurrentPlan: (currentPlan) => set({ currentPlan }),
  setLastDecision: (lastDecision) => set({ lastDecision }),
}));
