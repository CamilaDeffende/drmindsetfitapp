import { FeedbackAnalysis, TrainingFeedbackEntry } from "../core/types";
import { calculateAdherenceTrend } from "./calculateAdherenceTrend";
import { calculateFatigueTrend } from "./calculateFatigueTrend";
import { calculateRecoveryScore } from "./calculateRecoveryScore";

export function analyzeTrainingFeedback(history: TrainingFeedbackEntry[]): FeedbackAnalysis {
  const recoveryTrend = calculateRecoveryScore(history);
  const fatigueTrend = calculateFatigueTrend(history);
  const adherenceTrend = calculateAdherenceTrend(history);

  const notes: string[] = [];
  if (recoveryTrend < 45) notes.push("recuperação baixa");
  if (fatigueTrend > 70) notes.push("fadiga elevada");
  if (adherenceTrend < 60) notes.push("adesão em queda");

  return {
    recoveryTrend,
    fatigueTrend,
    adherenceTrend,
    shouldReduceVolume: recoveryTrend < 45 || fatigueTrend > 70,
    shouldCompressTime: adherenceTrend < 60,
    notes,
  };
}
