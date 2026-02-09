#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "==> Phase 7 | History + Charts + ProgressPage"

# deps (idempotente)
echo "==> deps (recharts/date-fns)"
npm i recharts date-fns >/dev/null

mkdir -p src/services/history src/components/charts src/pages/progress

cat > src/services/history/HistoryService.ts <<'TS'
export type WorkoutRecord = {
  id: string;
  dateIso: string; // ISO datetime
  modality: "musculacao" | "corrida" | "ciclismo" | "crossfit" | "funcional" | "outro";
  title: string;
  durationMin?: number;
  distanceKm?: number;
  caloriesKcal?: number;
  avgHeartRate?: number;
  notes?: string;
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

export class HistoryService {
  private db: HistoryDB;

  constructor() {
    this.db = safeJsonParse<HistoryDB>(
      typeof window !== "undefined" ? window.localStorage.getItem(LS_KEY) : null,
      { workouts: [], measurements: [], nutrition: [] }
    );
  }

  private persist() {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LS_KEY, JSON.stringify(this.db));
  }

  getAll() {
    return { ...this.db };
  }

  addWorkout(input: Omit<WorkoutRecord, "id"> & { id?: string }) {
    const rec: WorkoutRecord = {
      id: input.id ?? uid(),
      dateIso: input.dateIso || nowIso(),
      modality: input.modality,
      title: input.title,
      durationMin: input.durationMin,
      distanceKm: input.distanceKm,
      caloriesKcal: input.caloriesKcal,
      avgHeartRate: input.avgHeartRate,
      notes: input.notes,
    };
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

  getWorkouts(limit = 200) {
    return this.db.workouts.slice(0, limit);
  }

  getMeasurements(limit = 365) {
    return this.db.measurements.slice(0, limit);
  }

  getWeightSeries(days = 60) {
    const cutoff = Date.now() - days * 86400 * 1000;
    return this.db.measurements
      .filter((m) => !!m.weightKg && Date.parse(m.dateIso) >= cutoff)
      .map((m) => ({ dateIso: m.dateIso, weightKg: m.weightKg as number }))
      .sort((a, b) => Date.parse(a.dateIso) - Date.parse(b.dateIso));
  }

  getWorkoutWeeklyCounts(weeks = 12) {
    const cutoff = Date.now() - weeks * 7 * 86400 * 1000;
    const map = new Map<string, number>();

    for (const w of this.db.workouts) {
      const t = Date.parse(w.dateIso);
      if (!Number.isFinite(t) || t < cutoff) continue;

      const d = new Date(t);
      const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      const day = tmp.getUTCDay() or 7
      tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
      const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      const key = f"{tmp.getUTCFullYear()}-W{str(weekNo).zfill(2)}"
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
        this.addWorkout({
          dateIso,
          modality: dt.getDay() % 2 === 0 ? "musculacao" : "corrida",
          title: dt.getDay() % 2 === 0 ? "Treino A (Força)" : "Corrida Z2",
          durationMin: 45 + (dt.getDay() % 3) * 10,
          distanceKm: dt.getDay() % 2 === 0 ? undefined : 5 + (dt.getDay() % 3),
          caloriesKcal: 320 + (dt.getDay() % 4) * 40,
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

cat > src/components/charts/WeightChart.tsx <<'TSX'
import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format } from "date-fns";

type Pt = { dateIso: string; weightKg: number };

function fmt(d: string) {
  const t = Date.parse(d);
  if (!Number.isFinite(t)) return "";
  return format(new Date(t), "dd/MM");
}

export default function WeightChart({ data }: { data: Pt[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm font-semibold text-white">Peso (kg)</div>
      <div className="mt-3 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dateIso" tickFormatter={fmt} />
            <YAxis domain={["dataMin - 1", "dataMax + 1"]} />
            <Tooltip labelFormatter={(v) => fmt(String(v))} formatter={(v) => [v, "kg"]} />
            <Line type="monotone" dataKey="weightKg" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
TSX

cat > src/components/charts/WorkoutFrequencyChart.tsx <<'TSX'
import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type Pt = { week: string; workouts: number };

export default function WorkoutFrequencyChart({ data }: { data: Pt[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm font-semibold text-white">Frequência semanal</div>
      <div className="mt-3 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" hide />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="workouts" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 text-xs text-white/60">*Eixo X oculto para manter layout premium clean.</div>
    </div>
  );
}
TSX

cat > src/pages/progress/ProgressPage.tsx <<'TSX'
import React, { useEffect, useMemo, useState } from "react";
import WeightChart from "@/components/charts/WeightChart";
import WorkoutFrequencyChart from "@/components/charts/WorkoutFrequencyChart";
import { historyService } from "@/services/history/HistoryService";

export default function ProgressPage() {
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    historyService.seedDemo(35);
    setSeeded(true);
  }, []);

  const weight = useMemo(() => historyService.getWeightSeries(60), [seeded]);
  const weekly = useMemo(() => historyService.getWorkoutWeeklyCounts(12), [seeded]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-white/60">Analytics</div>
          <h1 className="text-2xl font-bold text-white">Progresso</h1>
          <p className="mt-1 text-sm text-white/70">
            Evolução de peso e consistência de treinos com histórico local (SSOT).
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <WeightChart data={weight} />
        <WorkoutFrequencyChart data={weekly} />
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm font-semibold text-white">Últimos treinos</div>
        <div className="mt-3 grid gap-2">
          {historyService.getWorkouts(8).map((w) => (
            <div key={w.id} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-white">{w.title}</div>
                <div className="text-xs text-white/60">{new Date(w.dateIso).toLocaleDateString("pt-BR")}</div>
              </div>
              <div className="mt-1 text-xs text-white/60">
                {w.modality} · {w.durationMin ?? 0} min {w.distanceKm ? `· ${w.distanceKm} km` : ""} {w.caloriesKcal ? `· ${w.caloriesKcal} kcal` : ""}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
TSX

echo "==> phase7 verify"
npm run -s verify

git add -A
git commit -m "feat: phase 7 history + charts + progress page" || true

echo "✅ OK | Phase 7 done"
