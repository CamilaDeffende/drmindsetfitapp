import { SafetySeverity, TrainingSplit } from "../core/enums";
import { SafetyFlag, TrainingPlan } from "../core/types";

export function validateSplitCoherence(plan: TrainingPlan): SafetyFlag[] {
  const flags: SafetyFlag[] = [];
  if (plan.split === TrainingSplit.MINIMALIST_2X && plan.sessions.length !== 2) {
    flags.push({ code: "split_minimalist_sessions", severity: SafetySeverity.WARNING, message: "MINIMALIST_2X idealmente deve ter 2 sessões." });
  }
  if (plan.split === TrainingSplit.FULL_BODY_3X && plan.sessions.length !== 3) {
    flags.push({ code: "split_fullbody3_sessions", severity: SafetySeverity.WARNING, message: "FULL_BODY_3X idealmente deve ter 3 sessões." });
  }
  return flags;
}
