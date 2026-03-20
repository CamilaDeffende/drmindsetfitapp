import { ProgressionType, TrainingLevel } from "../core/enums";
import { ProgressionModel, TrainingProfile } from "../core/types";

export function buildProgressionModel(profile: TrainingProfile): ProgressionModel {
  if (profile.level === TrainingLevel.BEGINNER || profile.level === TrainingLevel.BEGINNER_RETURNING) {
    return { type: ProgressionType.DOUBLE_PROGRESSION, notes: ["priorizar técnica", "subir reps antes da carga"] };
  }
  if (profile.level === TrainingLevel.INTERMEDIATE) {
    return { type: ProgressionType.LOAD_PROGRESSION, notes: ["microprogressão semanal quando aderência sustentar"] };
  }
  return { type: ProgressionType.DENSITY, notes: ["controle fino de estímulo", "ajuste por fadiga e recuperação"] };
}
