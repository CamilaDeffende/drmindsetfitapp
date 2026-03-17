import { TrainingEnvironment } from "./enums";
import { EQUIPMENT_SCORE_BY_ENVIRONMENT } from "./constants";
import { avg, clamp } from "./utils";

export function computeRecoveryScore(params: {
  sleepQualityScore: number;
  stressLevelScore: number;
  dailyEnergyScore: number;
  recoveryPerceptionScore: number;
}): number {
  const stressInverted = 6 - params.stressLevelScore;
  return clamp(avg([params.sleepQualityScore, stressInverted, params.dailyEnergyScore, params.recoveryPerceptionScore]) * 20, 20, 100);
}

export function computeAdherenceScore(params: {
  availableDays: number;
  sessionDurationMin: number;
  trainingExperienceMonths: number;
  monthsDetrained: number;
}): number {
  const daysScore = Math.min(params.availableDays * 15, 45);
  const durationScore = params.sessionDurationMin >= 35 ? 25 : 15;
  const experienceScore = Math.min(params.trainingExperienceMonths / 2, 20);
  const detrainedPenalty = Math.min(params.monthsDetrained * 2, 20);
  return clamp(daysScore + durationScore + experienceScore - detrainedPenalty + 20, 20, 100);
}

export function computeTimeConstraintScore(sessionDurationMin: number): number {
  if (sessionDurationMin <= 35) return 90;
  if (sessionDurationMin <= 45) return 70;
  if (sessionDurationMin <= 60) return 45;
  return 20;
}

export function computeComplexityToleranceScore(trainingExperienceMonths: number, monthsDetrained: number): number {
  return clamp(trainingExperienceMonths * 2 - monthsDetrained * 3 + 20, 10, 100);
}

export function computeEquipmentTierScore(environment: TrainingEnvironment): number {
  return EQUIPMENT_SCORE_BY_ENVIRONMENT[environment];
}
