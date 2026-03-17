import { WeeklyTemplate } from "../core/types";
import { SESSION_TEMPLATES } from "./sessionTemplates";
import { TrainingSplit } from "../core/enums";

function bySplit(split: TrainingSplit) {
  return SESSION_TEMPLATES
    .filter((x) => x.split === split)
    .map((x) => ({
      dayIndex: x.dayIndex,
      name: x.name,
      focus: x.focus,
      requiredPatterns: x.requiredPatterns,
      targetDurationMin: x.targetDurationMin,
      targetVolume: x.volumeTarget,
    }));
}

export const WEEKLY_TEMPLATES: WeeklyTemplate[] = [
  { name: "Minimalist 2x", split: TrainingSplit.MINIMALIST_2X, days: bySplit(TrainingSplit.MINIMALIST_2X) },
  { name: "Full Body 3x", split: TrainingSplit.FULL_BODY_3X, days: bySplit(TrainingSplit.FULL_BODY_3X) },
  { name: "Upper Lower 4x", split: TrainingSplit.UPPER_LOWER_4X, days: bySplit(TrainingSplit.UPPER_LOWER_4X) },
  { name: "Hybrid 4x", split: TrainingSplit.HYBRID_4X, days: bySplit(TrainingSplit.HYBRID_4X) },
];
