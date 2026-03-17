import { SafetySeverity } from "../core/enums";
import { SafetyFlag, TrainingPlan } from "../core/types";

export function validateSessionDuration(plan: TrainingPlan): SafetyFlag[] {
  return plan.sessions
    .filter((session) => session.estimatedDurationMin > plan.profile.sessionDurationMin + 5)
    .map((session) => ({
      code: "session_duration_over",
      severity: SafetySeverity.WARNING,
      message: `${session.name} pode passar da janela de tempo disponível.`,
    }));
}
