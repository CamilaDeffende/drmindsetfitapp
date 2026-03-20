import {
  AdherenceProfile,
  EquipmentProfile,
  RecoveryProfile,
  TrainingGoal,
  TrainingLevel,
} from "../core/enums";
import { normalizeOnboardingTrainingInput } from "../core/normalizers";
import { TrainingProfile } from "../core/types";
import { clamp } from "../core/utils";

function inferGoal(value: string): TrainingGoal {
  const v = value.toUpperCase();
  if (v.includes("HYPERT")) return TrainingGoal.HYPERTROPHY;
  if (v.includes("FAT")) return TrainingGoal.FAT_LOSS;
  if (v.includes("RECOMP")) return TrainingGoal.BODY_RECOMPOSITION;
  if (v.includes("STRENGTH")) return TrainingGoal.STRENGTH;
  if (v.includes("RUN")) return TrainingGoal.RUN_SUPPORT;
  if (v.includes("CYCL")) return TrainingGoal.CYCLING_SUPPORT;
  return TrainingGoal.GENERAL_FITNESS;
}

function inferLevel(value: string): TrainingLevel {
  const v = value.toUpperCase();
  if (v.includes("ADV")) return TrainingLevel.ADVANCED;
  if (v.includes("INTER")) return TrainingLevel.INTERMEDIATE;
  if (v.includes("NOV")) return TrainingLevel.NOVICE;
  return TrainingLevel.BEGINNER;
}

function inferRecovery(score: number): RecoveryProfile {
  if (score >= 4) return RecoveryProfile.HIGH;
  if (score >= 2.75) return RecoveryProfile.MODERATE;
  return RecoveryProfile.LOW;
}

function inferAdherence(score: number): AdherenceProfile {
  if (score >= 4) return AdherenceProfile.HIGH;
  if (score >= 2.75) return AdherenceProfile.MODERATE;
  return AdherenceProfile.LOW;
}

function inferEquipment(tags: string[]): EquipmentProfile {
  const set = new Set(tags.map((t) => t.toLowerCase()));
  if (set.has("barbell") || set.has("cable") || set.has("machine")) return EquipmentProfile.FULL_GYM;
  if (set.has("dumbbell") || set.has("bench") || set.has("bike")) return EquipmentProfile.BASIC_HOME;
  if (set.size === 0 || set.has("bodyweight")) return EquipmentProfile.BODYWEIGHT;
  return EquipmentProfile.MIXED;
}

export function buildTrainingProfile(input: unknown): TrainingProfile {
  const normalized = normalizeOnboardingTrainingInput(input);

  return {
    goal: inferGoal(normalized.objective ?? "GENERAL_FITNESS"),
    primaryGoal: inferGoal(normalized.primaryGoal ?? normalized.objective ?? "GENERAL_FITNESS"),
    level: inferLevel(normalized.experienceLevel ?? "BEGINNER"),
    recoveryProfile: inferRecovery(normalized.recoveryScore ?? 3),
    recoveryLevel: inferRecovery(normalized.recoveryScore ?? 3),
    adherenceProfile: inferAdherence(normalized.adherenceHistoryScore ?? 3),
    adherenceLevel: inferAdherence(normalized.adherenceHistoryScore ?? 3),
    equipmentProfile: inferEquipment(normalized.availableEquipment ?? []),
    weeklyDays: clamp(Number(normalized.weeklyDays ?? 3), 2, 6),
    availableDays: clamp(Number(normalized.availableDays ?? normalized.weeklyDays ?? 3), 2, 6),
    sessionDurationMin: clamp(Number(normalized.sessionDurationMin ?? 60), 20, 120),
    constraints: normalized.constraints ?? [],
    environment: normalized.environment ?? "gym",
    preferredModality: normalized.modality ?? "strength",
    cardioCompatible: true,
    hybridCandidate: (normalized.environment ?? "gym") === "hybrid" || Boolean(normalized.runningInterest) || Boolean(normalized.cyclingInterest),
  };
}
