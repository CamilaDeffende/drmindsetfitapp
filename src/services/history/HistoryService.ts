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
          type: isStrength ? "musculacao" : "corrida",
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
