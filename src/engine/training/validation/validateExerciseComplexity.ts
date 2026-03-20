import { SafetySeverity, TrainingLevel } from "../core/enums";
import { SafetyFlag, TrainingPlan } from "../core/types";
import { EXERCISES } from "../library/exercises";

export function validateExerciseComplexity(plan: TrainingPlan): SafetyFlag[] {
  const flags: SafetyFlag[] = [];

  for (const session of plan.sessions) {
    for (const exercise of session.exercises) {
      const found = EXERCISES.find((item) => item.id === exercise.exerciseId);
      if (
        plan.profile.level === TrainingLevel.BEGINNER &&
        found?.difficultyScore &&
        found.difficultyScore >= 4
      ) {
        flags.push({
          severity: SafetySeverity.MODERATE,
          message: `${exercise.name ?? exercise.exerciseName} é relativamente complexo para o nível atual.`,
        });
      }
    }
  }

  return flags;
}
