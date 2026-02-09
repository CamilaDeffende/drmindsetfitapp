import { historyService } from "@/services/history/HistoryService";

export type AchievementType =
  | "first_workout"
  | "five_workouts"
  | "ten_workouts"
  | "first_run_5k"
  | "streak_3"
  | "streak_7";

export type Achievement = {
  id: AchievementType;
  title: string;
  description: string;
  xp: number;
  unlocked: boolean;
  unlockedAtIso?: string;
};

type Store = {
  xp: number;
  unlocked: Record<string, string>; // id -> dateIso
};

const LS_KEY = "mf:gamification:v1";

function load(): Store {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { xp: 0, unlocked: {} };
    const j = JSON.parse(raw) as Store;
    return { xp: Number(j.xp || 0), unlocked: j.unlocked || {} };
  } catch {
    return { xp: 0, unlocked: {} };
  }
}

function save(s: Store) {
  localStorage.setItem(LS_KEY, JSON.stringify(s));
}

function nowIso() {
  return new Date().toISOString();
}

export class AchievementsService {
  getTotalXp(): number {
    return load().xp;
  }

  getAll(): Achievement[] {
    const st = load();

    const workouts = historyService.getWorkouts?.(9999) ?? [];
    const workoutsCount = Array.isArray(workouts) ? workouts.length : 0;

    const run5k = workouts.some((w: any) => (w.type === "corrida" || w.modality === "corrida") && (w.distanceMeters || 0) >= 5000);

    // streak simples por dias consecutivos (últimos N dias com treino)
    const days = new Set(
      workouts
        .map((w: any) => String(w.dateIso || "").slice(0, 10))
        .filter(Boolean)
    );
    const hasDay = (d: Date) => days.has(d.toISOString().slice(0, 10));
    const streakLen = (() => {
      let n = 0;
      const d = new Date();
      for (;;) {
        if (!hasDay(d)) break;
        n += 1;
        d.setDate(d.getDate() - 1);
      }
      return n;
    })();

    const defs: Omit<Achievement, "unlocked" | "unlockedAtIso">[] = [
      { id: "first_workout", title: "Primeiro treino", description: "Registre seu primeiro treino.", xp: 50 },
      { id: "five_workouts", title: "5 treinos", description: "Complete 5 treinos registrados.", xp: 80 },
      { id: "ten_workouts", title: "10 treinos", description: "Complete 10 treinos registrados.", xp: 140 },
      { id: "first_run_5k", title: "Corrida 5K", description: "Registre uma corrida de 5 km ou mais.", xp: 120 },
      { id: "streak_3", title: "Sequência 3 dias", description: "Treine 3 dias seguidos.", xp: 90 },
      { id: "streak_7", title: "Sequência 7 dias", description: "Treine 7 dias seguidos.", xp: 200 },
    ];

    const evalUnlock = (id: AchievementType) => {
      if (id == "first_workout") return workoutsCount >= 1;
      if (id == "five_workouts") return workoutsCount >= 5;
      if (id == "ten_workouts") return workoutsCount >= 10;
      if (id == "first_run_5k") return run5k;
      if (id == "streak_3") return streakLen >= 3;
      if (id == "streak_7") return streakLen >= 7;
      return false;
    };

    return defs.map((d) => {
      const unlockedAt = st.unlocked[d.id];
      const unlocked = Boolean(unlockedAt) || Boolean(evalUnlock(d.id as AchievementType));
      return { ...d, unlocked, unlockedAtIso: unlockedAt };
    });
  }

  syncFromHistory(): { gainedXp: number; unlocked: AchievementType[] } {
    const st = load();
    const all = this.getAll();

    const newly: AchievementType[] = [];
    let gained = 0;

    for (const a of all) {
      if (a.unlocked && !st.unlocked[a.id]) {
        st.unlocked[a.id] = nowIso();
        st.xp += a.xp;
        gained += a.xp;
        newly.push(a.id);
      }
    }

    save(st);
    return { gainedXp: gained, unlocked: newly };
  }
}

export const achievementsService = new AchievementsService();
