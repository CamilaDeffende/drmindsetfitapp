export type WorkoutType =
  | "gps"
  | "gym"
  | "run"
  | "bike"
  | "other"
  | "corrida"
  | "ciclismo"
  | "musculacao"
  | "outro";

export type WorkoutRecord = {
id: string;
  ts: number; // epoch ms
  dateIso?: string; // ISO string (import wearable)
  type: WorkoutType;
  modality?: WorkoutType; // legado wearables
  title?: string;
  durationS?: number;
  durationMin?: number; // legado wearables (min)
  distanceM?: number;
  distanceKm?: number; // legado wearables (km)
  caloriesKcal?: number; // legado wearables (kcal)
  pse?: number; // Percepção Subjetiva de Esforço (0-10)
  avgHeartRate?: number; // bpm (wearables)
  avgSpeedMps?: number | null;
  paceSecPerKm?: number | null;
  notes?: string;
};

type StoreV1 = {
  v: 1;
  workouts: WorkoutRecord[];
};

const KEY = "mf:history:v1";

const nowId = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;

export class HistoryService {
  static read(): StoreV1 {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { v: 1, workouts: [] };
      const parsed = JSON.parse(raw) as StoreV1;
      if (!parsed || parsed.v !== 1 || !Array.isArray(parsed.workouts)) return { v: 1, workouts: [] };
      return parsed;
    } catch {
      return { v: 1, workouts: [] };
    }
  }

  static write(store: StoreV1) {
    localStorage.setItem(KEY, JSON.stringify(store));
  }

  static addWorkout(input: Omit<WorkoutRecord, "id" | "ts"> & { id?: string; ts?: number }) {
    const store = HistoryService.read();
    const rec: WorkoutRecord = { id: (input as any).id || nowId(), ts: input.ts ?? Date.now(), ...(input as any) };
    store.workouts = [rec, ...store.workouts].slice(0, 500);
    HistoryService.write(store);
    return rec;
  }

  static listWorkouts() {
    return HistoryService.read().workouts;
  }

  static clearAll() {
    HistoryService.write({ v: 1, workouts: [] });
  }
  // MF_HISTORY_ALIASES_V1
  static getWorkouts(limit = 200) {
    return HistoryService.listWorkouts().slice(0, Math.max(0, limit));
  }

}
// MF_HISTORY_SINGLETON_V1
export const historyService = HistoryService;


// MF_HISTORY_AGG_7D_V1
/**
 * Agregadores SSOT (7 dias) para Progressão Inteligente / IA Adaptativa.
 * Não assumem shape rígido: tentam ler campos comuns do WorkoutRecord.
 */
export type MFLoad7d = {
  sessions: number;
  minutes: number;
  avgRPE: number;
  sleepScore?: number;
  sorenessScore?: number;
  trace: Record<string, unknown>;
};

function __mf_toNum(v: any): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function __mf_daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / 86400000);
}

export function mfGetLoad7dFromHistory(now = new Date()): MFLoad7d {
  // best-effort: historyService might be a singleton; but this file itself typically exports historyService.
  // We'll try to use (historyService as any).getWorkouts() if exists; else localStorage fallback.
  const trace: Record<string, unknown> = {};
  let workouts: any[] = [];

  try {
    const hs: any = (exports as any)?.historyService ?? (globalThis as any)?.historyService;
    if (hs && typeof hs.getWorkouts === "function") {
      workouts = hs.getWorkouts() || [];
      trace.source = "historyService.getWorkouts()";
    }
  } catch {}

  if (!workouts.length) {
    try {
      // very conservative fallback: attempt known key
      const raw = localStorage.getItem("mf_history_v1") || localStorage.getItem("history_v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        workouts = Array.isArray(parsed?.workouts) ? parsed.workouts : (Array.isArray(parsed) ? parsed : []);
        trace.source = "localStorage(fallback)";
      }
    } catch {}
  }

  const last7 = workouts.filter((w) => {
    const iso = w?.date ?? w?.iso ?? w?.createdAt ?? w?.timestamp;
    const d = iso ? new Date(iso) : null;
    if (!d || Number.isNaN(d.getTime())) return false;
    return __mf_daysBetween(now, d) <= 6;
  });

  const sessions = last7.length;

  let minutes = 0;
  let rpeSum = 0;
  let rpeCount = 0;

  for (const w of last7) {
    const mins = __mf_toNum(w?.durationMinutes ?? w?.minutes ?? w?.durationMin ?? w?.duration);
    if (mins != null) minutes += Math.max(0, mins);

    const rpe = __mf_toNum(w?.rpe ?? w?.RPE ?? w?.pse ?? w?.PSE);
    if (rpe != null) {
      rpeSum += Math.max(0, Math.min(10, rpe));
      rpeCount += 1;
    }
  }

  // Optional recovery signals (if you store them)
  const sleepScore = __mf_toNum((workouts[workouts.length - 1] as any)?.sleepScore ?? null) ?? undefined;
  const sorenessScore = __mf_toNum((workouts[workouts.length - 1] as any)?.sorenessScore ?? null) ?? undefined;

  const avgRPE = rpeCount ? (rpeSum / rpeCount) : 0;
  trace.sessions = sessions;
  trace.minutes = minutes;
  trace.avgRPE = avgRPE;

  return { sessions, minutes, avgRPE, sleepScore, sorenessScore, trace };
}

