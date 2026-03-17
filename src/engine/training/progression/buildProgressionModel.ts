import { ProgressionType, TrainingLevel } from "../core/enums";
import { ProgressionModel, TrainingProfile } from "../core/types";
import { applyDensityProgression } from "./applyDensityProgression";
import { applyDoubleProgression } from "./applyDoubleProgression";
import { applyLoadProgression } from "./applyLoadProgression";

export function buildProgressionModel(profile: TrainingProfile): ProgressionModel {
  if (profile.level === TrainingLevel.BEGINNER || profile.level === TrainingLevel.BEGINNER_RETURNING) {
    return {
      type: ProgressionType.DOUBLE_PROGRESSION,
      strategyLabel: "double progression",
      deloadEveryWeeks: 6,
      notes: [applyDoubleProgression("8-12")],
    };
  }

  if (profile.level === TrainingLevel.INTERMEDIATE) {
    return {
      type: ProgressionType.DOUBLE_PROGRESSION,
      strategyLabel: "double progression com ajuste de carga",
      deloadEveryWeeks: 5,
      notes: [applyDoubleProgression("6-10"), applyLoadProgression()],
    };
  }

  return {
    type: ProgressionType.HYBRID_SIMPLE,
    strategyLabel: "hybrid simple",
    deloadEveryWeeks: 4,
    notes: [applyLoadProgression(), applyDensityProgression()],
  };
}
