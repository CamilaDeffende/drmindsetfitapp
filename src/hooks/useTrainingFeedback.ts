import { refreshTrainingFromFeedback } from "@/engine/training/orchestrator/refreshTrainingFromFeedback";
import { useTrainingEngineStore } from "@/store/trainingEngineStore";
import { TrainingFeedbackInput } from "@/engine/training/core/types";

export function useTrainingFeedback() {
  const { currentPlan, setCurrentPlan, setLastDecision } = useTrainingEngineStore();

  return {
    applyFeedback: (feedback: TrainingFeedbackInput) => {
      if (!currentPlan) return null;
      const result = refreshTrainingFromFeedback(currentPlan, feedback);
      setCurrentPlan(result.plan);
      setLastDecision(result.decision);
      return result;
    },
  };
}
