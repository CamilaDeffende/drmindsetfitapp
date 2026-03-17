import { mapOnboardingToTrainingInput } from "../profile/mapOnboardingToTrainingInput";
import { buildTrainingProfile } from "../profile/buildTrainingProfile";
import { generateTrainingPlan } from "../prescription/generateTrainingPlan";
import { OnboardingTrainingInput, TrainingPlan } from "../core/types";

export function generateSmartTraining(source?: unknown): TrainingPlan {
  const input: OnboardingTrainingInput = mapOnboardingToTrainingInput(source);
  const profile = buildTrainingProfile(input);
  return generateTrainingPlan(profile);
}
