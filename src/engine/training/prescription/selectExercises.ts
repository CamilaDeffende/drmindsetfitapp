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

function buildSelectionSeed(focus: SessionFocus, profile: TrainingProfile, dayIndex: number) {
  return [
    focus,
    profile.goal,
    profile.level,
    profile.equipmentProfile,
    profile.weeklyDays,
    profile.sessionDurationMin,
    dayIndex,
  ].join("|");
}

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function selectExercises(
  focus: SessionFocus,
  profile: TrainingProfile,
  dayIndex = 0
): ExerciseDefinition[] {
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
  const usedIds = new Set<string>();

  return targets
    .map((pattern, patternIndex) => {
      const matches = pool.filter(
        (item) => item.movementPattern === pattern && !usedIds.has(item.id)
      );

      if (!matches.length) return null;

      const seed = hashString(buildSelectionSeed(focus, profile, dayIndex) + `|${pattern}|${patternIndex}`);
      const pick = matches[seed % matches.length];
      usedIds.add(pick.id);
      return pick;
    })
    .filter(Boolean) as ExerciseDefinition[];
}
