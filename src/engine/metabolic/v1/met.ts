import { ActivityIntensity, TrainingModality } from "./types";

export function getMET(modality: TrainingModality, intensity: ActivityIntensity): number {
  switch (modality) {
    case "funcional":
      if (intensity === "leve") return 3.8;
      if (intensity === "moderada") return 4.3;
      return 8.0;

    case "musculacao":
      if (intensity === "leve") return 3.5;
      if (intensity === "moderada") return 3.5;
      return 6.0;

    case "crossfit":
      if (intensity === "leve") return 5.5;
      if (intensity === "moderada") return 6.0;
      return 9.0;

    case "bike_indoor":
      if (intensity === "leve") return 3.5;
      if (intensity === "moderada") return 6.5;
      return 8.5;

    case "ciclismo_outdoor":
      if (intensity === "leve") return 8.5;
      if (intensity === "moderada") return 11.0;
      return 12.0;

    case "corrida":
      if (intensity === "leve") return 6.0;
      if (intensity === "moderada") return 9.8;
      return 11.8;

    default:
      return 3.5;
  }
}
