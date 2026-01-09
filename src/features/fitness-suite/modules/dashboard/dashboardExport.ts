/* eslint-disable @typescript-eslint/no-explicit-any */
import { useWorkoutStore } from "../../store/useWorkoutStore";
import { useUIStore } from "../../store/useUIStore";
import { useHistoryStore } from "../../store/useHistoryStore";
import { useProgressStore } from "../../store/useProgressStore";

type AnyObj = Record<string, any>;

function safe(raw: string | null) { try { return raw ? JSON.parse(raw) : null; } catch { return null; } }
function ls(key: string) { return typeof window === "undefined" ? null : safe(localStorage.getItem(key)); }
function merge(store: AnyObj | null, fb: AnyObj | null) { return { ...(fb||{}), ...(store||{}) }; }

export function getDashboardExportSnapshot() {
  const workout  = merge(useWorkoutStore.getState?.(), ls("treino"));
  const diet     = merge(ls("diet"), ls("diet"));
  const hiit     = merge(ls("hiit"), ls("hiit"));
  const cardio   = merge(ls("cardio"), ls("cardio"));
  const progress = merge(useProgressStore.getState?.(), ls("progress"));
  const history  = merge(useHistoryStore.getState?.(), ls("history"));
  const ui       = merge(useUIStore.getState?.(), ls("ui"));

  return {
    workout,
    diet,
    hiit,
    cardio,
    progress,
    history,
    ui,
    meta: { exportedAt: new Date().toISOString() }
  };
}
