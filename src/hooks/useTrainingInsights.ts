import { useMemo } from "react";
import { getTrainingReadinessSnapshot } from "@/services/training/trainingReadiness.service";
import {
  loadSmartTrainingPlan,
  loadTrainingDecisionLog,
} from "@/services/training/trainingEngine.storage";

export function useTrainingInsights() {
  return useMemo(() => {
    const readiness = getTrainingReadinessSnapshot();
    const currentPlan = loadSmartTrainingPlan();
    const decisions = loadTrainingDecisionLog(5);

    return {
      readiness,
      currentPlan,
      decisions,
      latestDecision: decisions[0] ?? null,
    };
  }, []);
}
