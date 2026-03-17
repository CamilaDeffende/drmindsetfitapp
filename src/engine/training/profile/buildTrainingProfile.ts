import { computeAdherenceScore, computeComplexityToleranceScore, computeEquipmentTierScore, computeRecoveryScore, computeTimeConstraintScore } from "../core/scoring";
import { OnboardingTrainingInput, TrainingProfile } from "../core/types";
import { inferAdherenceProfile } from "./inferAdherenceProfile";
import { inferConstraintsProfile } from "./inferConstraintsProfile";
import { inferEquipmentProfile } from "./inferEquipmentProfile";
import { inferGoalProfile } from "./inferGoalProfile";
import { inferRecoveryProfile } from "./inferRecoveryProfile";
import { inferTrainingLevel } from "./inferTrainingLevel";

export function buildTrainingProfile(input: OnboardingTrainingInput): TrainingProfile {
  const recoveryScore = computeRecoveryScore({
    sleepQualityScore: input.sleepQualityScore,
    stressLevelScore: input.stressLevelScore,
    dailyEnergyScore: input.dailyEnergyScore,
    recoveryPerceptionScore: input.recoveryPerceptionScore,
  });

  const adherenceScore = computeAdherenceScore({
    availableDays: input.availableDays,
    sessionDurationMin: input.sessionDurationMin,
    trainingExperienceMonths: input.trainingExperienceMonths,
    monthsDetrained: input.monthsDetrained,
  });

  const timeConstraintScore = computeTimeConstraintScore(input.sessionDurationMin);
  const complexityToleranceScore = computeComplexityToleranceScore(input.trainingExperienceMonths, input.monthsDetrained);
  const equipmentTierScore = computeEquipmentTierScore(input.preferredEnvironment);

  const level = inferTrainingLevel(input.trainingExperienceMonths, input.monthsDetrained, complexityToleranceScore);
  const recoveryLevel = inferRecoveryProfile(recoveryScore);
  const adherenceLevel = inferAdherenceProfile(adherenceScore);

  const constraints = inferConstraintsProfile(input);
  const goalNotes = inferGoalProfile(input);
  const equipmentNote = inferEquipmentProfile(equipmentTierScore);

  return {
    level,
    recoveryLevel,
    adherenceLevel,
    primaryGoal: input.primaryGoal,
    secondaryGoal: input.secondaryGoal,
    environment: input.preferredEnvironment,
    availableDays: input.availableDays,
    sessionDurationMin: input.sessionDurationMin,
    equipmentTierScore,
    recoveryScore,
    adherenceScore,
    timeConstraintScore,
    complexityToleranceScore,
    cardioCompatible: input.cardioInterest || input.runningInterest || input.cyclingInterest,
    hybridCandidate: (input.cardioInterest || input.runningInterest || input.cyclingInterest) && input.availableDays >= 4,
    bodyFocusAreas: input.bodyFocusAreas,
    restrictions: constraints,
    excludedExercises: input.dislikedExercises,
    rationale: [...goalNotes, equipmentNote, `recoveryScore=${recoveryScore}`, `adherenceScore=${adherenceScore}`],
  };
}
