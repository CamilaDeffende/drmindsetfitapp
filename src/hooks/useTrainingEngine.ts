import { generateSmartTraining } from "@/engine/training/orchestrator/generateSmartTraining";
import {
  loadSmartTrainingPlan,
  saveSmartTrainingPlan,
} from "@/services/training/trainingEngine.storage";
import { useTrainingEngineStore } from "@/store/trainingEngineStore";

export function useTrainingEngine() {
  const { currentPlan, setCurrentPlan, setLastDecision } = useTrainingEngineStore();

  return {
    currentPlan: currentPlan ?? loadSmartTrainingPlan(),
    generate: (input: unknown) => {
      const result = generateSmartTraining(input);
      saveSmartTrainingPlan(result.plan);
      setCurrentPlan(result.plan);
      setLastDecision(null);
      return result;
    },
  };
}
