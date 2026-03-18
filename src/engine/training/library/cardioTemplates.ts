import { CardioPrescription } from "../core/types";

export const CARDIO_TEMPLATES: Record<string, CardioPrescription[]> = {
  fat_loss: [
    { type: "steady", modality: "walking", minutes: 25, rationale: "aumentar gasto sem destruir recuperação" },
    { type: "steady", modality: "stationary_bike", minutes: 20, rationale: "low impact complementar" },
  ],
  hybrid: [
    { type: "interval", modality: "outdoor_run_intervals", minutes: 18, rationale: "condicionamento com interferência controlada" },
  ],
};
