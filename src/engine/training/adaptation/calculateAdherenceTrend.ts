import { getTrainingReadinessSnapshot } from "../../../services/training/trainingReadiness.service";

export function calculateAdherenceTrend(): number {
  const snapshot = getTrainingReadinessSnapshot();
  return Math.max(0, Math.min(100, snapshot.avgAdherencePct ?? 0));
}
