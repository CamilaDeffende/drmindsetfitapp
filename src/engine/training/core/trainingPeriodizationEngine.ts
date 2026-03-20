import type {
  MicrocycleDecision,
  MicrocycleDecisionInput,
} from "./trainingMetrics.types";

function round(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function decideMicrocycleAdjustments(
  input: MicrocycleDecisionInput
): MicrocycleDecision {
  const rationale: string[] = [];
  const { loadMetrics, readinessTrend, adherencePrediction, consecutiveHardWeeks } = input;

  let score = 100;
  let deloadRecommended = false;
  let volumeAdjustmentPct = 0;
  let intensityAdjustmentPct = 0;
  let progressionFactor = 1.03;

  if (loadMetrics.loadRatio > 1.3) {
    score -= 12;
    rationale.push("Acute:chronic load ratio elevado.");
  }

  if (loadMetrics.monotony >= 2) {
    score -= 10;
    rationale.push("Monotonia elevada na semana.");
  }

  if (loadMetrics.strain >= 4500) {
    score -= 15;
    rationale.push("Strain semanal alto.");
  }

  if (readinessTrend.declining) {
    score -= 18;
    rationale.push("Tendência de readiness em queda.");
  }

  if (readinessTrend.current <= 5) {
    score -= 12;
    rationale.push("Readiness atual baixo.");
  }

  if (adherencePrediction.band === "low") {
    score -= 18;
    rationale.push("Baixa aderência prevista.");
  } else if (adherencePrediction.band === "moderate") {
    score -= 8;
    rationale.push("Aderência apenas moderada.");
  }

  if (consecutiveHardWeeks >= 3) {
    score -= 15;
    rationale.push("Acúmulo de semanas duras consecutivas.");
  }

  if (
    loadMetrics.strain >= 4500 ||
    readinessTrend.current <= 5 ||
    (readinessTrend.declining && consecutiveHardWeeks >= 3) ||
    score <= 55
  ) {
    deloadRecommended = true;
    volumeAdjustmentPct = -35;
    intensityAdjustmentPct = -10;
    progressionFactor = 0.96;
    rationale.push("Deload recomendado para restaurar recuperação.");
  } else if (score <= 72) {
    volumeAdjustmentPct = -10;
    intensityAdjustmentPct = -4;
    progressionFactor = 1.00;
    rationale.push("Manter semana controlada com redução leve.");
  } else if (score >= 88 && adherencePrediction.band === "high") {
    volumeAdjustmentPct = 4;
    intensityAdjustmentPct = 2;
    progressionFactor = 1.04;
    rationale.push("Cenário favorável para progressão conservadora.");
  } else {
    volumeAdjustmentPct = 0;
    intensityAdjustmentPct = 0;
    progressionFactor = 1.02;
    rationale.push("Progressão neutra e sustentável.");
  }

  return {
    microcycleScore: round(Math.max(0, Math.min(100, score))),
    deloadRecommended,
    progressionFactor: round(progressionFactor, 3),
    volumeAdjustmentPct,
    intensityAdjustmentPct,
    rationale,
  };
}
