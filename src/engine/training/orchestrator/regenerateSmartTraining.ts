import { generateSmartTraining } from "./generateSmartTraining";
import { TrainingPlan } from "../core/types";

export function regenerateSmartTraining(source?: unknown, previousVersion = 1): TrainingPlan {
  const next = generateSmartTraining(source);
  return { ...next, version: previousVersion + 1 };
}
