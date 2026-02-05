// MF_SSOT_ACTIVEPLAN_V3
// SSOT — leitura normalizada do plano ativo (storage-first, sem dependência de store).
// Importante: expõe também `nutrition` no shape esperado pela UI (compat).

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

  // nutrition candidates
  const nutrition = pickFirst(
    p.nutrition,
    p.nutricao,
    p.dieta,
    p.dietaAtiva
  ) as AnyObj | undefined;

  const macros = pickFirst(
    p.macros,
    nutrition?.macros,
    p.nutricao?.macros
  ) as AnyObj | undefined;

  const kcal = pickFirst(
    p.kcal,
    nutrition?.kcalTarget,
    nutrition?.kcal,
    macros?.kcal
  );

  const meals = pickFirst(
    nutrition?.meals,
    nutrition?.refeicoes,
    p.meals,
    p.refeicoes
  ) as any[] | undefined;

  const modalidades = asArray(pickFirst(p.modalidades, p.modalities));
  const schedule = pickFirst(p.schedule, p.calendario, p.week) as AnyObj | undefined;
  const treinos = pickFirst(p.treinos, p.workouts, schedule?.treinos, p.training?.workouts) as AnyObj | undefined;

  // shape compatível para telas existentes:
  const nutritionCompat = {
    kcalTarget: kcal ?? null,
    kcal: kcal ?? null,
    macros: macros || null,
    meals: Array.isArray(meals) ? meals : [],
  };

  return {
    __raw: p,
    // campos normalizados
    kcal: kcal ?? null,
    macros: macros || null,
    dieta: nutrition || null,
    modalidades,
    schedule: schedule || null,
    treinos: treinos || null,
    // compat UI
    nutrition: nutritionCompat,
  };
}

export function getActivePlanNormalized(): AnyObj {
  const storage = getStoragePlan();
  return normalizePlan(storage);
}
