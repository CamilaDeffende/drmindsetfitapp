import { ActivityIntensity } from "./types";

export function calcPAL(freqPerWeek: number, intensity: ActivityIntensity): number {
  const f = Math.max(0, Math.min(7, Math.round(freqPerWeek)));

  if (f === 0) return 1.2;

  if (f <= 2) {
    if (intensity === "leve") return 1.375;
    if (intensity === "moderada") return 1.45;
    return 1.5;
  }

  if (f <= 4) {
    if (intensity === "leve") return 1.45;
    if (intensity === "moderada") return 1.55;
    return 1.65;
  }

  if (f <= 6) {
    if (intensity === "leve") return 1.55;
    if (intensity === "moderada") return 1.7;
    return 1.8;
  }

  if (intensity === "leve") return 1.7;
  if (intensity === "moderada") return 1.85;
  return 2.05; // default conservador dentro de 1.95–2.2
}
