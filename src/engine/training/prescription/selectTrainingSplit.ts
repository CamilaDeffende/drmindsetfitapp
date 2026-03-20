import { SPLIT_PRIORITY_BY_DAYS } from "../core/constants";
import { TrainingGoal, TrainingSplitType } from "../core/enums";
import { TrainingProfile } from "../core/types";

export function selectTrainingSplit(profile: TrainingProfile): TrainingSplitType {
  const ordered = SPLIT_PRIORITY_BY_DAYS[profile.weeklyDays] ?? SPLIT_PRIORITY_BY_DAYS[3];

  if (profile.goal === TrainingGoal.STRENGTH && profile.weeklyDays >= 4) {
    return TrainingSplitType.UPPER_LOWER;
  }

  if (profile.weeklyDays <= 3) {
    return TrainingSplitType.FULL_BODY;
  }

  return ordered[0] ?? TrainingSplitType.FULL_BODY;
}
