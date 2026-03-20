import { refreshTrainingFromFeedback } from "@/engine/training/orchestrator/refreshTrainingFromFeedback";
import { TrainingFeedbackInput } from "@/engine/training/core/types";
import { saveSmartTrainingPlan } from "@/services/training/trainingEngine.storage";
import { useTrainingEngineStore } from "@/store/trainingEngineStore";

export function useTrainingFeedback() {
  const { currentPlan, setCurrentPlan, setLastDecision } = useTrainingEngineStore();

  return {
    applyFeedback: (feedback: TrainingFeedbackInput) => {
      if (!currentPlan) return null;
      const result = refreshTrainingFromFeedback(currentPlan, feedback);
      saveSmartTrainingPlan(result.plan);
      setCurrentPlan(result.plan);
      setLastDecision(result.decision);
      return result;
    },
  };
}
