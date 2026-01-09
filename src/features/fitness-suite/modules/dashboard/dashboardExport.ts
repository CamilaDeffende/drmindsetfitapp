/* eslint-disable @typescript-eslint/no-explicit-any */
import { useWorkoutStore } from "../../store/useWorkoutStore";
import { useUIStore } from "../../store/useUIStore";

type AnyObj = Record<string, any>;

function safeJsonParse<T = any>(raw: string | null): T | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

function safeLocalStorageGet(key: string): any | null {
  try {
    if (typeof window === "undefined") return null;
    return safeJsonParse(window.localStorage.getItem(key));
  } catch { return null; }
}

function mergeWithFallback(storeData: AnyObj | null | undefined, fallback: AnyObj | null | undefined): AnyObj {
  const s = storeData && typeof storeData === "object" ? storeData : {};
  const f = fallback && typeof fallback === "object" ? fallback : {};
  return { ...f, ...s };
}

export function getDashboardExportSnapshot() {
  const workoutState = useWorkoutStore.getState?.() ?? null;
  const uiState = useUIStore.getState?.() ?? null;

  const workoutLS = safeLocalStorageGet("mindsetfit.workout");
  const uiLS = safeLocalStorageGet("mindsetfit.ui");

  const workout = mergeWithFallback(workoutState as AnyObj, workoutLS as AnyObj);
  const ui = mergeWithFallback(uiState as AnyObj, uiLS as AnyObj);

  const meta = {
    exportedAtISO: new Date().toISOString(),
    source: {
      workout: workoutState ? "store" : workoutLS ? "localStorage" : "empty",
      ui: uiState ? "store" : uiLS ? "localStorage" : "empty",
    },
  };

  return { workout, ui, meta };
}
