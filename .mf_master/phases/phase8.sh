#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "==> Phase 8 | Gamification (Achievements + Levels)"

mkdir -p src/services/gamification

cat > src/services/gamification/LevelSystem.ts <<'TS'
export type LevelInfo = {
  level: number;
  title: string;
  xpRequired: number;
  nextXpRequired: number;
  progress01: number; // 0..1
};

const LEVELS: { level: number; title: string; xp: number }[] = [
  { level: 1, title: "Iniciante", xp: 0 },
  { level: 2, title: "Consistente", xp: 150 },
  { level: 3, title: "Atleta", xp: 400 },
  { level: 4, title: "Elite", xp: 800 },
  { level: 5, title: "Lenda", xp: 1400 },
];

export class LevelSystem {
  static getLevelInfo(totalXp: number): LevelInfo {
    const xp = Math.max(0, Math.floor(totalXp || 0));
    let cur = LEVELS[0];

    for (const L of LEVELS) {
      if (xp >= L.xp) cur = L;
      else break;
    }

    const idx = LEVELS.findIndex((l) => l.level === cur.level);
    const next = LEVELS[Math.min(idx + 1, LEVELS.length - 1)];

    const span = Math.max(1, next.xp - cur.xp);
    const prog = cur.level === next.level ? 1 : Math.min(1, Math.max(0, (xp - cur.xp) / span));

    return {
      level: cur.level,
      title: cur.title,
      xpRequired: cur.xp,
      nextXpRequired: next.xp,
      progress01: prog,
    };
  }
}
TS

cat > src/services/gamification/AchievementsService.ts <<'TS'
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
      return False;
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
TS

echo "==> typecheck + verify"
npx tsc --noEmit
npm run -s verify

git add -A
git commit -m "feat: phase 8 gamification services (achievements + levels)" || true

echo "✅ OK | Phase 8 done"
