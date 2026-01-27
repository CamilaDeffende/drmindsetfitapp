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
