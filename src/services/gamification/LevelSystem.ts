export type LevelState = {
  level: number;
  xp: number;
  xpTotal: number;
};


export type LevelProgress = LevelState & { nextLevelXp: number };
const KEY = "mf_level_v1";

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    const v = raw ? JSON.parse(raw) : null;
    return (v ?? fallback) as T;
  } catch {
    return fallback;
  }
}

export function loadLevel(): LevelState {
  if (typeof localStorage === "undefined") return { level: 1, xp: 0, xpTotal: 0 };
  return safeParse<LevelState>(localStorage.getItem(KEY), { level: 1, xp: 0, xpTotal: 0 });
}

export function saveLevel(s: LevelState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

export function xpForNext(level: number): number {
  // curva suave e previsível
  return Math.round(90 + Math.max(1, level) * 30);
}

export function addXP(delta: number): LevelState {
  const prev = loadLevel();
  let xp = Math.max(0, prev.xp + Math.max(0, Math.round(delta)));
  let level = Math.max(1, prev.level);
  const xpTotal = Math.max(0, prev.xpTotal + Math.max(0, Math.round(delta)));

  while (xp >= xpForNext(level)) {
    xp -= xpForNext(level);
    level += 1;
  }

  const next: LevelState = { level, xp, xpTotal };
  saveLevel(next);
  return next;
}

/**
 * API compat (legacy): páginas/bridges antigos podem importar levelSystem.
 * Mantém SSOT com as mesmas funções.
 */
export const levelSystem = {
  getProgress: (): LevelProgress => {
    const s = loadLevel();
    return { ...s, nextLevelXp: xpForNext(s.level) };
  },
  loadLevel,
  saveLevel,
  xpForNext,
  addXP,
};
