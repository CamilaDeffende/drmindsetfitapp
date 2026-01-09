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

  // módulos que hoje vivem principalmente em localStorage (fallback-first)
  const dietLS = ls("diet") as AnyObj | null;
  const hiitLS = ls("hiit") as AnyObj | null;
  const cardioLS = ls("cardio") as AnyObj | null;

  const workout = merge(workoutState, ls("treino"));
  const ui = merge(uiState, ls("ui"));
  const progress = merge(progressState, ls("progress"));
  const history = merge(historyState, ls("history"));

  const diet = merge(null, dietLS);
  const hiit = merge(null, hiitLS);
  const cardio = merge(null, cardioLS);

  const meta = {
    exportedAtISO: new Date().toISOString(),
    source: {
      workout: sourceOf(workoutState, ls("treino")),
      ui: sourceOf(uiState, ls("ui")),
      progress: sourceOf(progressState, ls("progress")),
      history: sourceOf(historyState, ls("history")),
      diet: (dietLS ? "localStorage" : "empty"),
      hiit: (hiitLS ? "localStorage" : "empty"),
      cardio: (cardioLS ? "localStorage" : "empty"),
    },
  };

  return { workout, diet, hiit, cardio, progress, history, ui, meta };
}
