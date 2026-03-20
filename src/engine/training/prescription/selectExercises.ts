import { SessionFocus, MovementPattern } from "../core/enums";
import { ExerciseDefinition, TrainingProfile } from "../core/types";
import { EXERCISES } from "../library/exercises";

function compatible(exercise: ExerciseDefinition, profile: TrainingProfile): boolean {
  if (profile.equipmentProfile === "BODYWEIGHT") {
    return exercise.equipmentTags.includes("bodyweight") || exercise.homeFriendly === true;
  }

  if (profile.equipmentProfile === "BASIC_HOME") {
    return exercise.equipmentTags.some((tag) => ["bodyweight", "dumbbell", "bench", "bike", "kettlebell"].includes(tag));
  }

  return true;
}

export function selectExercises(focus: SessionFocus, profile: TrainingProfile): ExerciseDefinition[] {
  const pool = EXERCISES.filter((item) => compatible(item, profile));

  const byFocus: Record<SessionFocus, MovementPattern[]> = {
    FULL_BODY: [MovementPattern.SQUAT, MovementPattern.HORIZONTAL_PUSH, MovementPattern.HORIZONTAL_PULL, MovementPattern.HINGE, MovementPattern.CORE],
    UPPER: [MovementPattern.HORIZONTAL_PUSH, MovementPattern.HORIZONTAL_PULL, MovementPattern.VERTICAL_PUSH, MovementPattern.VERTICAL_PULL, MovementPattern.CORE],
    LOWER: [MovementPattern.SQUAT, MovementPattern.HINGE, MovementPattern.LUNGE, MovementPattern.CORE],
    PUSH: [MovementPattern.HORIZONTAL_PUSH, MovementPattern.VERTICAL_PUSH, MovementPattern.CORE],
    PULL: [MovementPattern.HORIZONTAL_PULL, MovementPattern.VERTICAL_PULL, MovementPattern.CORE],
    LEGS: [MovementPattern.SQUAT, MovementPattern.HINGE, MovementPattern.LUNGE, MovementPattern.CORE],
    POSTERIOR_CHAIN: [MovementPattern.HINGE, MovementPattern.HORIZONTAL_PULL, MovementPattern.CORE],
    CONDITIONING: [MovementPattern.CARDIO, MovementPattern.CORE],
    RECOVERY: [MovementPattern.CORE, MovementPattern.CARDIO],
  };

  const targets = byFocus[focus] ?? byFocus.FULL_BODY;
  return targets
    .map((pattern) => pool.find((item) => item.movementPattern === pattern))
    .filter(Boolean) as ExerciseDefinition[];
}
