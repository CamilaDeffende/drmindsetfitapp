import { TrainingFeedbackEntry, TrainingPlan } from "../core/types";
import { analyzeTrainingFeedback } from "../adaptation/analyzeTrainingFeedback";
import { adaptTrainingPlan } from "../adaptation/adaptTrainingPlan";
import { validateTrainingPlan } from "../validation/validateTrainingPlan";

export function refreshTrainingFromFeedback(plan: TrainingPlan, feedbackHistory: TrainingFeedbackEntry[]): TrainingPlan {
  const analysis = analyzeTrainingFeedback(feedbackHistory);
  const adapted = adaptTrainingPlan(plan, analysis);
  return {
    ...adapted,
    validationFlags: validateTrainingPlan(adapted),
    version: plan.version + 1,
  };
}
