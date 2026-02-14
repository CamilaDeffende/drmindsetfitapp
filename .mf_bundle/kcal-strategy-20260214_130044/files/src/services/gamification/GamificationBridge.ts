import { historyService } from "@/services/history/HistoryService";
import { achievementsService } from "@/services/gamification/AchievementsService";
import { levelSystem } from "@/services/gamification/LevelSystem";

export type GamificationEvent = "workout" | "measurement" | "nutrition";

export function mfBuildUserStats() {
  const hs: any = historyService as any;

  const workouts = (hs.getWorkouts?.() ?? hs.workouts ?? []) as any[];
  const measurements = (hs.getMeasurements?.() ?? hs.measurements ?? []) as any[];
  const nutritionLogs = (hs.getAllNutritionLogs?.() ?? (hs as any).getNutrition?.() ?? (hs as any).nutrition ?? []) as any[];
  const totalNutritionLogs = nutritionLogs.length;
  const totalWorkouts = workouts.length;

  const totalCalories = workouts.reduce((s: number, w: any) => {
    const v = Number(w.caloriesBurned ?? w.calories ?? 0) || 0;
    return s + v;
  }, 0);

  const totalDistanceKm = workouts.reduce((s: number, w: any) => {
    const m = Number(w.distanceMeters ?? 0) || 0;
    return s + (m / 1000);
  }, 0);

  let totalWeightLostKg = 0;
  const weights = measurements
    .map((m: any) => Number(m.weightKg ?? m.weight ?? NaN))
    .filter((n: number) => Number.isFinite(n));

  if (weights.length >= 2) {
    const first = weights[0];
    const last = weights[weights.length - 1];
    totalWeightLostKg = Math.max(0, first - last);
  }

  const days = new Set(
    workouts
      .map((w: any) => String(w.date ?? w.startTime ?? "").slice(0, 10))
      .filter(Boolean)
  );
  const consecutiveDays = Math.min(days.size, 30);

  return {
    totalWorkouts,
    totalDistanceKm,
    totalCalories,
    totalWeightLostKg,
    consecutiveDays,
    totalNutritionLogs,
  };
}

export function mfApplyGamification(event: GamificationEvent, payload?: any) {
  const stats = mfBuildUserStats();

  // Achievements + XP (sem quebrar caso alguma API mude)
  (achievementsService as any).evaluate?.(stats);

  const xpByEvent: Record<GamificationEvent, number> = {
    workout: 25,
    measurement: 10,
    nutrition: 10,
  };
  (levelSystem as any).addXP?.(xpByEvent[event] ?? 0);

  return {
    stats,
    progress: (achievementsService as any).getProgress?.(),
    level: (levelSystem as any).getProgress?.(),
    payload,
  };
}
