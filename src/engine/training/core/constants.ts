import { TrainingEnvironment, TrainingGoal, TrainingLevel, TrainingSplitType } from "./enums";

export const DEFAULT_AVAILABLE_DAYS = 3;
export const DEFAULT_SESSION_DURATION_MIN = 60;
export const MIN_SESSION_DURATION_MIN = 20;
export const MAX_SESSION_DURATION_MIN = 120;
export const DEFAULT_REST_SEC = 75;
export const DEFAULT_BLOCK_WEEKS = 4;

export const WEEKLY_SETS_BY_GOAL: Record<TrainingGoal, { min: number; target: number; max: number }> = {
  [TrainingGoal.HYPERTROPHY]: { min: 8, target: 14, max: 20 },
  [TrainingGoal.FAT_LOSS]: { min: 6, target: 10, max: 16 },
  [TrainingGoal.BODY_RECOMPOSITION]: { min: 8, target: 12, max: 18 },
  [TrainingGoal.STRENGTH]: { min: 6, target: 10, max: 14 },
  [TrainingGoal.GENERAL_FITNESS]: { min: 6, target: 10, max: 14 },
  [TrainingGoal.MUSCULAR_ENDURANCE]: { min: 8, target: 12, max: 18 },
  [TrainingGoal.CARDIO_CONDITIONING]: { min: 4, target: 8, max: 12 },
  [TrainingGoal.RETURN_TO_TRAINING]: { min: 4, target: 8, max: 10 },
  [TrainingGoal.HYBRID_PERFORMANCE]: { min: 6, target: 10, max: 14 },
  [TrainingGoal.RUN_SUPPORT]: { min: 4, target: 8, max: 12 },
  [TrainingGoal.CYCLING_SUPPORT]: { min: 4, target: 8, max: 12 },
};

export const LEVEL_VOLUME_MULTIPLIER: Record<TrainingLevel, number> = {
  [TrainingLevel.BEGINNER]: 0.75,
  [TrainingLevel.BEGINNER_RETURNING]: 0.72,
  [TrainingLevel.NOVICE]: 0.9,
  [TrainingLevel.INTERMEDIATE]: 1,
  [TrainingLevel.ADVANCED]: 1.05,
};

export const SPLIT_PRIORITY_BY_DAYS: Record<number, TrainingSplitType[]> = {
  2: [TrainingSplitType.FULL_BODY, TrainingSplitType.UPPER_LOWER],
  3: [TrainingSplitType.FULL_BODY, TrainingSplitType.UPPER_LOWER, TrainingSplitType.PUSH_PULL_LEGS],
  4: [TrainingSplitType.UPPER_LOWER, TrainingSplitType.PUSH_PULL_LEGS, TrainingSplitType.FULL_BODY],
  5: [TrainingSplitType.PUSH_PULL_LEGS, TrainingSplitType.UPPER_LOWER, TrainingSplitType.BODY_PART],
  6: [TrainingSplitType.PUSH_PULL_LEGS, TrainingSplitType.BODY_PART, TrainingSplitType.UPPER_LOWER],
};

export const EQUIPMENT_SCORE_BY_ENVIRONMENT: Record<TrainingEnvironment, number> = {
  [TrainingEnvironment.HOME]: 0.75,
  [TrainingEnvironment.GYM]: 1,
  [TrainingEnvironment.OUTDOOR]: 0.7,
  [TrainingEnvironment.HYBRID]: 0.9,
};
