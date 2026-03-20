import { OnboardingTrainingInput } from "../core/types";

export function inferGoalProfile(input: OnboardingTrainingInput): string[] {
  const notes = [`objetivo principal: ${input.primaryGoal ?? input.objective ?? "GENERAL_FITNESS"}`];
  if (input.runningInterest || input.cyclingInterest || input.cardioInterest) notes.push("há interesse cardiovascular");
  if (input.primaryGoal && input.primaryGoal === input.secondaryGoal && input.secondaryGoal) notes.push("objetivos coincidentes");
  return notes;
}
