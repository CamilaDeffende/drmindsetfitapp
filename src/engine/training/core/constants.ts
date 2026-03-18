import { TrainingEnvironment, TrainingGoal, TrainingSplit } from "./enums";

export const DEFAULT_SESSION_DURATION_MIN = 45;
export const DEFAULT_AVAILABLE_DAYS = 3;

export const GOAL_VOLUME_BASE: Record<TrainingGoal, number> = {
  [TrainingGoal.HYPERTROPHY]: 14,
  [TrainingGoal.FAT_LOSS]: 10,
  [TrainingGoal.BODY_RECOMPOSITION]: 12,
  [TrainingGoal.STRENGTH]: 10,
  [TrainingGoal.GENERAL_FITNESS]: 8,
  [TrainingGoal.MUSCULAR_ENDURANCE]: 10,
  [TrainingGoal.CARDIO_CONDITIONING]: 6,
  [TrainingGoal.RETURN_TO_TRAINING]: 8,
  [TrainingGoal.HYBRID_PERFORMANCE]: 10,
  [TrainingGoal.RUN_SUPPORT]: 8,
  [TrainingGoal.CYCLING_SUPPORT]: 8,
};

export const SPLIT_DURATION_CAP: Record<TrainingSplit, number> = {
  [TrainingSplit.FULL_BODY_2X]: 55,
  [TrainingSplit.FULL_BODY_3X]: 60,
  [TrainingSplit.UPPER_LOWER_4X]: 65,
  [TrainingSplit.PUSH_PULL_LEGS_3X]: 65,
  [TrainingSplit.PUSH_PULL_LEGS_6X]: 70,
  [TrainingSplit.ABC_3X]: 60,
  [TrainingSplit.ABCD_4X]: 60,
  [TrainingSplit.HYBRID_3X]: 60,
  [TrainingSplit.HYBRID_4X]: 60,
  [TrainingSplit.MINIMALIST_2X]: 45,
};

export const EQUIPMENT_SCORE_BY_ENVIRONMENT: Record<TrainingEnvironment, number> = {
  [TrainingEnvironment.FULL_GYM]: 100,
  [TrainingEnvironment.BASIC_GYM]: 80,
  [TrainingEnvironment.HOME_DUMBBELLS]: 60,
  [TrainingEnvironment.HOME_BASIC]: 40,
  [TrainingEnvironment.OUTDOOR]: 30,
  [TrainingEnvironment.HYBRID]: 75,
};
