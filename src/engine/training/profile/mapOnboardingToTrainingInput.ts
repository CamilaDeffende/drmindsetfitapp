import {
  normalizeDays,
  normalizeDuration,
  normalizeEnvironment,
  normalizeGoal,
  normalizeScore,
} from "../core/normalizers";
import { DEFAULT_AVAILABLE_DAYS, DEFAULT_SESSION_DURATION_MIN } from "../core/constants";
import { OnboardingTrainingInput } from "../core/types";

function pickNumber(raw: Record<string, unknown>, keys: string[], fallback: number): number {
  for (const key of keys) {
    const value = Number(raw[key]);
    if (Number.isFinite(value)) return value;
  }
  return fallback;
}

export function mapOnboardingToTrainingInput(source: unknown): OnboardingTrainingInput {
  const raw = (source ?? {}) as Record<string, unknown>;

  return {
    age: pickNumber(raw, ["idade", "age"], 30),
    objective: normalizeGoal(raw.objective ?? raw.goal ?? raw.primaryGoal),
    primaryGoal: normalizeGoal(raw.primaryGoal ?? raw.objective ?? raw.goal),
    secondaryGoal: raw.secondaryGoal ? String(raw.secondaryGoal) : undefined,
    experienceLevel: String(raw.experienceLevel ?? raw.level ?? "BEGINNER"),
    weeklyDays: normalizeDays(raw.weeklyDays ?? raw.frequency ?? DEFAULT_AVAILABLE_DAYS),
    availableDays: normalizeDays(raw.availableDays ?? raw.weeklyDays ?? DEFAULT_AVAILABLE_DAYS),
    sessionDurationMin: normalizeDuration(raw.sessionDurationMin ?? raw.timeAvailableMin ?? DEFAULT_SESSION_DURATION_MIN),
    availableEquipment: Array.isArray(raw.availableEquipment) ? raw.availableEquipment.map(String) : [],
    constraints: Array.isArray(raw.constraints) ? raw.constraints.map(String) : [],
    limitations: Array.isArray(raw.limitations) ? raw.limitations.map(String) : [],
    painFlags: Array.isArray(raw.painFlags) ? raw.painFlags.map(String) : [],
    environment: normalizeEnvironment(raw.environment),
    modality: String(raw.modality ?? "strength"),
    sleepQualityScore: normalizeScore(raw.sleepQualityScore, 3),
    stressScore: normalizeScore(raw.stressScore, 3),
    recoveryScore: normalizeScore(raw.recoveryScore, 3),
    adherenceHistoryScore: normalizeScore(raw.adherenceHistoryScore, 3),
    monthsDetrained: pickNumber(raw, ["monthsDetrained"], 0),
    trainingExperienceMonths: pickNumber(raw, ["trainingExperienceMonths"], 0),
    runningInterest: Boolean(raw.runningInterest ?? false),
    cyclingInterest: Boolean(raw.cyclingInterest ?? false),
    cardioInterest: Boolean(raw.cardioInterest ?? false),
  };
}
