import { AdherenceLevel } from "../core/enums";

export function inferAdherenceProfile(score: number): AdherenceLevel {
  if (score >= 4) return AdherenceLevel.HIGH;
  if (score >= 2.75) return AdherenceLevel.MODERATE;
  return AdherenceLevel.LOW;
}
