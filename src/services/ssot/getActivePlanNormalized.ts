// MF_SSOT_ACTIVEPLAN_V2
// SSOT — leitura normalizada do plano ativo (sem dependência de store para não quebrar build).
// Regra: nunca lançar erro; sempre retornar objeto consistente.

export const MF_ACTIVEPLAN_KEY_V1 = "mf:activePlan:v1" as const;

type AnyObj = Record<string, any>;

function safeJsonParse(s: string | null): any | null {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

function pickFirst<T = any>(...vals: any[]): T | undefined {
  for (const v of vals) {
    if (v !== null && v !== undefined) return v as T;
  }
  return undefined;
}

function asArray(v: any): any[] {
  return Array.isArray(v) ? v : (v ? [v] : []);
}

function getStoragePlan(): AnyObj | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage?.getItem(MF_ACTIVEPLAN_KEY_V1) ?? null;
    const j = safeJsonParse(raw);
    return (j && typeof j === "object") ? (j as AnyObj) : null;
  } catch {
    return null;
  }
}

function normalizePlan(plan: AnyObj | null): AnyObj {
  const p = plan || {};

  const dieta = pickFirst(
    p.dieta,
    p.dietaAtiva,
    p.nutricao
  ) as AnyObj | undefined;

  const macros = pickFirst(
    p.macros,
    dieta?.macros,
    p.nutricao?.macros
  ) as AnyObj | undefined;

  const kcal = pickFirst(
    p.kcal,
    macros?.kcal,
    dieta?.kcal
  );

  const modalidades = asArray(pickFirst(
    p.modalidades,
    p.modalities
  ));

  const schedule = pickFirst(
    p.schedule,
    p.calendario,
    p.week
  ) as AnyObj | undefined;

  const treinos = pickFirst(
    p.treinos,
    p.workouts,
    schedule?.treinos
  ) as AnyObj | undefined;

  return {
    __raw: p,
    dieta: dieta || null,
    macros: macros || null,
    kcal: kcal ?? null,
    modalidades,
    schedule: schedule || null,
    treinos: treinos || null,
  };
}

export function getActivePlanNormalized(): AnyObj {
  const storage = getStoragePlan();
  return normalizePlan(storage);
}
