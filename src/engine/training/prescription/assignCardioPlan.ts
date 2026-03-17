import { CardioPrescription, TrainingProfile } from "../core/types";
import { TrainingGoal } from "../core/enums";
import { CARDIO_TEMPLATES } from "../library/cardioTemplates";

export function assignCardioPlan(profile: TrainingProfile): CardioPrescription[] | undefined {
  if (!profile.cardioCompatible && profile.primaryGoal !== TrainingGoal.FAT_LOSS) return undefined;
  if (profile.hybridCandidate) return CARDIO_TEMPLATES.hybrid;
  if (profile.primaryGoal === TrainingGoal.FAT_LOSS || profile.primaryGoal === TrainingGoal.BODY_RECOMPOSITION) {
    return CARDIO_TEMPLATES.fat_loss;
  }
  return undefined;
}
