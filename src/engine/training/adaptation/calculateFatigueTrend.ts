import { TrainingFeedbackEntry } from "../core/types";

export function calculateFatigueTrend(history: TrainingFeedbackEntry[]): number {
  const values = history.map((item) => item.fatigueScore ?? 3);
  if (!values.length) return 40;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 20);
}
