export type AchievementId =
  | "FIRST_LOGIN"
  | "FIRST_WORKOUT"
  | "THREE_WORKOUTS_WEEK"
  | "SEVEN_DAY_STREAK"
  | "NUTRITION_PLAN_SET"
  | "AUDIT_ACTIVE";

export type Achievement = {
  id: AchievementId;
  title: string;
  description: string;
  unlockedAt?: string;
};

const KEY = "mf_achievements_v1";

const CATALOG: Achievement[] = [
  { id: "FIRST_LOGIN", title: "Bem-vindo", description: "Primeiro acesso ao app." },
  { id: "FIRST_WORKOUT", title: "Primeiro treino", description: "Registrou seu primeiro treino." },
  { id: "THREE_WORKOUTS_WEEK", title: "Consistência", description: "3 treinos na semana." },
  { id: "SEVEN_DAY_STREAK", title: "Sequência 7", description: "7 dias seguidos de check-in." },
  { id: "NUTRITION_PLAN_SET", title: "Plano nutricional", description: "Definiu calorias e macros." },
  { id: "AUDIT_ACTIVE", title: "Rastreável", description: "Plano com auditoria SSOT ativa." },
];

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    const v = raw ? JSON.parse(raw) : null;
    return (v ?? fallback) as T;
  } catch {
    return fallback;
  }
}

export function loadAchievements(): Achievement[] {
  if (typeof localStorage === "undefined") return CATALOG;
  const saved = safeParse<Record<string, string | undefined>>(localStorage.getItem(KEY), {});
  return CATALOG.map((a) => ({ ...a, unlockedAt: saved[a.id] }));
}

function saveAchievements(items: Achievement[]) {
  try {
    const map: Record<string, string | undefined> = {};
    for (const a of items) map[a.id] = a.unlockedAt;
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {}
}

export function unlock(id: AchievementId, now = new Date()): Achievement[] {
  const items = loadAchievements();
  const iso = now.toISOString();
  const next = items.map((a) => (a.id === id && !a.unlockedAt ? { ...a, unlockedAt: iso } : a));
  saveAchievements(next);
  return next;
}
