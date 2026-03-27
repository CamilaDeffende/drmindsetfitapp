import { buildTrainingProfile } from "../profile/buildTrainingProfile";
import { mapOnboardingToTrainingInput } from "../profile/mapOnboardingToTrainingInput";
import { generateTrainingPlan } from "../prescription/generateTrainingPlan";
import { buildTrainingBlock } from "../progression/buildTrainingBlock";
import { validateTrainingPlan } from "../validation/validateTrainingPlan";

export function generateSmartTraining(input: unknown) {
  const normalizedInput = mapOnboardingToTrainingInput(input);
  const profile = buildTrainingProfile(normalizedInput);
  const prescribed = generateTrainingPlan(profile);
  const withBlock = buildTrainingBlock(prescribed);
  const validation = validateTrainingPlan(withBlock);

  return {
    profile,
    plan: {
      ...withBlock,
      validations: validation.messages,
      warnings: validation.valid ? withBlock.warnings : [...withBlock.warnings, ...validation.messages],
    },
    validation,
  };
}
