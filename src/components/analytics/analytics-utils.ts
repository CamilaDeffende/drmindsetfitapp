import { subDays } from "date-fns";
import type { WorkoutRecord } from "@/services/history/HistoryService";

export type MetricAgg = {
  total: number;
  count: number;
  avg: number;
};

export type AnalyticsSummary = {
  days: number;
  count: number;
  totalDurationS: number;
  totalDistanceM: number;
  totalCaloriesKcal: number;
  avgPSE: MetricAgg;
  avgHeartRate: MetricAgg;
  byType: Record<string, number>;
};

const toNum = (v: any): number | null => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

export const pickTs = (w: any): number => {
  const ts = toNum(w?.ts);
  if (ts) return ts;
  const iso = String(w?.dateIso ?? "");
  const d = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(d) ? d : Date.now();
};

export const pickDurationS = (w: any): number => {
  const s = toNum(w?.durationS);
  if (s != null) return Math.max(0, s);
  const min = toNum(w?.durationMin);
  if (min != null) return Math.max(0, Math.round(min * 60));
  return 0;
};

export const pickDistanceM = (w: any): number => {
  const m = toNum(w?.distanceM);
  if (m != null) return Math.max(0, m);
  const km = toNum(w?.distanceKm);
  if (km != null) return Math.max(0, km * 1000);
  return 0;
};

export const pickCaloriesKcal = (w: any): number => {
  const kcal = toNum(w?.caloriesKcal);
  if (kcal != null) return Math.max(0, kcal);
  const legacy = toNum(w?.calories);
  if (legacy != null) return Math.max(0, legacy);
  return 0;
};

export const pickPSE = (w: any): number | null => {
  const p = toNum(w?.pse);
  return p == null ? null : Math.max(0, Math.min(10, p));
};

export const pickAvgHR = (w: any): number | null => {
  const hr = toNum(w?.avgHeartRate ?? w?.averageHeartRate);
  return hr == null ? null : Math.max(0, hr);
};

export const normalizeType = (w: any): string => {
  const raw = String(w?.type ?? w?.modality ?? "other").toLowerCase();
  // aceita legado PT + novo
  if (raw === "corrida") return "run";
  if (raw === "ciclismo") return "bike";
  if (raw === "musculacao") return "gym";
  if (raw === "outro") return "other";
  return raw;
};

export const filterByDays = (workouts: WorkoutRecord[], days: number): WorkoutRecord[] => {
  const since = subDays(new Date(), Math.max(1, days)).getTime();
  return (workouts ?? [])
    .filter((w: any) => pickTs(w) >= since)
    .sort((a: any, b: any) => pickTs(b) - pickTs(a));
};

const metricAgg = (vals: Array<number | null | undefined>): MetricAgg => {
  const xs = vals.map((v) => (typeof v === "number" && Number.isFinite(v) ? v : null)).filter((v): v is number => v != null);
  const total = xs.reduce((a, b) => a + b, 0);
  const count = xs.length;
  const avg = count ? total / count : 0;
  return { total, count, avg };
};

export const summarize = (workoutsAll: WorkoutRecord[], days: number): AnalyticsSummary => {
  const workouts = filterByDays(workoutsAll, days);

  const byType: Record<string, number> = {};
  let totalDurationS = 0;
  let totalDistanceM = 0;
  let totalCaloriesKcal = 0;

  const pses: Array<number | null> = [];
  const hrs: Array<number | null> = [];

  for (const w of workouts as any[]) {
    const t = normalizeType(w);
    byType[t] = (byType[t] ?? 0) + 1;

    totalDurationS += pickDurationS(w);
    totalDistanceM += pickDistanceM(w);
    totalCaloriesKcal += pickCaloriesKcal(w);

    pses.push(pickPSE(w));
    hrs.push(pickAvgHR(w));
  }

  return {
    days,
    count: workouts.length,
    totalDurationS,
    totalDistanceM,
    totalCaloriesKcal,
    avgPSE: metricAgg(pses),
    avgHeartRate: metricAgg(hrs),
    byType,
  };
};

// MF_ANALYTICS_EXPORT_ALIAS_V1
export const summarizeWorkouts = summarize;
