import { getTrainingReadinessSnapshot } from "@/services/training/trainingReadiness.service";

export function calculateFatigueTrend(): number {
  const snapshot = getTrainingReadinessSnapshot();
  const hotspotCount = Array.isArray(snapshot.fatigueHotspots) ? snapshot.fatigueHotspots.length : 0;
  const base = snapshot.level === "low" ? 75 : snapshot.level === "moderate" ? 45 : 25;
  return Math.min(100, base + hotspotCount * 4);
}
