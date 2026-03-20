import { TrainingFeedbackInput } from "../core/types";
import { safeNum } from "../core/utils";

export function analyzeTrainingFeedback(feedback: TrainingFeedbackInput) {
  const sessionScore = safeNum(feedback.sessionScore, 75);
  const adherencePct = safeNum(feedback.adherencePct, 85);
  const perceivedRecovery = safeNum(feedback.perceivedRecovery, 70);
  const timeConstraintMin = safeNum(feedback.timeConstraintMin, 0);

  return {
    sessionScore,
    adherencePct,
    perceivedRecovery,
    timeConstraintMin,
    flaggedExercises: feedback.flaggedExercises ?? [],
  };
}
