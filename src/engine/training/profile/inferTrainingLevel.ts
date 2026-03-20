import { TrainingLevel } from "../core/enums";

export function inferTrainingLevel(trainingExperienceMonths = 0, monthsDetrained = 0): TrainingLevel {
  if (trainingExperienceMonths < 6 && monthsDetrained >= 3) return TrainingLevel.BEGINNER_RETURNING;
  if (trainingExperienceMonths < 6) return TrainingLevel.BEGINNER;
  if (trainingExperienceMonths < 18) return TrainingLevel.NOVICE;
  if (trainingExperienceMonths < 48) return TrainingLevel.INTERMEDIATE;
  return TrainingLevel.ADVANCED;
}
