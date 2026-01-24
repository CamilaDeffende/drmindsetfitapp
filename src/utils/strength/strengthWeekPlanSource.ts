import { loadWeekPlan, type StrengthWeekPlan } from "@/utils/strength/strengthWeekStorage";

/**
 * Fonte soberana do weekPlan (Musculação):
 * 1) state.strengthWeekPlan (se existir)
 * 2) localStorage (fallback)
 *
 * Mantém BUILD VERDE sem depender de tipagem global imediata.
 */
export function getStrengthWeekPlanFromState(state: any): StrengthWeekPlan | null {
  try {
    const st = (state as any)?.strengthWeekPlan;
    if (st && typeof st === "object") return st as StrengthWeekPlan;
  } catch {}
  try {
    return loadWeekPlan();
  } catch {
    return null;
  }
}
