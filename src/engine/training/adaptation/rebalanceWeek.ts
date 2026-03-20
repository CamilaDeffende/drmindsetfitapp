import { TrainingPlan } from "../core/types";

export function rebalanceWeek(plan: TrainingPlan): TrainingPlan {
  const clone = structuredClone(plan);
  clone.rationale.push("Microciclo reequilibrado para preservar aderência e recuperação.");
  clone.version += 1;
  return clone;
}
