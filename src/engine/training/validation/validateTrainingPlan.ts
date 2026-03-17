import { SafetyFlag, TrainingPlan } from "../core/types";
import { validateEquipmentCompatibility } from "./validateEquipmentCompatibility";
import { validateExerciseComplexity } from "./validateExerciseComplexity";
import { validateMovementBalance } from "./validateMovementBalance";
import { validateRecoveryCompatibility } from "./validateRecoveryCompatibility";
import { validateSessionDuration } from "./validateSessionDuration";
import { validateSplitCoherence } from "./validateSplitCoherence";
import { validateVolumeCaps } from "./validateVolumeCaps";

export function validateTrainingPlan(plan: TrainingPlan): SafetyFlag[] {
  const flags: SafetyFlag[] = [
    ...validateSplitCoherence(plan),
    ...validateEquipmentCompatibility(plan),
    ...validateSessionDuration(plan),
    ...validateVolumeCaps(plan),
    ...validateExerciseComplexity(plan),
    ...validateMovementBalance(plan),
    ...validateRecoveryCompatibility(plan),
  ];

  return flags;
}
