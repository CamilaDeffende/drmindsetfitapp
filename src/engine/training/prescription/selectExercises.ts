import { MovementPattern, TrainingEnvironment, TrainingLevel } from "../core/enums";
import { Exercise, TrainingProfile } from "../core/types";
import { EXERCISES } from "../library/exercises";

function environmentCompatible(exercise: Exercise, environment: TrainingEnvironment): boolean {
  return exercise.environmentTags.includes(environment) || environment === TrainingEnvironment.HYBRID;
}

function levelCompatible(exercise: Exercise, level: TrainingLevel): boolean {
  if (level === TrainingLevel.ADVANCED) return true;
  if (level === TrainingLevel.INTERMEDIATE) return exercise.technicalLevel !== TrainingLevel.ADVANCED;
  return exercise.technicalLevel === TrainingLevel.BEGINNER;
}

export function selectExercises(patterns: MovementPattern[], profile: TrainingProfile): Exercise[] {
  return patterns
    .map((pattern) =>
      EXERCISES.find((exercise) =>
        exercise.movementPattern === pattern &&
        environmentCompatible(exercise, profile.environment) &&
        levelCompatible(exercise, profile.level) &&
        !profile.excludedExercises.some((name) => exercise.name.toLowerCase().includes(name.toLowerCase()))
      ),
    )
    .filter((value): value is Exercise => Boolean(value));
}
