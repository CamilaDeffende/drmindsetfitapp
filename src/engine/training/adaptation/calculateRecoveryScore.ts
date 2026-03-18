import { TrainingFeedbackEntry } from "../core/types";

export function calculateRecoveryScore(history: TrainingFeedbackEntry[]): number {
  const values = history.map((item) => item.recoveryScore ?? 3);
  if (!values.length) return 60;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 20);
}
