/* eslint-disable @typescript-eslint/no-explicit-any */
import { useWorkoutStore } from "../../store/useWorkoutStore";
import { useUIStore } from "../../store/useUIStore";

type AnyObj = Record<string, any>;

function safeParse(raw: string | null) { try { return raw ? JSON.parse(raw) : null; } catch { return null; } }
function ls(key: string) { return typeof window === "undefined" ? null : safeParse(localStorage.getItem(key)); }
function merge(store: AnyObj | null, fb: AnyObj | null) { return { ...(fb||{}), ...(store||{}) }; }

export function getDashboardExportSnapshot() {
  const workout = merge(useWorkoutStore.getState?.(), ls("treino"));
  const diet    = merge(ls("diet"), ls("diet"));
  const hiit    = merge(ls("hiit"), ls("hiit"));
  const cardio  = merge(ls("cardio"), ls("cardio"));
  const ui      = merge(useUIStore.getState?.(), ls("ui"));

  return {
    workout,
    diet,
    hiit,
    cardio,
    ui,
    meta: {
      exportedAt: new Date().toISOString(),
    }
  };
}
