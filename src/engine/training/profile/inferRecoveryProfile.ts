import { RecoveryLevel } from "../core/enums";

export function inferRecoveryProfile(score: number): RecoveryLevel {
  if (score >= 4) return RecoveryLevel.HIGH;
  if (score >= 2.75) return RecoveryLevel.MODERATE;
  return RecoveryLevel.LOW;
}
