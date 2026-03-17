import { SafetySeverity } from "../core/enums";
import { SafetyFlag, TrainingPlan } from "../core/types";

export function validateMovementBalance(plan: TrainingPlan): SafetyFlag[] {
  const total = plan.sessions.reduce((sum, session) => sum + session.exercises.length, 0);
  if (total < plan.sessions.length * 3) {
    return [{ code: "movement_balance_low", severity: SafetySeverity.INFO, message: "plano enxuto; checar equilíbrio caso evolua para maior volume." }];
  }
  return [];
}
