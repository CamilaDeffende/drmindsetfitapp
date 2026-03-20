import type {
  AdherencePrediction,
  AdherencePredictionInput,
} from "./trainingMetrics.types";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function predictAdherence(input: AdherencePredictionInput): AdherencePrediction {
  const planned = Math.max(1, input.plannedSessions);
  const completionRate = clamp(input.completedSessions / planned, 0, 1);
  const readinessFactor = clamp(input.averageReadiness / 10, 0, 1);
  const durationPenalty =
    input.averageSessionDuration <= 60
      ? 1
      : input.averageSessionDuration <= 80
      ? 0.9
      : input.averageSessionDuration <= 100
      ? 0.8
      : 0.65;

  const lifestylePenalty = clamp(1 - input.lifestyleConstraintScore / 10, 0.4, 1);

  const score = round(
    (completionRate * 0.45 +
      readinessFactor * 0.30 +
      durationPenalty * 0.15 +
      lifestylePenalty * 0.10) * 100,
    2
  );

  let band: AdherencePrediction["band"] = "low";
  if (score >= 75) band = "high";
  else if (score >= 55) band = "moderate";

  const explanation =
    band === "high"
      ? "Alta probabilidade de aderência com a estrutura atual."
      : band === "moderate"
      ? "Aderência moderada. Vale simplificar volume ou duração se houver queda de consistência."
      : "Baixa aderência prevista. Reduzir fricção, volume e duração é recomendado.";

  return { score, band, explanation };
}
