import { ProgressionType } from "../core/enums";

export const PROGRESSION_TEMPLATES: Record<string, { type: ProgressionType; notes: string[] }> = {
  beginner: {
    type: ProgressionType.DOUBLE_PROGRESSION,
    notes: ["progredir reps antes de carga", "manter margem técnica"],
  },
  intermediate: {
    type: ProgressionType.LOAD_PROGRESSION,
    notes: ["alternar microprogressão de carga e reps"],
  },
  advanced: {
    type: ProgressionType.DENSITY,
    notes: ["controlar estímulo com densidade e gestão fina de fadiga"],
  },
};
