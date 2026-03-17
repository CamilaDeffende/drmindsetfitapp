import { RecoveryLevel, SafetySeverity } from "../core/enums";
import { SafetyFlag, TrainingPlan } from "../core/types";

export function validateRecoveryCompatibility(plan: TrainingPlan): SafetyFlag[] {
  if (plan.profile.recoveryLevel === RecoveryLevel.LOW && plan.sessions.some((session) => session.estimatedDurationMin > 55)) {
    return [{ code: "recovery_compatibility", severity: SafetySeverity.WARNING, message: "sessão longa para perfil de recuperação baixo." }];
  }
  return [];
}
