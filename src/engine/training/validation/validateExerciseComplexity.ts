import { SafetySeverity, TrainingLevel } from "../core/enums";
import { SafetyFlag, TrainingPlan } from "../core/types";
import { EXERCISES } from "../library/exercises";

export function validateExerciseComplexity(plan: TrainingPlan): SafetyFlag[] {
  if (plan.profile.level === TrainingLevel.ADVANCED) return [];

  const flags: SafetyFlag[] = [];
  for (const session of plan.sessions) {
    for (const exercise of session.exercises) {
      const found = EXERCISES.find((item) => item.id === exercise.exerciseId);
      if (found?.difficultyScore && found.difficultyScore >= 4) {
        flags.push({
          code: "exercise_complexity",
          severity: SafetySeverity.WARNING,
          message: `${exercise.name} é relativamente complexo para o nível atual.`,
        });
      }
    }
  }
  return flags;
}
