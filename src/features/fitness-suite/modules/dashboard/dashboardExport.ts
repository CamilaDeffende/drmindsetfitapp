import { useWorkoutStore } from "../../store/useWorkoutStore";
import { useUIStore } from "../../store/useUIStore";
import { useHistoryStore } from "../../store/useHistoryStore";
import { useProgressStore } from "../../store/useProgressStore";

type AnyObj = Record<string, any>;

function safe(raw: string | null) {
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

function ls(key: string) {
  try {
    if (typeof window === "undefined") return null;
    return safe(localStorage.getItem(key));
  } catch {
    return null;
  }
}

function lsPick(keys: string[]) {
  for (const k of keys) {
    const v = ls(k);
    if (v != null) return { key: k, val: v as AnyObj };
  }
  return { key: "", val: null as any };
}

function merge(store: AnyObj | null, fb: AnyObj | null) {
  return { ...(fb || {}), ...(store || {}) };
}

function sourceOf(store: AnyObj | null, fb: AnyObj | null) {
  return store ? "store" : (fb ? "localStorage" : "empty");
}

// === Sprint 5B | Normalização p/ PDF (cards reais) ===
function oneLine(v: any, max = 220) {
  try {
    const t = (v == null) ? "" : (typeof v === "string" ? v : JSON.stringify(v));
    const clean = t.replace(/\s+/g, " ").trim();
    return clean.length > max ? clean.slice(0, max) + "…" : clean;
  } catch { return ""; }
}

function pickFirst(obj: any, keys: string[]) {
  try {
    if (!obj || typeof obj !== "object") return null;
    for (const k of keys) {
      const v = (obj as any)[k];
      if (v != null && v !== "" && !(Array.isArray(v) && v.length === 0)) return v;
    }
    return null;
  } catch { return null; }
}
// === /Sprint 5B ===

export function getDashboardExportSnapshot() {
  const workoutState = (useWorkoutStore.getState?.() as AnyObj) ?? null;
  const uiState = (useUIStore.getState?.() as AnyObj) ?? null;
  const progressState = (useProgressStore.getState?.() as AnyObj) ?? null;
  const historyState = (useHistoryStore.getState?.() as AnyObj) ?? null;

  // módulos que hoje vivem principalmente em localStorage (fallback-first) — robusto por múltiplas chaves
  const dietPick = lsPick(["diet", "dieta", "dietPlan", "diet_plan", "nutrition", "nutricao", "meals", "mealPlan", "meal_plan"]);
  const hiitPick = lsPick(["hiit", "hiitPlan", "hiit_plan", "hiitWorkout", "hiit_workout"]);
  const cardioPick = lsPick(["cardio", "cardioPlan", "cardio_plan", "cardioWorkout", "cardio_workout"]);

  const treinoPick = lsPick(["treino", "workout", "workoutPlan", "workout_plan"]);
  const uiPick = lsPick(["ui", "uistate", "uiState"]);
  const progressPick = lsPick(["progress", "progresso"]);
  const historyPick = lsPick(["history", "historico", "histórico"]);

  const workout = merge(workoutState, treinoPick.val);
  const ui = merge(uiState, uiPick.val);
  const progress = merge(progressState, progressPick.val);
  const history = merge(historyState, historyPick.val);

  const diet = merge(null, dietPick.val);
  const hiit = merge(null, hiitPick.val);
  const cardio = merge(null, cardioPick.val);

  const meta = {
    exportedAtISO: new Date().toISOString(),
    source: {
      workout: sourceOf(workoutState, treinoPick.val) + (treinoPick.key ? `:${treinoPick.key}` : ""),
      ui: sourceOf(uiState, uiPick.val) + (uiPick.key ? `:${uiPick.key}` : ""),
      progress: sourceOf(progressState, progressPick.val) + (progressPick.key ? `:${progressPick.key}` : ""),
      history: sourceOf(historyState, historyPick.val) + (historyPick.key ? `:${historyPick.key}` : ""),
      diet: (dietPick.val ? `localStorage:${dietPick.key}` : "empty"),
      hiit: (hiitPick.val ? `localStorage:${hiitPick.key}` : "empty"),
      cardio: (cardioPick.val ? `localStorage:${cardioPick.key}` : "empty"),
    },
  

  // === Sprint 5B | Normalizado para cards no PDF ===
  normalized: (() => {
    try {
      const w: any = (typeof workout !== "undefined" ? workout : {}) || {};
      const d: any = (typeof diet !== "undefined" ? diet : {}) || {};
      const h: any = (typeof hiit !== "undefined" ? hiit : {}) || {};
      const c: any = (typeof cardio !== "undefined" ? cardio : {}) || {};
      const prog: any = (typeof progress !== "undefined" ? progress : {}) || {};
      const hist: any = (typeof history !== "undefined" ? history : {}) || {};

      const exercises = (w.exercises ?? w.items ?? w.list ?? []);
      const wNotes = pickFirst(w, ["notes","observations","comment","comentario","comentário","observacao","observação","observações"]);
      const meals = (d.meals ?? d.refeicoes ?? d.refeições ?? d.items ?? d.list ?? []);
      const macros = pickFirst(d, ["macros","meta","targets","target","goal","objetivo","objetivoDiario","objetivo_diario"]);

      const hiitProtocol = pickFirst(h, ["protocol","plan","workout","session","protocolo"]);
      const hiitFreq = pickFirst(h, ["frequency","perWeek","weekly","freq","frequencia","frequência"]);

      const cardioMod = pickFirst(c, ["modality","type","activity","modalidade"]);
      const cardioDur = pickFirst(c, ["duration","time","minutes","duracao","duração"]);
      const cardioInt = pickFirst(c, ["intensity","zone","pace","intensidade"]);
      const cardioFreq = pickFirst(c, ["frequency","perWeek","weekly","freq","frequencia","frequência"]);

      const progKeys = (prog && typeof prog === "object") ? Object.keys(prog) : [];
      const histKeys = (hist && typeof hist === "object") ? Object.keys(hist) : [];

      const exNames = (Array.isArray(exercises) ? exercises : [])
        .slice(0, 10)
        .map((e: any) => e?.name ?? e?.title ?? e?.exercise ?? e?.exercicio ?? e?.exercício ?? "Exercício")
        .filter(Boolean);

      return {
        workout: {
          exercisesCount: Array.isArray(exercises) ? exercises.length : (exercises ? 1 : 0),
          topExercises: exNames,
          notes: oneLine(wNotes, 260),
        },
        diet: {
          mealsCount: Array.isArray(meals) ? meals.length : (meals ? 1 : 0),
          macros: oneLine(macros, 260),
        },
        hiit: {
          protocol: oneLine(hiitProtocol, 260),
          frequency: oneLine(hiitFreq, 120),
        },
        cardio: {
          modality: oneLine(cardioMod, 160),
          duration: oneLine(cardioDur, 120),
          intensity: oneLine(cardioInt, 160),
          frequency: oneLine(cardioFreq, 120),
        },
        progress: { keys: progKeys.slice(0, 16) },
        history: { keys: histKeys.slice(0, 16) },
      };
    } catch {
      return {};
    }
  })(),
  // === /Sprint 5B ===

};

  return { workout, diet, hiit, cardio, progress, history, ui, meta };
}
