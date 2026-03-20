import { SafetySeverity, TrainingSplit } from "../core/enums";
import { SafetyFlag, TrainingPlan } from "../core/types";

export function validateSplitCoherence(plan: TrainingPlan): SafetyFlag[] {
  const flags: SafetyFlag[] = [];
  const split = String(plan.split) as TrainingSplit;
  if (!split) {
    flags.push({ severity: SafetySeverity.HIGH, message: "Split ausente ou inválido." });
  }
  return flags;
}
