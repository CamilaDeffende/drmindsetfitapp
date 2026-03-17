import { RecoveryLevel } from "../core/enums";

export function inferRecoveryProfile(recoveryScore: number): RecoveryLevel {
  if (recoveryScore < 45) return RecoveryLevel.LOW;
  if (recoveryScore < 70) return RecoveryLevel.MODERATE;
  return RecoveryLevel.HIGH;
}
