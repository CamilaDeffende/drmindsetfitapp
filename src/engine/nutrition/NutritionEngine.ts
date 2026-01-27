export type NutritionInput = {
  targetKcal: number;
  goal: "cut" | "maintain" | "bulk";
  weightKg: number;
  preference: "flexivel" | "lowcarb" | "vegetariana";
};

export type Macros = {
  proteinG: number;
  carbsG: number;
  fatG: number;
};

function round(n: number) { return Math.round(n); }

/**
 * Determinístico:
 * - proteína: 2.0g/kg (cut), 1.8g/kg (maintain), 1.8g/kg (bulk)
 * - gordura: 0.8g/kg base (ajusta levemente por preferência)
 * - carbo: resto das calorias
 * kcal: P=4, C=4, F=9
 */
export function computeMacros(input: NutritionInput): Macros {
  const { targetKcal, goal, weightKg, preference } = input;

  const p = goal === "cut" ? 2.0 : 1.8;
  let fatPerKg = 0.8;

  if (preference === "lowcarb") fatPerKg = 1.0;
  if (preference === "vegetariana") fatPerKg = 0.9;

  const proteinG = p * weightKg;
  const fatG = fatPerKg * weightKg;

  const kcalPF = (proteinG * 4) + (fatG * 9);
  const carbsKcal = Math.max(0, targetKcal - kcalPF);
  const carbsG = carbsKcal / 4;

  return {
    proteinG: round(proteinG),
    fatG: round(fatG),
    carbsG: round(carbsG),
  };
}

export type Meal = { name: string; kcal: number; proteinG: number; carbsG: number; fatG: number; };

export function buildMealPlan(targetKcal: number, macros: Macros): Meal[] {
  // Divisão determinística 25/30/25/20
  const splits = [0.25, 0.30, 0.25, 0.20];
  const names = ["Café da manhã", "Almoço", "Lanche", "Jantar"];

  return splits.map((pct, i) => {
    const kcal = targetKcal * pct;
    return {
      name: names[i],
      kcal: Math.round(kcal),
      proteinG: Math.round(macros.proteinG * pct),
      carbsG: Math.round(macros.carbsG * pct),
      fatG: Math.round(macros.fatG * pct),
    };
  });
}


/* MF_ENGINE_HELPERS_V1 */
export type MacrosPer100g = {
  calorias: number;
  proteinas: number;
  carboidratos: number;
  gorduras: number;
};

export type MacroTotals = {
  calorias: number;
  proteinas: number;
  carboidratos: number;
  gorduras: number;
};

function mfRound1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function scaleMacrosPer100g(macrosPor100g: MacrosPer100g, gramas: number): MacroTotals {
  const fator = gramas / 100;
  return {
    calorias: Math.round(macrosPor100g.calorias * fator),
    proteinas: mfRound1(macrosPor100g.proteinas * fator),
    carboidratos: mfRound1(macrosPor100g.carboidratos * fator),
    gorduras: mfRound1(macrosPor100g.gorduras * fator),
  };
}

export function sumAlimentosTotals(
  alimentos: Array<{ calorias: number; proteinas: number; carboidratos: number; gorduras: number; }>
): MacroTotals {
  return alimentos.reduce(
    (acc, a) => {
      acc.calorias += Number(a.calorias || 0);
      acc.proteinas += Number(a.proteinas || 0);
      acc.carboidratos += Number(a.carboidratos || 0);
      acc.gorduras += Number(a.gorduras || 0);
      return acc;
    },
    { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 }
  );
}

export function sumKcalFromRefeicoes(
  refeicoes: Array<{ alimentos: Array<{ calorias: number }> }>
): number {
  return refeicoes.reduce((acc, r) => {
    const kcal = r.alimentos.reduce((a, x) => a + Number(x.calorias || 0), 0);
    return acc + kcal;
  }, 0);
}
