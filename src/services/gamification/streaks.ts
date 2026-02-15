export type Streak = { current: number; best: number; lastIso?: string };

const KEY = "mf_streak_v1";

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    const v = raw ? JSON.parse(raw) : null;
    return (v ?? fallback) as T;
  } catch {
    return fallback;
  }
}

export function loadStreak(): Streak {
  if (typeof localStorage === "undefined") return { current: 0, best: 0 };
  return safeParse<Streak>(localStorage.getItem(KEY), { current: 0, best: 0 });
}

export function saveStreak(s: Streak) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

export function recordDailyCompletion(now = new Date()): Streak {
  const iso = now.toISOString().slice(0, 10);
  const prev = loadStreak();

  if (prev.lastIso === iso) return prev;

  const prevDate = prev.lastIso ? new Date(prev.lastIso + "T00:00:00Z") : null;
  const diffDays =
    prevDate ? Math.round((now.getTime() - prevDate.getTime()) / 86400000) : null;

  const next: Streak = { ...prev, lastIso: iso };
  next.current = diffDays == 1 ? (prev.current || 0) + 1 : 1;
  next.best = Math.max(prev.best || 0, next.current);

  saveStreak(next);
  return next;
}
