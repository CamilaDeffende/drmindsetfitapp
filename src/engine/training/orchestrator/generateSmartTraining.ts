import { buildTrainingProfile } from "../profile/buildTrainingProfile";
import { generateTrainingPlan } from "../prescription/generateTrainingPlan";
import { buildTrainingBlock } from "../progression/buildTrainingBlock";
import { validateTrainingPlan } from "../validation/validateTrainingPlan";

export function generateSmartTraining(input: unknown) {
  const profile = buildTrainingProfile(input);
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
