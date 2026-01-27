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



/** Phase 3C — soma macros do DIA (todas as refeições) */
export function sumMacrosFromRefeicoes(refeicoes: Array<{ alimentos?: any[] }>): MacroTotals {
  const out: MacroTotals = { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 };
  for (const r of refeicoes ?? []) {
    const t = sumAlimentosTotals((r?.alimentos ?? []) as any[]);
    out.calorias += Number(t.calorias) || 0;
    out.proteinas += Number(t.proteinas) || 0;
    out.carboidratos += Number(t.carboidratos) || 0;
    out.gorduras += Number(t.gorduras) || 0;
  }
  out.calorias = Math.round(out.calorias);
  out.proteinas = Number(out.proteinas.toFixed(1));
  out.carboidratos = Number(out.carboidratos.toFixed(1));
  out.gorduras = Number(out.gorduras.toFixed(1));
  return out;
}

/** Phase 3C — tenta inferir peso (kg) a partir de um state-like (robusto) */
export function guessPesoKgFromStateLike(stateLike: any): number | undefined {
  const candidates = [
    stateLike?.avaliacao?.pesoKg,
    stateLike?.avaliacao?.peso,
    stateLike?.perfil?.pesoKg,
    stateLike?.perfil?.peso,
    stateLike?.user?.pesoKg,
    stateLike?.user?.peso,
    stateLike?.pesoKg,
    stateLike?.peso,
  ];
  for (const c of candidates) {
    const n = typeof c === "string" ? Number(String(c).replace(",", ".")) : Number(c);
    if (Number.isFinite(n) && n > 20 && n < 400) return n;
  }
  return undefined;
}

/** Phase 3C — check científico simples (coerência kcal do plano vs soma das refeições) */
export function validateDietScience(params: {
  kcalTarget?: number;
  refeicoes: Array<{ alimentos?: any[] }>;
  tolerancePct?: number; // default 10%
}): { ok: boolean; deltaKcal: number; pct: number; message: string } {
  const tol = Number.isFinite(params.tolerancePct) ? Number(params.tolerancePct) : 10;
  const totals = sumMacrosFromRefeicoes(params.refeicoes ?? []);
  const target = Number(params.kcalTarget);
  if (!Number.isFinite(target) || target <= 0) {
    return { ok: true, deltaKcal: 0, pct: 0, message: "Sem alvo calórico definido — check informativo." };
  }
  const delta = totals.calorias - target;
  const pct = Math.abs(delta) / target * 100;
  const ok = pct <= tol;
  const signal = ok ? "OK" : "ATENÇÃO";
  const msg = ok
    ? `${signal}: soma do dia ≈ alvo (${totals.calorias} vs ${Math.round(target)} kcal, Δ ${Math.round(delta)} kcal)`
    : `${signal}: soma do dia difere do alvo (${totals.calorias} vs ${Math.round(target)} kcal, Δ ${Math.round(delta)} kcal | ${pct.toFixed(1)}%)`;
  return { ok, deltaKcal: Math.round(delta), pct: Number(pct.toFixed(1)), message: msg };
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
