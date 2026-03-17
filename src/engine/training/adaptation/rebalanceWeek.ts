import { TrainingPlan } from "../core/types";

export function rebalanceWeek(plan: TrainingPlan): TrainingPlan {
  return {
    ...plan,
    rationale: [...plan.rationale, "semana reequilibrada após feedback"],
  };
}
