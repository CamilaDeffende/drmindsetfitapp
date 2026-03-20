import { TrainingEnvironment } from "./enums";
import { EQUIPMENT_SCORE_BY_ENVIRONMENT } from "./constants";
import { avg, clamp } from "./utils";

export function scoreEnvironmentCompatibility(environment: TrainingEnvironment, factors: number[] = [1]): number {
  return clamp(avg(factors) * (EQUIPMENT_SCORE_BY_ENVIRONMENT[environment] ?? 1), 0, 1);
}
