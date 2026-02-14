import { ensureTrainingPlanInActivePlan } from "./trainingPlan.ssot";

/**
 * Persist training plan inside mf:activePlan:v1
 * - Defensive: never throws
 * - No medical content
 */
export function persistTrainingPlanToActivePlan(): void {
  try {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("mf:activePlan:v1");
    const ap = raw ? JSON.parse(raw) : null;
    if (!ap || typeof ap !== "object") return;

    const ap2 = ensureTrainingPlanInActivePlan(ap);
    localStorage.setItem("mf:activePlan:v1", JSON.stringify(ap2));
  } catch {
    // noop
  }
}
