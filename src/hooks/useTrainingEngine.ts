import { generateSmartTraining } from "@/engine/training/orchestrator/generateSmartTraining";
import { useTrainingEngineStore } from "@/store/trainingEngineStore";

export function useTrainingEngine() {
  const { currentPlan, setCurrentPlan } = useTrainingEngineStore();

  return {
    currentPlan,
    generate: (input: unknown) => {
      const result = generateSmartTraining(input);
      setCurrentPlan(result.plan);
      return result;
    },
  };
}
