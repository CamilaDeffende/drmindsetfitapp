import { AdherenceLevel } from "../core/enums";

export function inferAdherenceProfile(adherenceScore: number): AdherenceLevel {
  if (adherenceScore < 45) return AdherenceLevel.LOW;
  if (adherenceScore < 70) return AdherenceLevel.MEDIUM;
  return AdherenceLevel.HIGH;
}
