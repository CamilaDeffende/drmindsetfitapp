import { TrainingEnvironment, TrainingGoal } from "./enums";
import { clamp, normalizeText } from "./utils";

export function normalizeGoal(raw: unknown): TrainingGoal {
  const value = normalizeText(raw);
  if (value.includes("hipert")) return TrainingGoal.HYPERTROPHY;
  if (value.includes("emag") || value.includes("cut") || value.includes("perda")) return TrainingGoal.FAT_LOSS;
  if (value.includes("recomp")) return TrainingGoal.BODY_RECOMPOSITION;
  if (value.includes("for")) return TrainingGoal.STRENGTH;
  if (value.includes("corr")) return TrainingGoal.RUN_SUPPORT;
  if (value.includes("bike") || value.includes("cicl")) return TrainingGoal.CYCLING_SUPPORT;
  if (value.includes("retorno")) return TrainingGoal.RETURN_TO_TRAINING;
  if (value.includes("hibr")) return TrainingGoal.HYBRID_PERFORMANCE;
  return TrainingGoal.GENERAL_FITNESS;
}

export function normalizeEnvironment(raw: unknown): TrainingEnvironment {
  const value = normalizeText(raw);
  if (value.includes("academia completa") || value.includes("full gym")) return TrainingEnvironment.FULL_GYM;
  if (value.includes("academia")) return TrainingEnvironment.BASIC_GYM;
  if (value.includes("halter")) return TrainingEnvironment.HOME_DUMBBELLS;
  if (value.includes("casa")) return TrainingEnvironment.HOME_BASIC;
  if (value.includes("outdoor") || value.includes("rua")) return TrainingEnvironment.OUTDOOR;
  if (value.includes("hybrid") || value.includes("hibr")) return TrainingEnvironment.HYBRID;
  return TrainingEnvironment.BASIC_GYM;
}

export function normalizeScore(raw: unknown, fallback = 3): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return clamp(parsed, 1, 5);
}

export function normalizeDays(raw: unknown, fallback = 3): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return clamp(Math.round(parsed), 1, 7);
}

export function normalizeDuration(raw: unknown, fallback = 45): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return clamp(Math.round(parsed), 20, 120);
}
