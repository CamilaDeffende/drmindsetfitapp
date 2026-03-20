import { SafetySeverity } from "../core/enums";
import { SafetyFlag, TrainingPlan } from "../core/types";
import { EXERCISES } from "../library/exercises";

export function validateEquipmentCompatibility(plan: TrainingPlan): SafetyFlag[] {
  const env = String(plan.profile.environment ?? "HYBRID").toUpperCase();
  const flags: SafetyFlag[] = [];

  for (const session of plan.sessions) {
    for (const exercise of session.exercises) {
      const found = EXERCISES.find((item) => item.id === exercise.exerciseId);
      if (found && found.environmentTags && !found.environmentTags.includes(env) && env !== "HYBRID") {
        flags.push({
          severity: SafetySeverity.MODERATE,
          message: `${exercise.name ?? exercise.exerciseName} pode não ser ideal para o ambiente atual.`,
        });
      }
    }
  }

  return flags;
}
