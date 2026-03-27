import { MovementPattern, SessionFocus, TrainingSplit } from "../core/enums";
import { SessionTemplate } from "../core/types";

export const SESSION_TEMPLATES: SessionTemplate[] = [
  {
    split: TrainingSplit.FULL_BODY,
    focus: SessionFocus.FULL_BODY,
    requiredPatterns: [
      MovementPattern.SQUAT,
      MovementPattern.HORIZONTAL_PUSH,
      MovementPattern.HORIZONTAL_PULL,
      MovementPattern.CORE_ANTI_EXTENSION,
    ],
    optionalPatterns: [
      MovementPattern.HIP_HINGE,
      MovementPattern.LUNGE,
      MovementPattern.CARRY,
    ],
  },
  {
    split: TrainingSplit.UPPER_LOWER,
    focus: SessionFocus.UPPER,
    requiredPatterns: [
      MovementPattern.HORIZONTAL_PUSH,
      MovementPattern.VERTICAL_PUSH,
      MovementPattern.HORIZONTAL_PULL,
      MovementPattern.VERTICAL_PULL,
      MovementPattern.CORE_ANTI_ROTATION,
    ],
    optionalPatterns: [MovementPattern.CORE_ANTI_EXTENSION],
  },
  {
    split: TrainingSplit.UPPER_LOWER,
    focus: SessionFocus.LOWER,
    requiredPatterns: [
      MovementPattern.SQUAT,
      MovementPattern.HIP_HINGE,
      MovementPattern.LUNGE,
      MovementPattern.CALF,
      MovementPattern.CORE_ANTI_EXTENSION,
    ],
    optionalPatterns: [MovementPattern.CARRY],
  },
  {
    split: TrainingSplit.PUSH_PULL_LEGS,
    focus: SessionFocus.PUSH,
    requiredPatterns: [
      MovementPattern.HORIZONTAL_PUSH,
      MovementPattern.VERTICAL_PUSH,
      MovementPattern.HORIZONTAL_PUSH,
      MovementPattern.CORE_ANTI_ROTATION,
    ],
    optionalPatterns: [MovementPattern.CORE_ANTI_EXTENSION, MovementPattern.CARRY],
  },
  {
    split: TrainingSplit.PUSH_PULL_LEGS,
    focus: SessionFocus.PULL,
    requiredPatterns: [
      MovementPattern.HORIZONTAL_PULL,
      MovementPattern.VERTICAL_PULL,
      MovementPattern.HORIZONTAL_PULL,
      MovementPattern.CORE_ANTI_ROTATION,
    ],
    optionalPatterns: [MovementPattern.CARRY, MovementPattern.CORE_ANTI_EXTENSION],
  },
  {
    split: TrainingSplit.PUSH_PULL_LEGS,
    focus: SessionFocus.LEGS,
    requiredPatterns: [
      MovementPattern.SQUAT,
      MovementPattern.HIP_HINGE,
      MovementPattern.LUNGE,
      MovementPattern.KNEE_FLEXION,
      MovementPattern.CALF,
    ],
    optionalPatterns: [MovementPattern.CORE_ANTI_EXTENSION, MovementPattern.CARRY],
  },
  {
    split: TrainingSplit.BODY_PART,
    focus: SessionFocus.CONDITIONING,
    requiredPatterns: [MovementPattern.CARDIO_INTERVAL],
    optionalPatterns: [MovementPattern.CORE_ANTI_ROTATION],
  },
];
