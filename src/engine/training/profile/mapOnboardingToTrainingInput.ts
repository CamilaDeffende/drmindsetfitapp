import { readOnboardingDraftStorage, normalizeDraftKeys } from "@/services/ssot/onboardingDraft.bridge";
import { isRecord, asStringArray } from "../core/guards";
import { normalizeDays, normalizeDuration, normalizeEnvironment, normalizeGoal, normalizeScore } from "../core/normalizers";
import { OnboardingTrainingInput } from "../core/types";
import { DEFAULT_AVAILABLE_DAYS, DEFAULT_SESSION_DURATION_MIN } from "../core/constants";

function pickNumber(obj: Record<string, unknown>, keys: string[], fallback: number): number {
  for (const key of keys) {
    const value = Number(obj[key]);
    if (Number.isFinite(value)) return value;
  }
  return fallback;
}

function pickString(obj: Record<string, unknown>, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return fallback;
}

function pickArray(obj: Record<string, unknown>, keys: string[]): string[] {
  for (const key of keys) {
    const arr = asStringArray(obj[key]);
    if (arr.length) return arr;
  }
  return [];
}

function readRawDraft(): Record<string, unknown> {
  const storedDraft = readOnboardingDraftStorage();
  const raw = storedDraft ? normalizeDraftKeys(storedDraft) : null;
  if (isRecord(raw)) return raw;

  try {
    const fallback = window.localStorage.getItem("mf:onboarding:draft:v1");
    if (!fallback) return {};
    const parsed = JSON.parse(fallback) as unknown;
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function mapOnboardingToTrainingInput(source?: unknown): OnboardingTrainingInput {
  const raw = isRecord(source) ? source : readRawDraft();

  const preferredEnvironmentRaw =
    pickString(raw, ["ambienteTreino", "preferredEnvironment", "environment", "localTreino"], "academia");

  const primaryGoalRaw =
    pickString(raw, ["objetivo", "goal", "primaryGoal"], "geral");

  const availableDaysRaw =
    raw["diasTreino"] ?? raw["availableDays"] ?? raw["diasSemana"] ?? DEFAULT_AVAILABLE_DAYS;

  const sessionDurationRaw =
    raw["duracaoTreinoMin"] ?? raw["sessionDurationMin"] ?? raw["duracaoMin"] ?? DEFAULT_SESSION_DURATION_MIN;

  const cardioInterest = Boolean(raw["cardioInterest"] ?? raw["gostaCardio"] ?? false);
  const runningInterest = Boolean(raw["runningInterest"] ?? raw["interesseCorrida"] ?? false);
  const cyclingInterest = Boolean(raw["cyclingInterest"] ?? raw["interesseBike"] ?? false);

  return {
    age: pickNumber(raw, ["idade", "age"], 30),
    sex: pickString(raw, ["sexo", "sex"], "nao_informado"),
    heightCm: pickNumber(raw, ["altura", "heightCm", "alturaCm"], 170),
    weightKg: pickNumber(raw, ["peso", "weightKg", "pesoKg"], 70),
    primaryGoal: normalizeGoal(primaryGoalRaw),
    secondaryGoal: undefined,
    availableDays: normalizeDays(availableDaysRaw, DEFAULT_AVAILABLE_DAYS),
    sessionDurationMin: normalizeDuration(sessionDurationRaw, DEFAULT_SESSION_DURATION_MIN),
    trainingExperienceMonths: pickNumber(raw, ["experienceMonths", "trainingExperienceMonths", "tempoTreinoMeses", "experienciaMeses"], 0),
    monthsDetrained: pickNumber(raw, ["monthsDetrained", "mesesDestreinado", "tempoParadoMeses"], 0),
    preferredEnvironment: normalizeEnvironment(preferredEnvironmentRaw),
    availableEquipment: pickArray(raw, ["equipamentos", "availableEquipment"]),
    preferredModalities: pickArray(raw, ["modalidades", "preferredModalities"]),
    dislikedExercises: pickArray(raw, ["dislikedExercises", "exerciciosNaoGosta"]),
    favoriteExercises: pickArray(raw, ["favoriteExercises", "exerciciosFavoritos"]),
    sleepQualityScore: normalizeScore(raw["sonoScore"] ?? raw["sleepQualityScore"], 3),
    stressLevelScore: normalizeScore(raw["stressLevelScore"] ?? raw["estresseScore"], 3),
    dailyEnergyScore: normalizeScore(raw["dailyEnergyScore"] ?? raw["energiaScore"], 3),
    recoveryPerceptionScore: normalizeScore(raw["recoveryPerceptionScore"] ?? raw["recuperacaoScore"], 3),
    cardioInterest,
    runningInterest,
    cyclingInterest,
    bodyFocusAreas: pickArray(raw, ["bodyFocusAreas", "focosCorporais"]),
    limitations: pickArray(raw, ["limitations", "limitacoes"]),
    painFlags: pickArray(raw, ["painFlags", "dores"]),
  };
}
