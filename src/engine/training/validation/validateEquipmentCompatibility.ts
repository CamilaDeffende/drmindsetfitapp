import { SafetySeverity } from "../core/enums";
import { SafetyFlag, TrainingPlan } from "../core/types";
import { EXERCISES } from "../library/exercises";

export function validateEquipmentCompatibility(plan: TrainingPlan): SafetyFlag[] {
  const flags: SafetyFlag[] = [];
  const env = plan.profile.environment;

  for (const session of plan.sessions) {
    for (const exercise of session.exercises) {
      const found = EXERCISES.find((item) => item.id === exercise.exerciseId);
      if (found && !found.environmentTags.includes(env) && env !== "HYBRID") {
        flags.push({
          code: "equipment_incompatible",
          severity: SafetySeverity.WARNING,
          message: `${exercise.name} pode não ser ideal para o ambiente atual.`,
        });
      }
    }
  }

  return flags;
}
