#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "==> FIX_ALL_V1 (history SSOT + AI/ML compat + react unused + wearables dateIso)"

# 1) HistoryService (SSOT + compat)
mkdir -p src/services/history
cat > src/services/history/HistoryService.ts <<'TS'
export type WorkoutType =
  | "musculacao"
  | "corrida"
  | "ciclismo"
  | "crossfit"
  | "funcional"
  | "outro";

export type WorkoutRecord = {
  id: string;
  dateIso: string;
  modality: WorkoutType;
  title: string;

  durationMin?: number;
  distanceKm?: number;
  caloriesKcal?: number;
  avgHeartRate?: number;
  notes?: string;

  // compat
  type: WorkoutType;
  startTime?: string;
  durationMinutes?: number;
  caloriesBurned?: number;
  distanceMeters?: number;
  pse?: number;
};

export type BodyMeasurement = {
  dateIso: string;
  weightKg?: number;
  bodyFatPct?: number;
  waistCm?: number;
  hipCm?: number;
};

export type NutritionRecord = {
  dateIso: string;
  caloriesKcal?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
};

type HistoryDB = {
  workouts: WorkoutRecord[];
  measurements: BodyMeasurement[];
  nutrition: NutritionRecord[];
};

const LS_KEY = "mf:history:v1";

function safeJsonParse<T>(s: string | null, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}
function nowIso() {
  return new Date().toISOString();
}
function uid() {
  return "w_" + Math.random().toString(36).slice(2, 10) + "_" + Date.now().toString(36);
}
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function isoWeekKey(dateIso: string) {
  const t = Date.parse(dateIso);
  if (!Number.isFinite(t)) return "invalid";
  const d = new Date(t);
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export class HistoryService {
  private db: HistoryDB;

  constructor() {
    this.db = safeJsonParse<HistoryDB>(
      typeof window !== "undefined" ? window.localStorage.getItem(LS_KEY) : null,
      { workouts: [], measurements: [], nutrition: [] }
    );
    this.db.workouts = (this.db.workouts || []).map((w) => this.normalizeWorkout(w as any));
  }

  private persist() {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LS_KEY, JSON.stringify(this.db));
  }

  private normalizeWorkout(w: Partial<WorkoutRecord> & Record<string, any>): WorkoutRecord {
    const dateIso = String((w as any).dateIso || (w as any).startTime || (w as any).date || nowIso());
    const modality: WorkoutType = (((w as any).modality || (w as any).type || "outro") as WorkoutType);

    const durationMin =
      typeof (w as any).durationMin === "number"
        ? (w as any).durationMin
        : typeof (w as any).durationMinutes === "number"
          ? (w as any).durationMinutes
          : undefined;

    const caloriesKcal =
      typeof (w as any).caloriesKcal === "number"
        ? (w as any).caloriesKcal
        : typeof (w as any).caloriesBurned === "number"
          ? (w as any).caloriesBurned
          : undefined;

    const distanceKm =
      typeof (w as any).distanceKm === "number"
        ? (w as any).distanceKm
        : typeof (w as any).distanceMeters === "number"
          ? (w as any).distanceMeters / 1000
          : undefined;

    const pse = typeof (w as any).pse === "number" ? clamp((w as any).pse, 0, 10) : undefined;

    const rec: WorkoutRecord = {
      id: String((w as any).id || uid()),
      dateIso,
      modality,
      title: String((w as any).title || "Treino"),
      durationMin: typeof durationMin === "number" ? durationMin : undefined,
      distanceKm: typeof distanceKm === "number" ? distanceKm : undefined,
      caloriesKcal: typeof caloriesKcal === "number" ? caloriesKcal : undefined,
      avgHeartRate: typeof (w as any).avgHeartRate === "number" ? (w as any).avgHeartRate : undefined,
      notes: typeof (w as any).notes === "string" ? (w as any).notes : undefined,

      type: modality,
      startTime: dateIso,
      durationMinutes: typeof durationMin === "number" ? durationMin : undefined,
      caloriesBurned: typeof caloriesKcal === "number" ? caloriesKcal : undefined,
      distanceMeters: typeof distanceKm === "number" ? Math.round(distanceKm * 1000) : undefined,
      pse,
    };
    return rec;
  }

  getAll() { return { ...this.db }; }
  getAllWorkouts() { return this.db.workouts.slice(); }
  getWorkouts(limit = 200) { return this.db.workouts.slice(0, limit); }
  getWorkoutsByType(type: WorkoutType) { return this.db.workouts.filter((w) => w.type === type || w.modality === type); }

  getWorkoutsByDateRange(startIso: string, endIso: string) {
    const a = Date.parse(startIso);
    const b = Date.parse(endIso);
    const lo = Number.isFinite(a) ? a : -Infinity;
    const hi = Number.isFinite(b) ? b : Infinity;
    return this.db.workouts.filter((w) => {
      const t = Date.parse(w.dateIso);
      return Number.isFinite(t) && t >= lo && t <= hi;
    });
  }

  getWeightProgress(days = 120) { return this.getWeightSeries(days); }

  addWorkout(input: (Omit<WorkoutRecord, "id"> & { id?: string }) & Record<string, any>) {
    const rec = this.normalizeWorkout({ ...input, id: input.id || uid() });
    this.db.workouts.unshift(rec);
    this.persist();
    return rec;
  }

  addMeasurement(rec: BodyMeasurement) {
    this.db.measurements.unshift({ ...rec, dateIso: rec.dateIso || nowIso() });
    this.persist();
  }

  addNutrition(rec: NutritionRecord) {
    this.db.nutrition.unshift({ ...rec, dateIso: rec.dateIso || nowIso() });
    this.persist();
  }

  getMeasurements(limit = 365) { return this.db.measurements.slice(0, limit); }

  getWeightSeries(days = 60) {
    const cutoff = Date.now() - days * 86400 * 1000;
    return this.db.measurements
      .filter((m) => typeof m.weightKg === "number" && Date.parse(m.dateIso) >= cutoff)
      .map((m) => ({ dateIso: m.dateIso, weightKg: m.weightKg as number }))
      .sort((a, b) => Date.parse(a.dateIso) - Date.parse(b.dateIso));
  }

  getWorkoutWeeklyCounts(weeks = 12) {
    const cutoff = Date.now() - weeks * 7 * 86400 * 1000;
    const map = new Map<string, number>();
    for (const w of this.db.workouts) {
      const t = Date.parse(w.dateIso);
      if (!Number.isFinite(t) || t < cutoff) continue;
      const key = isoWeekKey(w.dateIso);
      map.set(key, (map.get(key) || 0) + 1);
    }
    const keys = Array.from(map.keys()).sort();
    return keys.map((k) => ({ week: k, workouts: map.get(k) || 0 }));
  }

  seedDemo(days = 35) {
    if (this.db.workouts.length > 0 || this.db.measurements.length > 0) return;
    const base = Date.now();
    let weight = 86.0;
    for (let i = days; i >= 0; i--) {
      const dt = new Date(base - i * 86400 * 1000);
      const dateIso = dt.toISOString();
      if (dt.getDay() !== 0 && dt.getDay() !== 3) {
        const isStrength = dt.getDay() % 2 === 0;
        this.addWorkout({
          dateIso,
          modality: isStrength ? "musculacao" : "corrida",
          title: isStrength ? "Treino A (Força)" : "Corrida Z2",
          durationMin: 45 + (dt.getDay() % 3) * 10,
          distanceKm: isStrength ? undefined : 5 + (dt.getDay() % 3),
          caloriesKcal: 320 + (dt.getDay() % 4) * 40,
          pse: isStrength ? 7 : 6,
        });
      }
      if ([1, 3, 5].includes(dt.getDay())) {
        weight -= 0.03;
        this.addMeasurement({ dateIso, weightKg: Math.round(weight * 10) / 10 });
      }
    }
  }
}

export const historyService = new HistoryService();
TS

# 2) Remove unused React imports (no python regex -> avoid zsh corruption)
for f in src/components/charts/WeightChart.tsx src/components/charts/WorkoutFrequencyChart.tsx src/pages/progress/ProgressPage.tsx; do
  if [[ -f "$f" ]]; then
    # remove: import React from "react";
    perl -0777 -i -pe 's/^\s*import\s+React\s+from\s+["']react["']\s*;\s*\n//m' "$f"
    # rewrite: import React, { X } from "react"; -> import { X } from "react";
    perl -0777 -i -pe 's/^\s*import\s+React\s*,\s*\{/import { /m' "$f"
  fi
done

# 3) WearablesPage: date -> dateIso
if [[ -f "src/pages/wearables/WearablesPage.tsx" ]]; then
  perl -0777 -i -pe 's/\bdate\s*:\s*/dateIso: /g' src/pages/wearables/WearablesPage.tsx
fi

# 4) Rewrite AdaptiveEngine + PredictionEngine + useAI (typed)
mkdir -p src/services/ai src/services/ml src/hooks/useAI

cat > src/services/ai/AdaptiveEngine.ts <<'TS'
import { historyService, WorkoutRecord, WorkoutType } from "@/services/history/HistoryService";

export type AdaptiveRecommendation = {
  type: "warning" | "success" | "info" | "adjustment";
  title: string;
  message: string;
  action?: { label: string; handler: () => void };
};

export type PerformanceMetrics = {
  workoutFrequency: number;
  averagePSE: number;
  recoveryScore: number;
  load7dMin: number;
  load14dMin: number;
};

function daysAgoIso(days: number) {
  return new Date(Date.now() - days * 86400 * 1000).toISOString();
}

function avg(nums: number[]) {
  return nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : 0;
}

export class AdaptiveEngine {
  getMetrics(): PerformanceMetrics {
    const end = new Date().toISOString();
    const start7 = daysAgoIso(7);
    const start14 = daysAgoIso(14);

    const w7 = historyService.getWorkoutsByDateRange(start7, end);
    const w14 = historyService.getWorkoutsByDateRange(start14, end);

    const pseVals = w7
      .map((w: WorkoutRecord) => (typeof w.pse === "number" ? w.pse : undefined))
      .filter((v: number | undefined): v is number => typeof v === "number");

    const load7 = w7
      .map((w: WorkoutRecord) => w.durationMinutes ?? w.durationMin)
      .filter((v: number | undefined): v is number => typeof v === "number")
      .reduce((s: number, n: number) => s + n, 0);

    const load14 = w14
      .map((w: WorkoutRecord) => w.durationMinutes ?? w.durationMin)
      .filter((v: number | undefined): v is number => typeof v === "number")
      .reduce((s: number, n: number) => s + n, 0);

    const avgPse = avg(pseVals);
    const loadRatio = load14 > 0 ? load7 / (load14 / 2) : 1;
    const score = Math.round(
      100 - Math.min(60, (avgPse || 0) * 6) - Math.min(30, Math.abs(1 - loadRatio) * 30)
    );

    return {
      workoutFrequency: w7.length,
      averagePSE: Math.round(avgPse * 10) / 10,
      recoveryScore: Math.max(0, Math.min(100, score)),
      load7dMin: Math.round(load7),
      load14dMin: Math.round(load14),
    };
  }

  getRecommendations(): AdaptiveRecommendation[] {
    const m = this.getMetrics();
    const recs: AdaptiveRecommendation[] = [];

    if (m.workoutFrequency < 2) {
      recs.push({ type: "info", title: "Consistência", message: "Frequência baixa nos últimos 7 dias. Mire em 3 sessões/semana." });
    } else if (m.workoutFrequency >= 4) {
      recs.push({ type: "success", title: "Ritmo forte", message: "Excelente consistência na semana. Mantenha com atenção à recuperação." });
    }

    if (m.averagePSE >= 8) {
      recs.push({ type: "warning", title: "Carga alta", message: "PSE médio alto. Considere 48–72h de ajuste ou sessão regenerativa." });
    }

    if (m.recoveryScore < 45) {
      recs.push({ type: "warning", title: "Recuperação", message: "Sinais de fadiga. Priorize sono e ajuste de volume." });
    }

    if (!recs.length) {
      recs.push({ type: "success", title: "Tudo em ordem", message: "Carga e consistência equilibradas. Progrida gradualmente." });
    }
    return recs;
  }

  suggestNextWorkout(type: WorkoutType): string {
    const hist = historyService.getWorkoutsByType(type);
    if (!hist.length) return "Plano inicial sugerido (baseado em objetivo e nível).";
    const last = hist[0];
    const lastMin = last.durationMinutes ?? last.durationMin ?? 45;
    return `Próxima sessão: +5% no volume (≈ ${Math.round(lastMin * 1.05)} min) se recuperação estiver boa.`;
  }
}

export const adaptiveEngine = new AdaptiveEngine();
TS

cat > src/services/ml/PredictionEngine.ts <<'TS'
import { historyService, WorkoutRecord, WorkoutType } from "@/services/history/HistoryService";

export type WorkoutPrediction = {
  type: WorkoutType;
  predictedDurationMin: number;
  predictedCaloriesKcal: number;
  predictedPSE: number;
  confidence: number; // 0-1
};

export type WeightPrediction = {
  predictedKgIn30d: number | null;
  r2: number | null;
};

function avg(nums: number[]) {
  return nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : 0;
}

export class PredictionEngine {
  predictWorkout(type: WorkoutType, targetDistanceKm?: number): WorkoutPrediction {
    const hist = historyService.getWorkoutsByType(type).slice(0, 40);

    const durs = hist
      .map((w: WorkoutRecord) => w.durationMinutes ?? w.durationMin)
      .filter((v: number | undefined): v is number => typeof v === "number");

    const cals = hist
      .map((w: WorkoutRecord) => w.caloriesBurned ?? w.caloriesKcal)
      .filter((v: number | undefined): v is number => typeof v === "number");

    const pses = hist
      .map((w: WorkoutRecord) => w.pse)
      .filter((v: number | undefined): v is number => typeof v === "number");

    let dur = Math.round(avg(durs) || this.getDefaultDuration(type));
    let cal = Math.round(avg(cals) || this.getDefaultCalories(type));
    const pse = Math.round((avg(pses) || 7) * 10) / 10;

    if (typeof targetDistanceKm === "number" && Number.isFinite(targetDistanceKm) && targetDistanceKm > 0) {
      if (type === "corrida" || type === "ciclismo") {
        const withDist = hist.filter((w) => typeof w.distanceKm === "number" && (w.distanceKm as number) > 0);
        if (withDist.length) {
          const pace = withDist.reduce((s, w) => s + ((w.durationMinutes ?? w.durationMin ?? 0) / (w.distanceKm as number)), 0) / withDist.length;
          dur = Math.max(10, Math.round(pace * targetDistanceKm));
          const ref = withDist[0].distanceKm || targetDistanceKm;
          cal = Math.round(cal * Math.max(0.7, targetDistanceKm / ref));
        } else {
          dur = Math.max(10, Math.round((type === "corrida" ? 7 : 3) * targetDistanceKm));
          cal = Math.round(cal * Math.max(0.7, targetDistanceKm / 5));
        }
      }
    }

    const confidence = Math.max(0.35, Math.min(0.9, hist.length / 40));

    return { type, predictedDurationMin: dur, predictedCaloriesKcal: cal, predictedPSE: pse, confidence };
  }

  predictWeight(): WeightPrediction {
    const data = historyService.getWeightProgress(120);
    if (!data || data.length < 6) return { predictedKgIn30d: null, r2: null };

    const pts = data.map((d, i) => ({ x: i, y: d.weightKg }));
    const n = pts.length;

    const sumX = pts.reduce((s, p) => s + p.x, 0);
    const sumY = pts.reduce((s, p) => s + p.y, 0);
    const sumXY = pts.reduce((s, p) => s + p.x * p.y, 0);
    const sumX2 = pts.reduce((s, p) => s + p.x * p.x, 0);

    const denom = n * sumX2 - sumX * sumX;
    if (denom === 0) return { predictedKgIn30d: null, r2: null };

    const m = (n * sumXY - sumX * sumY) / denom;
    const b = (sumY - m * sumX) / n;

    const meanY = sumY / n;
    const ssTotal = pts.reduce((s, p) => s + Math.pow(p.y - meanY, 2), 0);
    const ssResidual = pts.reduce((s, p) => s + Math.pow(p.y - (m * p.x + b), 2), 0);
    const r2 = ssTotal > 0 ? Math.max(0, Math.min(1, 1 - ssResidual / ssTotal)) : 0;

    const pred = m * (n - 1 + 30) + b;

    return { predictedKgIn30d: Math.round(pred * 10) / 10, r2: Math.round(r2 * 100) / 100 };
  }

  private getDefaultDuration(type: WorkoutType): number {
    switch (type) {
      case "musculacao": return 55;
      case "corrida": return 40;
      case "ciclismo": return 60;
      case "crossfit": return 45;
      case "funcional": return 45;
      default: return 45;
    }
  }

  private getDefaultCalories(type: WorkoutType): number {
    switch (type) {
      case "musculacao": return 380;
      case "corrida": return 420;
      case "ciclismo": return 520;
      case "crossfit": return 500;
      case "funcional": return 420;
      default: return 400;
    }
  }
}

export const predictionEngine = new PredictionEngine();
TS

cat > src/hooks/useAI/useAI.ts <<'TS'
import { useMemo } from "react";
import { adaptiveEngine } from "@/services/ai/AdaptiveEngine";
import { predictionEngine } from "@/services/ml/PredictionEngine";
import type { WorkoutType } from "@/services/history/HistoryService";

export function useAI() {
  const metrics = useMemo(() => adaptiveEngine.getMetrics(), []);
  const recommendations = useMemo(() => adaptiveEngine.getRecommendations(), []);

  const predictWorkout = (type: WorkoutType, distanceKm?: number) =>
    predictionEngine.predictWorkout(type, distanceKm);

  const predictWeight = () => predictionEngine.predictWeight();

  return { metrics, recommendations, predictWorkout, predictWeight };
}
TS

echo "==> tsc --noEmit"
npx tsc --noEmit

echo "==> verify"
npm run -s verify

git add -A
git commit -m "fix: align history SSOT + AI/ML compat + remove unused React + wearables dateIso" || true

echo "✅ OK | FIX_ALL_V1 complete"
