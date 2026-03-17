import { TrainingLevel, TrainingSplit } from "../core/enums";
import { TrainingProfile } from "../core/types";

export function selectTrainingSplit(profile: TrainingProfile): TrainingSplit {
  if (profile.availableDays <= 2) {
    return profile.timeConstraintScore >= 70 ? TrainingSplit.MINIMALIST_2X : TrainingSplit.FULL_BODY_2X;
  }
  if (profile.availableDays === 3) {
    return profile.hybridCandidate ? TrainingSplit.HYBRID_3X : TrainingSplit.FULL_BODY_3X;
  }
  if (profile.availableDays === 4) {
    return profile.hybridCandidate ? TrainingSplit.HYBRID_4X : TrainingSplit.UPPER_LOWER_4X;
  }
  if (profile.availableDays >= 5 && profile.level === TrainingLevel.ADVANCED) {
    return TrainingSplit.PUSH_PULL_LEGS_6X;
  }
  return TrainingSplit.ABCD_4X;
}
