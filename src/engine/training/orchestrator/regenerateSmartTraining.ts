import { TrainingPlan } from "../core/types";
import { generateSmartTraining } from "./generateSmartTraining";

export function regenerateSmartTraining(source?: unknown, previousVersion = 1): TrainingPlan {
  const next = generateSmartTraining(source);
  return {
    ...next.plan,
    version: previousVersion + 1,
  };
}
