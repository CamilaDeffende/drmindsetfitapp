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
