import { create } from "zustand";
import { TrainingFeedbackEntry, TrainingPlan } from "@/engine/training/core/types";
import { generateSmartTraining } from "@/engine/training/orchestrator/generateSmartTraining";
import { refreshTrainingFromFeedback } from "@/engine/training/orchestrator/refreshTrainingFromFeedback";
import { regenerateSmartTraining } from "@/engine/training/orchestrator/regenerateSmartTraining";

interface TrainingEngineState {
  onboardingInput?: unknown;
  currentPlan?: TrainingPlan;
  feedbackHistory: TrainingFeedbackEntry[];
  generatePlan: (source?: unknown) => void;
  regeneratePlan: (source?: unknown) => void;
  submitFeedback: (feedback: TrainingFeedbackEntry) => void;
  adaptPlan: () => void;
  resetTrainingEngine: () => void;
}

export const useTrainingEngineStore = create<TrainingEngineState>((set, get) => ({
  onboardingInput: undefined,
  currentPlan: undefined,
  feedbackHistory: [],
  generatePlan: (source) => set({
    onboardingInput: source,
    currentPlan: generateSmartTraining(source),
  }),
  regeneratePlan: (source) => set((state) => ({
    onboardingInput: source ?? state.onboardingInput,
    currentPlan: regenerateSmartTraining(source ?? state.onboardingInput, state.currentPlan?.version ?? 1),
  })),
  submitFeedback: (feedback) => set((state) => ({
    feedbackHistory: [...state.feedbackHistory, feedback],
  })),
  adaptPlan: () => {
    const state = get();
    if (!state.currentPlan) return;
    set({
      currentPlan: refreshTrainingFromFeedback(state.currentPlan, state.feedbackHistory),
    });
  },
  resetTrainingEngine: () => set({
    onboardingInput: undefined,
    currentPlan: undefined,
    feedbackHistory: [],
  }),
}));
