import { TrainingPlan } from "../core/types";

export function buildTrainingBlock(plan: TrainingPlan): TrainingPlan {
  const clone = structuredClone(plan);
  clone.rationale.push("Bloco inicial estruturado com progressão e semana de deload programada.");
  return clone;
}
