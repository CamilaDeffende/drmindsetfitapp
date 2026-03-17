import { TrainingLevel } from "../core/enums";

export function inferTrainingLevel(trainingExperienceMonths: number, monthsDetrained: number, complexityToleranceScore: number): TrainingLevel {
  if (trainingExperienceMonths <= 0) return TrainingLevel.BEGINNER;
  if (trainingExperienceMonths < 12 && monthsDetrained >= 3) return TrainingLevel.BEGINNER_RETURNING;
  if (trainingExperienceMonths >= 36 && monthsDetrained <= 2 && complexityToleranceScore >= 60) return TrainingLevel.ADVANCED;
  if (trainingExperienceMonths >= 12) return TrainingLevel.INTERMEDIATE;
  return TrainingLevel.BEGINNER;
}
