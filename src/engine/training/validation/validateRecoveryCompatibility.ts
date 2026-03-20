import { SafetySeverity } from "../core/enums";
import { SafetyFlag, TrainingPlan } from "../core/types";

export function validateRecoveryCompatibility(plan: TrainingPlan): SafetyFlag[] {
  const flags: SafetyFlag[] = [];
  const recovery = String(plan.profile.recoveryLevel ?? plan.profile.recoveryProfile);

  if (
    recovery === "LOW" &&
    plan.sessions.some((session) => session.estimatedDurationMin > 55)
  ) {
    flags.push({
      severity: SafetySeverity.MODERATE,
      message: "Perfil de recuperação baixo com sessões relativamente longas.",
    });
  }

  return flags;
}
