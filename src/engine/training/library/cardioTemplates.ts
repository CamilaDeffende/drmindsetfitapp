import { CardioPrescription } from "../core/types";

export const CARDIO_TEMPLATES: Record<string, CardioPrescription> = {
  hybrid: {
    modality: "zone2_or_intervals",
    frequencyPerWeek: 2,
    durationMin: 20,
    intensity: "moderate",
  },
  fatLoss: {
    modality: "zone2",
    frequencyPerWeek: 3,
    durationMin: 25,
    intensity: "moderate",
  },
  default: {
    modality: "walk_or_bike",
    frequencyPerWeek: 2,
    durationMin: 20,
    intensity: "light_moderate",
  },
};
