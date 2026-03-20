import { TrainingFeedbackInput, TrainingPlan } from "../core/types";
import { adaptTrainingPlan } from "../adaptation/adaptTrainingPlan";
import { validateTrainingPlan } from "../validation/validateTrainingPlan";

export function refreshTrainingFromFeedback(plan: TrainingPlan, feedback: TrainingFeedbackInput) {
  const result = adaptTrainingPlan(plan, feedback);
  const validation = validateTrainingPlan(result.plan);

  return {
    ...result,
    validation,
  };
}
