import { SafetySeverity } from "../core/enums";
import { SafetyFlag, TrainingPlan } from "../core/types";

export function validateSessionDuration(plan: TrainingPlan): SafetyFlag[] {
  const flags: SafetyFlag[] = [];
  for (const session of plan.sessions) {
    if (session.estimatedDurationMin > plan.profile.sessionDurationMin + 10) {
      flags.push({
        severity: SafetySeverity.MODERATE,
        message: `${session.name ?? "Sessão " + session.dayIndex} pode passar da janela de tempo disponível.`,
      });
    }
  }
  return flags;
}
