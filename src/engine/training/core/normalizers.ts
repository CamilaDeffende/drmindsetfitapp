import {
  DEFAULT_AVAILABLE_DAYS,
  DEFAULT_SESSION_DURATION_MIN,
  MAX_SESSION_DURATION_MIN,
  MIN_SESSION_DURATION_MIN,
} from "./constants";
import { clamp } from "./utils";
import { OnboardingTrainingInput } from "./types";

export function normalizeDays(value: unknown): number {
  return clamp(Number(value ?? DEFAULT_AVAILABLE_DAYS), 2, 6);
}

export function normalizeDuration(value: unknown): number {
  return clamp(Number(value ?? DEFAULT_SESSION_DURATION_MIN), MIN_SESSION_DURATION_MIN, MAX_SESSION_DURATION_MIN);
}

export function normalizeEnvironment(value: unknown): string {
  const v = String(value ?? "gym").toLowerCase();
  if (["home", "casa"].includes(v)) return "home";
  if (["outdoor", "rua", "externo"].includes(v)) return "outdoor";
  if (["hybrid", "hibrido"].includes(v)) return "hybrid";
  return "gym";
}

export function normalizeGoal(value: unknown): string {
  return String(value ?? "GENERAL_FITNESS").toUpperCase();
}

export function normalizeScore(value: unknown, fallback = 3): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return clamp(n, 1, 5);
}

export function normalizeOnboardingTrainingInput(input: unknown): OnboardingTrainingInput {
  const raw = (input ?? {}) as Record<string, unknown>;

  return {
    age: Number(raw.age ?? raw.idade ?? 30),
    objective: String(raw.objective ?? raw.goal ?? raw.primaryGoal ?? "GENERAL_FITNESS"),
    primaryGoal: String(raw.primaryGoal ?? raw.objective ?? raw.goal ?? "GENERAL_FITNESS"),
    secondaryGoal: raw.secondaryGoal ? String(raw.secondaryGoal) : undefined,
    experienceLevel: String(raw.experienceLevel ?? raw.level ?? "BEGINNER"),
    weeklyDays: normalizeDays(raw.weeklyDays ?? raw.frequency),
    availableDays: normalizeDays(raw.availableDays ?? raw.weeklyDays ?? raw.frequency),
    sessionDurationMin: normalizeDuration(raw.sessionDurationMin ?? raw.timeAvailableMin),
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
    monthsDetrained: Number(raw.monthsDetrained ?? 0),
    trainingExperienceMonths: Number(raw.trainingExperienceMonths ?? 0),
    runningInterest: Boolean(raw.runningInterest ?? false),
    cyclingInterest: Boolean(raw.cyclingInterest ?? false),
    cardioInterest: Boolean(raw.cardioInterest ?? false),
  };
}
