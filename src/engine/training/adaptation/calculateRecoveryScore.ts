import { average } from "../core/utils";

export function calculateRecoveryScore(values: number[]): number {
  return Math.round(average(values));
}
