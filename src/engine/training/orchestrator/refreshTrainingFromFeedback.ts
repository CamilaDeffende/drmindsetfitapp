import { applyAdaptiveAdjustments } from "../adaptation/applyAdaptiveAdjustments";
import { adaptTrainingPlan } from "../adaptation/adaptTrainingPlan";
import { TrainingFeedbackInput, TrainingPlan } from "../core/types";
import { validateTrainingPlan } from "../validation/validateTrainingPlan";
import {
  appendTrainingDecision,
  saveSmartTrainingPlan,
} from "../../../services/training/trainingEngine.storage";

export function refreshTrainingFromFeedback(plan: TrainingPlan, feedback: TrainingFeedbackInput) {
  const result = adaptTrainingPlan(plan, feedback);
  const adaptedPlan = applyAdaptiveAdjustments(result.plan, result.decision);
  const validation = validateTrainingPlan(adaptedPlan);

  const persistedDecision = {
    id: `decision-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actions: result.decision.actions.map(String),
    recommendedLoadAdjustmentPct: result.decision.recommendedLoadAdjustmentPct,
    recommendedVolumeAdjustmentPct: result.decision.recommendedVolumeAdjustmentPct,
    confidence: result.decision.confidence,
    rationale: result.decision.rationale,
  };

  appendTrainingDecision(persistedDecision);
  saveSmartTrainingPlan(adaptedPlan);

  return {
    plan: adaptedPlan,
    decision: result.decision,
    validation,
  };
}
