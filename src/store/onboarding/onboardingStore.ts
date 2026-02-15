/**
 * MF_ONBOARDING_STORE_V1
 * SSOT do onboarding com persistência progressiva (Zustand persist).
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type OnboardingDraft = Record<string, unknown>;

// ⚠️ Estado persistido (SEM actions)
export type OnboardingPersistedState = {
  schemaVersion: 1;
  updatedAtIso: string;
  currentStep: number; // 1..8
  completedSteps: number[];
  draft: OnboardingDraft;
};

// Estado em runtime (com actions)
export type OnboardingState = OnboardingPersistedState & {
  saveDraftPartial: (partial: OnboardingDraft) => void;
  saveDraft: (partial: OnboardingDraft) => void;
  markStepComplete: (step: number) => void;
  setCurrentStep: (step: number) => void;
  resetOnboarding: () => void;
};

const nowIso = () => new Date().toISOString();
const STORAGE_KEY = "mf:onboarding:v1";

const initialPersisted = (): OnboardingPersistedState => ({
  schemaVersion: 1,
  updatedAtIso: nowIso(),
  currentStep: 1,
  completedSteps: [],
  draft: {},
});

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      ...initialPersisted(),

      saveDraftPartial: (partial) => {

        set((st) => ({

          ...st,

          updatedAtIso: nowIso(),

          draft: { ...st.draft, ...partial },

        }));

      },


      saveDraft: (partial) => {
        set((s) => ({
          ...s,
          updatedAtIso: nowIso(),
          draft: { ...s.draft, ...partial },
        }));
      },

      markStepComplete: (step) => {
        const prev = get().completedSteps;
        const next = prev.includes(step) ? prev : [...prev, step].sort((a, b) => a - b);
        set({ completedSteps: next, updatedAtIso: nowIso() });
      },

      setCurrentStep: (step) => {
        set({ currentStep: step, updatedAtIso: nowIso() });
      },

      resetOnboarding: () => {
        set({
          ...initialPersisted(),
        });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
      // migrate SEM "version" (pra não dar TS6133) e retornando apenas persisted state
      migrate: (persisted: any) => {
        if (!persisted || typeof persisted !== "object") {
          return initialPersisted();
        }

        const safeCompleted = Array.isArray(persisted.completedSteps)
          ? persisted.completedSteps.map((n: any) => Number(n)).filter((n: any) => Number.isFinite(n))
          : [];

        const safeDraft = persisted.draft && typeof persisted.draft === "object" ? persisted.draft : {};

        return {
          schemaVersion: 1,
          updatedAtIso: String(persisted.updatedAtIso || nowIso()),
          currentStep: Number(persisted.currentStep || 1),
          completedSteps: safeCompleted,
          draft: safeDraft,
        } satisfies OnboardingPersistedState;
      },
      // opcional: evita persistir actions
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        updatedAtIso: state.updatedAtIso,
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        draft: state.draft,
      }),
    }
  )
);
