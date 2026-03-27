import {
  normalizeDays,
  normalizeDuration,
  normalizeEnvironment,
  normalizeGoal,
  normalizeScore,
} from "../core/normalizers";
import { DEFAULT_AVAILABLE_DAYS, DEFAULT_SESSION_DURATION_MIN } from "../core/constants";
import { OnboardingTrainingInput } from "../core/types";

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function pickNumber(raw: Record<string, unknown>, keys: string[], fallback: number): number {
  for (const key of keys) {
    const value = Number(raw[key]);
    if (Number.isFinite(value)) return value;
  }
  return fallback;
}

export function mapOnboardingToTrainingInput(source: unknown): OnboardingTrainingInput {
  const raw = (source ?? {}) as Record<string, unknown>;
  const step1 = isObject(raw.step1) ? raw.step1 : {};
  const step3 = isObject(raw.step3) ? raw.step3 : {};
  const step5 = isObject(raw.step5) ? raw.step5 : {};
  const step6 = isObject(raw.step6) ? raw.step6 : {};

  const primaryModality = String(
    raw.modality ??
      step5.primary ??
      (Array.isArray(step5.modalidades) ? step5.modalidades[0] : "") ??
      "strength"
  );

  const levelFromModality =
    isObject(step5.condicionamentoPorModalidade) && primaryModality
      ? step5.condicionamentoPorModalidade[primaryModality]
      : undefined;

  const daysByModality =
    (isObject(step6.diasPorModalidade) ? step6.diasPorModalidade : undefined) ??
    (isObject(step5.diasPorModalidade) ? step5.diasPorModalidade : undefined);

  const uniqueDays = new Set<string>();
  if (isObject(daysByModality)) {
    for (const days of Object.values(daysByModality)) {
      if (!Array.isArray(days)) continue;
      for (const day of days) {
        const value = String(day ?? "").trim();
        if (value) uniqueDays.add(value);
      }
    }
  }

  const weeklyDaysValue =
    raw.weeklyDays ??
    raw.frequency ??
    (uniqueDays.size > 0 ? uniqueDays.size : undefined) ??
    step1.frequenciaSemanal ??
    DEFAULT_AVAILABLE_DAYS;

  const durationValue =
    raw.sessionDurationMin ??
    raw.timeAvailableMin ??
    step1.duracaoTreino ??
    DEFAULT_SESSION_DURATION_MIN;

  return {
    age: pickNumber({ ...step1, ...raw }, ["idade", "age"], 30),
    objective: normalizeGoal(raw.objective ?? raw.goal ?? raw.primaryGoal ?? step1.objetivo),
    primaryGoal: normalizeGoal(raw.primaryGoal ?? raw.objective ?? raw.goal ?? step1.objetivo),
    secondaryGoal: raw.secondaryGoal ? String(raw.secondaryGoal) : undefined,
    experienceLevel: String(
      raw.experienceLevel ??
        raw.level ??
        levelFromModality ??
        step1.nivelTreino ??
        "BEGINNER"
    ),
    weeklyDays: normalizeDays(weeklyDaysValue),
    availableDays: normalizeDays(raw.availableDays ?? weeklyDaysValue),
    sessionDurationMin: normalizeDuration(durationValue),
    availableEquipment: Array.isArray(raw.availableEquipment) ? raw.availableEquipment.map(String) : [],
    constraints: Array.isArray(raw.constraints) ? raw.constraints.map(String) : [],
    limitations: Array.isArray(raw.limitations) ? raw.limitations.map(String) : [],
    painFlags: Array.isArray(raw.painFlags) ? raw.painFlags.map(String) : [],
    environment: normalizeEnvironment(raw.environment ?? step3.environment),
    modality: primaryModality,
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
