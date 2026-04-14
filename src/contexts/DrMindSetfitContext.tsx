import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import type { DrMindSetfitState } from "@/types";
import { adaptActivePlanNutrition } from "@/services/nutrition/nutrition.adapter";

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
const ACTIVE_PLAN_KEY = "mf:activePlan:v1";

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

const readActivePlan = (): any | null => {
  try {
    const raw = localStorage.getItem(ACTIVE_PLAN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("Erro ao carregar activePlan:", error);
    return null;
  }
};

const buildStateFromActivePlan = (activePlan: any): Partial<DrMindSetfitState> => {
  if (!activePlan) return {};

  const adaptedNutrition = adaptActivePlanNutrition(activePlan?.nutrition);

  const refeicoes =
    adaptedNutrition?.refeicoes ??
    activePlan?.nutrition?.refeicoes ??
    activePlan?.nutrition?.meals ??
    activePlan?.meals ??
    [];

  const macros = adaptedNutrition?.macros ?? {
    calorias:
      activePlan?.nutrition?.macros?.calorias ??
      activePlan?.nutrition?.kcalTarget ??
      activePlan?.metabolic?.targetKcal ??
      0,
    proteina:
      activePlan?.nutrition?.macros?.proteina ??
      activePlan?.nutrition?.macros?.protein ??
      activePlan?.macros?.proteinG ??
      0,
    carboidratos:
      activePlan?.nutrition?.macros?.carboidratos ??
      activePlan?.nutrition?.macros?.carbs ??
      activePlan?.macros?.carbsG ??
      0,
    gorduras:
      activePlan?.nutrition?.macros?.gorduras ??
      activePlan?.nutrition?.macros?.fat ??
      activePlan?.macros?.fatG ??
      0,
  };

  const nutricao = {
    ...(activePlan?.nutrition ?? {}),
    kcalAlvo:
      activePlan?.nutrition?.kcalTarget ??
      activePlan?.nutrition?.kcal ??
      activePlan?.metabolic?.targetKcal ??
      0,
    caloriasAlvo:
      activePlan?.nutrition?.kcalTarget ??
      activePlan?.nutrition?.kcal ??
      activePlan?.metabolic?.targetKcal ??
      0,
    macros,
    refeicoes,
  };

  const hoje = new Date();
  const dataInicio = hoje.toISOString().split("T")[0];
  const dataFim = new Date(hoje.getTime() + 28 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const dietaAtiva = {
    dataInicio,
    dataFim,
    duracaoSemanas: 4,
    estrategia:
      activePlan?.nutrition?.strategy ??
      activePlan?.nutrition?.preference ??
      "Dieta 4 semanas",
    nutricao,
  };

  const treino = {
    ...(activePlan?.training ?? {}),
    week:
      activePlan?.training?.week ??
      activePlan?.training?.days ??
      activePlan?.workout?.week ??
      activePlan?.workout?.days ??
      [],
    days:
      activePlan?.training?.days ??
      activePlan?.training?.week ??
      activePlan?.workout?.days ??
      activePlan?.workout?.week ??
      [],
    modality:
      activePlan?.training?.modality ??
      activePlan?.workout?.modality ??
      "musculacao",
    frequency:
      activePlan?.training?.frequency ??
      activePlan?.training?.selectedDays?.length ??
      0,
  };

  const treinoAtivo = {
    dataInicio,
    dataFim,
    duracaoSemanas: 4,
    estrategia: "Treino 4 semanas",
    treino,
    cargasPorSerie: [],
  };

  return {
    nutricao,
    dietaAtiva,
    treino,
    treinoAtivo,
  };
};

// Função para carregar estado do localStorage
const loadStateFromStorage = (): DrMindSetfitState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const onboardingDone = readOnboardingDoneFlag();
    const activePlan = readActivePlan();
    const activePlanState = buildStateFromActivePlan(activePlan);

    if (stored) {
      const parsed = JSON.parse(stored) as DrMindSetfitState;
      return {
        ...initialState,
        ...parsed,
        ...activePlanState,
        concluido: Boolean(parsed?.concluido) || onboardingDone,
      };
    }

    if (onboardingDone) {
      return {
        ...initialState,
        ...activePlanState,
        concluido: true,
      };
    }

    return {
      ...initialState,
      ...activePlanState,
      concluido: onboardingDone,
    };
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

  // Hidratação inicial controlada: executa apenas uma vez no boot
  useEffect(() => {
    const onboardingDone = readOnboardingDoneFlag();
    const activePlan = readActivePlan();
    const activePlanState = buildStateFromActivePlan(activePlan);

    setState((prev) => {
      const prevMeals = Array.isArray((prev as any)?.nutricao?.refeicoes)
        ? (prev as any).nutricao.refeicoes.length
        : 0;

      const nextMeals = Array.isArray((activePlanState as any)?.nutricao?.refeicoes)
        ? (activePlanState as any).nutricao.refeicoes.length
        : 0;

      const shouldHydrateFromActivePlan =
        !!activePlan &&
        (
          !prev.dietaAtiva ||
          !prev.nutricao ||
          !prev.treino ||
          !prev.treinoAtivo ||
          (prevMeals === 0 && nextMeals > 0)
        );

      const next = shouldHydrateFromActivePlan
        ? {
            ...prev,
            ...activePlanState,
            concluido: prev.concluido || onboardingDone,
          }
        : {
            ...prev,
            concluido: prev.concluido || onboardingDone,
          };

      const changed =
        next.concluido !== prev.concluido ||
        next.dietaAtiva !== prev.dietaAtiva ||
        next.nutricao !== prev.nutricao ||
        next.treino !== prev.treino ||
        next.treinoAtivo !== prev.treinoAtivo;

      return changed ? next : prev;
    });
  }, []);

  // Persistência separada: salva quando o estado mudar, sem re-hidratar
  useEffect(() => {
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