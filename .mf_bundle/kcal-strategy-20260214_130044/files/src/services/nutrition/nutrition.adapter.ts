/**
 * Adapter único (SSOT) para normalizar nutrição do ActivePlan (meals[])
 * para o formato usado no estado/UI do app (refeicoes[] + macros pt-BR).
 *
 * Regra: seguro, idempotente, sem quebrar build mesmo com payload parcial.
 */

export type MfMacros = {
  calorias: number;
  proteina: number;
  carboidratos: number;
  gorduras: number;
};

export type MfRefeicao = {
  tipo?: string;
  nome?: string;
  horario?: string;
  alimentos: Array<{
    nome: string;
    porcao?: string;
    calorias: number;
    proteina?: number;
    carboidratos?: number;
    gorduras?: number;
    substituicoes?: Array<{ nome: string; porcao?: string }>;
  }>;
};

export type MfAdaptedNutrition = {
  macros: MfMacros;
  refeicoes: MfRefeicao[];
  kcalTarget: number | null;
  meals: any[];
};

function n(v: any, d = 0): number {
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : d;
}

function str(v: any, d = ""): string {
  return typeof v === "string" ? v : d;
}

function normMealType(name: string): string {
  const s = (name || "").toLowerCase();
  if (s.includes("café") || s.includes("cafe")) return "cafe-da-manha";
  if (s.includes("almoço") || s.includes("almoco")) return "almoco";
  if (s.includes("lanche")) return "lanche-tarde";
  if (s.includes("jantar")) return "jantar";
  if (s.includes("ceia")) return "ceia";
  return "refeicao";
}

/**
 * Converte meals[] do NutritionEngine (ou similares) em refeicoes[].
 * Esperado: Meal = { name, time, items:[{ name, grams, kcal, proteinG, carbsG, fatG, substitutions? }] }
 * Mas aceita variações (items/alimentos/list).
 */
export function adaptMealsToRefeicoes(meals: any): MfRefeicao[] {
  if (!Array.isArray(meals)) return [];
  const out: MfRefeicao[] = [];

  for (const m of meals) {
    const nome = str(m?.name ?? m?.nome ?? m?.title ?? "Refeição");
    const horario = str(m?.time ?? m?.horario ?? "");
    const tipo = normMealType(nome);

    const items = (Array.isArray(m?.items) ? m.items
      : Array.isArray(m?.alimentos) ? m.alimentos
      : Array.isArray(m?.list) ? m.list
      : []) as any[];

    const alimentos = items.map((it: any) => {
      const subs = Array.isArray(it?.substitutions) ? it.substitutions
        : Array.isArray(it?.substituicoes) ? it.substituicoes
        : [];
      return {
        nome: str(it?.name ?? it?.nome ?? "Alimento"),
        porcao: str(it?.grams ? `${it.grams}g` : (it?.porcao ?? it?.portion ?? "")),
        calorias: n(it?.kcal ?? it?.calorias ?? it?.cal ?? 0),
        proteina: n(it?.proteinG ?? it?.protein ?? it?.proteina ?? 0),
        carboidratos: n(it?.carbsG ?? it?.carbs ?? it?.carboidratos ?? 0),
        gorduras: n(it?.fatG ?? it?.fat ?? it?.gorduras ?? 0),
        substituicoes: subs.map((s: any) => ({
          nome: str(s?.name ?? s?.nome ?? "Substituição"),
          porcao: str(s?.grams ? `${s.grams}g` : (s?.porcao ?? s?.portion ?? "")),
        })),
      };
    });

    out.push({ tipo, nome, horario, alimentos });
  }

  return out;
}

/**
 * Normaliza macros vindos do ActivePlan (podem ser proteinG/carbsG/fatG ou protein/carbs/fat)
 * para o formato do app (proteina/carboidratos/gorduras/calorias).
 */
export function adaptMacrosToPtBR(macros: any, kcalFallback = 0): MfMacros {
  const calorias =
    n(macros?.calorias ?? macros?.kcal ?? macros?.kcalTarget ?? macros?.calories ?? kcalFallback, kcalFallback);

  const proteina = n(macros?.proteina ?? macros?.proteinG ?? macros?.protein ?? 0);
  const carboidratos = n(macros?.carboidratos ?? macros?.carbsG ?? macros?.carbs ?? 0);
  const gorduras = n(macros?.gorduras ?? macros?.fatG ?? macros?.fat ?? 0);

  return { calorias, proteina, carboidratos, gorduras };
}

/**
 * Helper final: dado activePlan.nutrition, retorna nutricao no formato do app
 * + pass-through seguro de kcalTarget e meals (para DashboardPremium/PlanosAtivos/Report).
 */
export function adaptActivePlanNutrition(nutrition: any): MfAdaptedNutrition | null {
  if (!nutrition) return null;

  const mealsRaw =
    (nutrition?.meals ??
      nutrition?.mealPlan ??
      nutrition?.refeicoes ??
      nutrition?.refeições ??
      []) as any;

  const mealsArr = Array.isArray(mealsRaw) ? mealsRaw : [];
  const refeicoes = adaptMealsToRefeicoes(mealsArr);

  const kcalTargetNum = n(
    nutrition?.kcalTarget ??
      nutrition?.targetKcal ??
      nutrition?.caloriasAlvo ??
      nutrition?.kcal ??
      nutrition?.calories ??
      0,
    0
  );
  const kcalTarget = kcalTargetNum > 0 ? kcalTargetNum : null;

  const macros = adaptMacrosToPtBR(nutrition?.macros ?? nutrition, kcalTargetNum);

  return { macros, refeicoes, kcalTarget, meals: mealsArr };
}
