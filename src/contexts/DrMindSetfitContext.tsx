import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import type { DrMindSetfitState } from "@/types";

interface DrMindSetfitContextType {
  state: DrMindSetfitState;
  updateState: (updates: Partial<DrMindSetfitState>) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetApp: () => void;
}

const DrMindSetfitContext = createContext<DrMindSetfitContextType | undefined>(undefined);

export const STORAGE_KEY = "drmindsetfit_state";
const ONBOARDING_DONE_KEY = "mf:onboarding:done:v1";

const initialState: DrMindSetfitState = {
  etapaAtual: 1,
  concluido: false,
  passosDiarios: [],
  consumoCalorias: [],
  corridas: [],
};

const readOnboardingDoneFlag = (): boolean => {
  try {
    return localStorage.getItem(ONBOARDING_DONE_KEY) === "1";
  } catch {
    return false;
  }
};

// Função para carregar estado do localStorage
const loadStateFromStorage = (): DrMindSetfitState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const onboardingDone = readOnboardingDoneFlag();

    if (stored) {
      const parsed = JSON.parse(stored) as DrMindSetfitState;
      return {
        ...initialState,
        ...parsed,
        // se o onboarding real já foi concluído, sincroniza isso no contexto
        concluido: Boolean(parsed?.concluido) || onboardingDone,
      };
    }

    if (onboardingDone) {
      return {
        ...initialState,
        concluido: true,
      };
    }
  } catch (error) {
    console.error("Erro ao carregar estado:", error);
  }

  return {
    ...initialState,
    concluido: readOnboardingDoneFlag(),
  };
};

// Função para salvar estado no localStorage
const saveStateToStorage = (state: DrMindSetfitState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Erro ao salvar estado:", error);
  }
};

export function DrMindSetfitProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DrMindSetfitState>(loadStateFromStorage);

  // Mantém concluido sincronizado com o flag do onboarding
  useEffect(() => {
    const onboardingDone = readOnboardingDoneFlag();

    if (onboardingDone && !state.concluido) {
      setState((prev) => ({
        ...prev,
        concluido: true,
      }));
      return;
    }

    saveStateToStorage(state);
  }, [state]);

  const updateState = (updates: Partial<DrMindSetfitState>) => {
    setState((prev) => {
      const newState = { ...prev, ...updates };
      return newState;
    });
  };

  const nextStep = () => {
    setState((prev) => {
      const newState = {
        ...prev,
        etapaAtual: Math.min(prev.etapaAtual + 1, 8),
      };
      return newState;
    });
  };

  const prevStep = () => {
    setState((prev) => {
      const newState = {
        ...prev,
        etapaAtual: Math.max(prev.etapaAtual - 1, 1),
      };
      return newState;
    });
  };

  const resetApp = () => {
    setState(initialState);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ONBOARDING_DONE_KEY);
    } catch {}
  };

  return (
    <DrMindSetfitContext.Provider value={{ state, updateState, nextStep, prevStep, resetApp }}>
      {children}
    </DrMindSetfitContext.Provider>
  );
}

export function useDrMindSetfit() {
  const context = useContext(DrMindSetfitContext);
  if (!context) {
    throw new Error("useDrMindSetfit deve ser usado dentro de DrMindSetfitProvider");
  }
  return context;
}