import { SafetySeverity } from "../core/enums";
import { SafetyFlag, TrainingPlan } from "../core/types";

export function validateMovementBalance(plan: TrainingPlan): SafetyFlag[] {
  const flags: SafetyFlag[] = [];
  if (!plan.sessions.length) {
    flags.push({ severity: SafetySeverity.HIGH, message: "Plano sem sessões para avaliar equilíbrio motor." });
  }
  return flags;
}
