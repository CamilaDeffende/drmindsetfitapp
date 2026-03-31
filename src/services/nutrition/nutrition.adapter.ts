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
  const x =
    typeof v === "number"
      ? v
      : typeof v === "string"
      ? Number(String(v).replace(",", "."))
      : Number(v);
  return Number.isFinite(x) ? x : d;
}

function str(v: any, d = ""): string {
  return typeof v === "string" ? v : d;
}

function parseGramsValue(v: any): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const match = v.replace(",", ".").match(/-?\d+(\.\d+)?/);
    if (!match) return undefined;
    const parsed = Number(match[0]);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function normMealType(name: string): string {
  const s = (name || "").toLowerCase();

  if (s.includes("desjejum")) return "desjejum";
  if (s.includes("café") || s.includes("cafe")) return "cafe-da-manha";
  if (s.includes("almoço") || s.includes("almoco")) return "almoco";
  if (s.includes("lanche")) return "lanche-tarde";
  if (s.includes("jantar")) return "jantar";
  if (s.includes("ceia")) return "ceia";

  return "refeicao";
}

/**
 * Converte meals[] do NutritionEngine (ou similares) em refeicoes[].
 *
 * Aceita formatos como:
 * - { name, time, items: [...] }
 * - { nome, horario, alimentos: [...] }
 * - { title, list: [...] }
 */
export function adaptMealsToRefeicoes(meals: any): MfRefeicao[] {
  if (!Array.isArray(meals)) return [];

  const out: MfRefeicao[] = [];

  for (const m of meals) {
    const nome = str(m?.name ?? m?.nome ?? m?.title ?? "Refeição");
    const horario = str(m?.time ?? m?.horario ?? "");
    const tipo = str(m?.tipo ?? "", "") || normMealType(nome);

    const items = (
      Array.isArray(m?.items)
        ? m.items
        : Array.isArray(m?.alimentos)
        ? m.alimentos
        : Array.isArray(m?.list)
        ? m.list
        : []
    ) as any[];

    const alimentos = items.map((it: any) => {
      const subs = Array.isArray(it?.substitutions)
        ? it.substitutions
        : Array.isArray(it?.substituicoes)
        ? it.substituicoes
        : Array.isArray(it?.substitutos)
        ? it.substitutos
        : [];

      const gramasValor =
        it?.grams ??
        it?.gramas ??
        it?.quantidade ??
        it?.quantidadeG ??
        it?.porcao ??
        it?.portion ??
        "";
      const gramasNumericas = parseGramsValue(gramasValor);

      return {
        nome: str(it?.name ?? it?.nome ?? "Alimento"),
        gramas: gramasNumericas,
        grams: gramasNumericas,
        quantidade: gramasNumericas,
        porcao: gramasValor
          ? typeof gramasValor === "number"
            ? `${gramasValor}g`
            : str(gramasValor)
          : "",
        calorias: n(it?.kcal ?? it?.calorias ?? it?.cal ?? 0),

        proteina: n(
          it?.proteinG ??
            it?.protein ??
            it?.proteina ??
            it?.proteinas ??
            0
        ),

        carboidratos: n(
          it?.carbsG ??
            it?.carbs ??
            it?.carboidratos ??
            0
        ),

        gorduras: n(
          it?.fatG ??
            it?.fat ??
            it?.gorduras ??
            0
        ),

        substituicoes: subs.map((s: any) => {
          const subPorcao =
            s?.grams ??
            s?.gramas ??
            s?.porcao ??
            s?.portion ??
            "";

          return {
            nome: str(s?.name ?? s?.nome ?? "Substituição"),
            porcao: subPorcao
              ? typeof subPorcao === "number"
                ? `${subPorcao}g`
                : str(subPorcao)
              : "",
          };
        }),
      };
    });

    out.push({
      tipo,
      nome,
      horario,
      alimentos,
    });
  }

  return out;
}

/**
 * Normaliza macros vindos do ActivePlan
 * para o formato do app (proteina/carboidratos/gorduras/calorias).
 */
export function adaptMacrosToPtBR(macros: any, kcalFallback = 0): MfMacros {
  const calorias = n(
    macros?.calorias ??
      macros?.kcal ??
      macros?.kcalTarget ??
      macros?.calories ??
      macros?.targetKcal ??
      kcalFallback,
    kcalFallback
  );

  const proteina = n(
    macros?.proteina ??
      macros?.proteinas ??
      macros?.proteinG ??
      macros?.protein ??
      0
  );

  const carboidratos = n(
    macros?.carboidratos ??
      macros?.carbsG ??
      macros?.carbs ??
      0
  );

  const gorduras = n(
    macros?.gorduras ??
      macros?.fatG ??
      macros?.fat ??
      0
  );

  return { calorias, proteina, carboidratos, gorduras };
}

/**
 * Helper final: dado activePlan.nutrition, retorna nutricao no formato do app
 * + pass-through seguro de kcalTarget e meals.
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
      nutrition?.macros?.calorias ??
      nutrition?.macros?.kcal ??
      nutrition?.macros?.targetKcal ??
      0,
    0
  );

  const kcalTarget = kcalTargetNum > 0 ? kcalTargetNum : null;

  const macros = adaptMacrosToPtBR(
    nutrition?.macros ?? nutrition,
    kcalTargetNum
  );

  return {
    macros,
    refeicoes,
    kcalTarget,
    meals: mealsArr,
  };
}
