import { useTrainingEngineStore } from "@/store/trainingEngineStore";

export function useTrainingEngine() {
  const onboardingInput = useTrainingEngineStore((state) => state.onboardingInput);
  const currentPlan = useTrainingEngineStore((state) => state.currentPlan);
  const generatePlan = useTrainingEngineStore((state) => state.generatePlan);
  const regeneratePlan = useTrainingEngineStore((state) => state.regeneratePlan);
  const adaptPlan = useTrainingEngineStore((state) => state.adaptPlan);
  const resetTrainingEngine = useTrainingEngineStore((state) => state.resetTrainingEngine);

  return {
    onboardingInput,
    currentPlan,
    generatePlan,
    regeneratePlan,
    adaptPlan,
    resetTrainingEngine,
  };
}
