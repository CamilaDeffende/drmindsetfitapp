import { TrainingFeedbackEntry } from "../core/types";

export function calculateAdherenceTrend(history: TrainingFeedbackEntry[]): number {
  if (!history.length) return 70;
  const completed = history.filter((item) => item.completed).length;
  return Math.round((completed / history.length) * 100);
}
