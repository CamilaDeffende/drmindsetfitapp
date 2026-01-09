/* eslint-disable @typescript-eslint/no-explicit-any */
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
  };

  return { workout, diet, hiit, cardio, progress, history, ui, meta };
}
