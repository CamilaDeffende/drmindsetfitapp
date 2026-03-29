import { MovementPattern, SessionFocus, TrainingSplit } from "../core/enums";
import { SessionTemplate } from "../core/types";

export const SESSION_TEMPLATES: SessionTemplate[] = [
  {
    split: TrainingSplit.FULL_BODY,
    focus: SessionFocus.FULL_BODY,
    requiredPatterns: [
      MovementPattern.SQUAT,
      MovementPattern.HIP_HINGE,
      MovementPattern.HORIZONTAL_PUSH,
      MovementPattern.HORIZONTAL_PULL,
      MovementPattern.LUNGE,
      MovementPattern.CORE_ANTI_EXTENSION,
      MovementPattern.CORE_ANTI_ROTATION,
    ],
    optionalPatterns: [
      MovementPattern.VERTICAL_PUSH,
      MovementPattern.VERTICAL_PULL,
      MovementPattern.CARRY,
      MovementPattern.CALF,
    ],
  },
  {
    split: TrainingSplit.UPPER_LOWER,
    focus: SessionFocus.UPPER,
    requiredPatterns: [
      MovementPattern.HORIZONTAL_PUSH,
      MovementPattern.VERTICAL_PUSH,
      MovementPattern.HORIZONTAL_PUSH,
      MovementPattern.HORIZONTAL_PULL,
      MovementPattern.VERTICAL_PULL,
      MovementPattern.CORE_ANTI_ROTATION,
      MovementPattern.CORE_ANTI_EXTENSION,
    ],
    optionalPatterns: [
      MovementPattern.CARRY,
      MovementPattern.VERTICAL_PUSH,
    ],
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
      MovementPattern.CORE_ANTI_ROTATION,
    ],
    optionalPatterns: [
      MovementPattern.KNEE_FLEXION,
      MovementPattern.CARRY,
      MovementPattern.LUNGE,
    ],
  },
  {
    split: TrainingSplit.PUSH_PULL_LEGS,
    focus: SessionFocus.PUSH,
    requiredPatterns: [
      MovementPattern.HORIZONTAL_PUSH,
      MovementPattern.VERTICAL_PUSH,
      MovementPattern.HORIZONTAL_PUSH,
      MovementPattern.CORE_ANTI_ROTATION,
      MovementPattern.CORE_ANTI_EXTENSION,
    ],
    optionalPatterns: [MovementPattern.CARRY, MovementPattern.VERTICAL_PUSH],
  },
  {
    split: TrainingSplit.PUSH_PULL_LEGS,
    focus: SessionFocus.PULL,
    requiredPatterns: [
      MovementPattern.HORIZONTAL_PULL,
      MovementPattern.VERTICAL_PULL,
      MovementPattern.HORIZONTAL_PULL,
      MovementPattern.CORE_ANTI_ROTATION,
      MovementPattern.CORE_ANTI_EXTENSION,
    ],
    optionalPatterns: [MovementPattern.CARRY, MovementPattern.VERTICAL_PULL],
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
      MovementPattern.CORE_ANTI_EXTENSION,
    ],
    optionalPatterns: [MovementPattern.CARRY, MovementPattern.CORE_ANTI_ROTATION],
  },
  {
    split: TrainingSplit.BODY_PART,
    focus: SessionFocus.POSTERIOR_CHAIN,
    requiredPatterns: [
      MovementPattern.HIP_HINGE,
      MovementPattern.HORIZONTAL_PULL,
      MovementPattern.VERTICAL_PULL,
      MovementPattern.KNEE_FLEXION,
      MovementPattern.CORE_ANTI_EXTENSION,
      MovementPattern.CORE_ANTI_ROTATION,
    ],
    optionalPatterns: [
      MovementPattern.CARRY,
      MovementPattern.HIP_HINGE,
    ],
  },
  {
    split: TrainingSplit.BODY_PART,
    focus: SessionFocus.CONDITIONING,
    requiredPatterns: [MovementPattern.CARDIO_INTERVAL],
    optionalPatterns: [MovementPattern.CORE_ANTI_ROTATION],
  },
];
