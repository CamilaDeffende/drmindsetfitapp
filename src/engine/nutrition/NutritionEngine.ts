export type Biotype = "ectomorfo" | "mesomorfo" | "endomorfo" | "misto";

export type NutritionPreference =
  | "flexivel"
  | "onivoro"
  | "vegetariano"
  | "vegano"
  | "lowcarb";

export type NutritionInput = {
  targetKcal: number;
  goal: "cut" | "maintain" | "bulk";
  weightKg: number;
  preference: NutritionPreference;
  biotype?: Biotype;
  applyBiotypeAdjustment?: boolean;
};

export type Macros = {
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type MealFood = {
  id: string;
  name: string;
  grams: number;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  substitutions?: Array<{
    id: string;
    name: string;
    grams: number;
  }>;
};

export type Meal = {
  name: string;
  time: string;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  items: MealFood[];
};

function round(n: number) {
  return Math.round(n);
}

export function adjustMacrosByBiotype(
  macros: Macros,
  targetKcal: number,
  biotype: Biotype
): Macros {
  let carbAdjustPct = 0;
  let fatAdjustPct = 0;

  switch (biotype) {
    case "ectomorfo":
      carbAdjustPct = 0.1;
      fatAdjustPct = -0.05;
      break;
    case "endomorfo":
      carbAdjustPct = -0.1;
      fatAdjustPct = 0.05;
      break;
    case "misto":
      carbAdjustPct = 0.05;
      fatAdjustPct = -0.02;
      break;
    case "mesomorfo":
    default:
      return macros;
  }

  const currentCarbKcal = macros.carbsG * 4;
  const currentFatKcal = macros.fatG * 9;

  const newCarbKcal = currentCarbKcal * (1 + carbAdjustPct);
  const newFatKcal = currentFatKcal * (1 + fatAdjustPct);

  const newCarbsG = newCarbKcal / 4;
  const newFatG = newFatKcal / 9;

  const totalKcal = macros.proteinG * 4 + newCarbKcal + newFatKcal;

  if (Math.abs(totalKcal - targetKcal) > 50) {
    const diff = totalKcal - targetKcal;
    const carbAdjust = diff / 4;
    return {
      proteinG: macros.proteinG,
      carbsG: round(newCarbsG - carbAdjust),
      fatG: round(newFatG),
    };
  }

  return {
    proteinG: macros.proteinG,
    carbsG: round(newCarbsG),
    fatG: round(newFatG),
  };
}

export function computeMacros(input: NutritionInput): Macros {
  const {
    targetKcal,
    goal,
    weightKg,
    preference,
    biotype,
    applyBiotypeAdjustment = true,
  } = input;

  const p = goal === "cut" ? 2.0 : 1.8;
  let fatPerKg = 0.8;

  if (preference === "lowcarb") fatPerKg = 1.0;
  if (preference === "vegetariano" || preference === "vegano") fatPerKg = 0.9;

  const proteinG = p * weightKg;
  const fatG = fatPerKg * weightKg;

  const kcalPF = proteinG * 4 + fatG * 9;
  const carbsKcal = Math.max(0, targetKcal - kcalPF);
  const carbsG = carbsKcal / 4;

  let macros: Macros = {
    proteinG: round(proteinG),
    fatG: round(fatG),
    carbsG: round(carbsG),
  };

  if (biotype && applyBiotypeAdjustment) {
    macros = adjustMacrosByBiotype(macros, targetKcal, biotype);
  }

  return macros;
}

/* =========================
   HELPERS DE ALIMENTOS
========================= */

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

export function scaleMacrosPer100g(
  macrosPor100g: MacrosPer100g,
  gramas: number
): MacroTotals {
  const fator = gramas / 100;
  return {
    calorias: Math.round(macrosPor100g.calorias * fator),
    proteinas: mfRound1(macrosPor100g.proteinas * fator),
    carboidratos: mfRound1(macrosPor100g.carboidratos * fator),
    gorduras: mfRound1(macrosPor100g.gorduras * fator),
  };
}

export function sumAlimentosTotals(
  alimentos: Array<{
    calorias: number;
    proteinas: number;
    carboidratos: number;
    gorduras: number;
  }>
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

export function sumKcalFromRefeicoes(
  refeicoes: Array<{ alimentos: Array<{ calorias: number }> }>
): number {
  return refeicoes.reduce((acc, r) => {
    const kcal = r.alimentos.reduce((a, x) => a + Number(x.calorias || 0), 0);
    return acc + kcal;
  }, 0);
}

/* =========================
   GERAÇÃO REAL DE REFEIÇÕES
========================= */

type FoodDbItem = {
  id: string;
  nome: string;
  categoria:
    | "carboidrato"
    | "proteina"
    | "proteina-vegetal"
    | "legume"
    | "folhoso"
    | "fruta"
    | "gordura"
    | "laticinio";
  porcaoPadrao: number;
  macrosPor100g: {
    calorias: number;
    proteinas: number;
    carboidratos: number;
    gorduras: number;
  };
  substituicoes: string[];
  vegano: boolean;
  vegetariano: boolean;
};

type BuildRealMealPlanInput = {
  targetKcal: number;
  macros: Macros;
  preference: NutritionPreference;
  mealNames?: string[];
  foodDatabase: FoodDbItem[];
};

function scaleFood(food: FoodDbItem, grams: number) {
  const fator = grams / 100;
  return {
    id: food.id,
    name: food.nome,
    grams,
    kcal: Math.round(food.macrosPor100g.calorias * fator),
    proteinG: Math.round(food.macrosPor100g.proteinas * fator * 10) / 10,
    carbsG: Math.round(food.macrosPor100g.carboidratos * fator * 10) / 10,
    fatG: Math.round(food.macrosPor100g.gorduras * fator * 10) / 10,
  };
}

function buildSubstitutions(food: FoodDbItem, db: FoodDbItem[]) {
  return (food.substituicoes || [])
    .map((id) => db.find((x) => x.id === id))
    .filter((x): x is FoodDbItem => Boolean(x))
    .slice(0, 5)
    .map((x) => ({
      id: x.id,
      name: x.nome,
      grams: x.porcaoPadrao,
    }));
}

function getAllowedFoods(
  db: FoodDbItem[],
  preference: NutritionPreference
): FoodDbItem[] {
  if (preference === "vegano") {
    return db.filter((f) => f.vegano);
  }

  if (preference === "vegetariano") {
    return db.filter((f) => f.vegetariano);
  }

  return db;
}

function firstByCategory(
  db: FoodDbItem[],
  category: FoodDbItem["categoria"],
  idsPriority: string[]
): FoodDbItem | undefined {
  for (const id of idsPriority) {
    const found = db.find((f) => f.id === id && f.categoria === category);
    if (found) return found;
  }
  return db.find((f) => f.categoria === category);
}

function resolveMealTimes(mealNames: string[]) {
  return mealNames.map((name) => {
    const n = String(name).toLowerCase();
    if (n.includes("desjejum")) return "06:00";
    if (n.includes("café") || n.includes("cafe")) return "08:00";
    if (n.includes("almoço") || n.includes("almoco")) return "12:00";
    if (n.includes("lanche")) return "16:00";
    if (n.includes("jantar")) return "20:00";
    if (n.includes("ceia")) return "22:00";
    return "08:00";
  });
}

export function buildRealMealPlan(input: BuildRealMealPlanInput): Meal[] {
  const {
    targetKcal,
    preference,
    mealNames = ["Café da manhã", "Almoço", "Lanche", "Jantar"],
    foodDatabase,
  } = input;

  const allowed = getAllowedFoods(foodDatabase, preference);

  const isVegan = preference === "vegano";
  const isVegetarian = preference === "vegetariano";
  const isLowCarb = preference === "lowcarb";

  const carbMorning = isLowCarb
    ? ["aveia", "morango", "maca", "banana"]
    : ["aveia", "banana", "maca", "mamao", "abacaxi"];

  const carbLunch = isLowCarb
    ? ["batata-doce", "quinoa", "arroz-integral"]
    : ["arroz-integral", "arroz-branco", "batata-doce", "macarrao-integral", "quinoa"];

  const proteinAnimal = ["frango-peito", "peixe-tilapia", "atum", "peru", "ovo"];
  const proteinVeg = ["tofu", "tempeh", "proteina-texturizada", "lentilha", "grao-de-bico"];

  const breakfastProtein = isVegan || isVegetarian ? proteinVeg : ["iogurte-grego", "ovo", "queijo-cottage", ...proteinAnimal];
  const mainProtein = isVegan || isVegetarian ? proteinVeg : proteinAnimal;
  const snackProtein = isVegan ? ["tofu", "proteina-texturizada"] : isVegetarian ? ["iogurte-grego", "queijo-cottage", "ovo", "tofu"] : ["iogurte-grego", "queijo-cottage", "atum", "ovo"];
  const fatPool = ["azeite", "castanhas", "abacate"];
  const veggiePool = ["brocolis", "abobrinha", "couve-flor", "vagem"];
  const leafyPool = ["alface", "rucula", "espinafre", "couve", "agriao"];
  const fruitPool = isLowCarb ? ["morango", "maca"] : ["banana", "maca", "mamao", "morango", "abacaxi"];

  const times = resolveMealTimes(mealNames);
  const splits =
    mealNames.length === 6
      ? [0.12, 0.18, 0.26, 0.14, 0.22, 0.08]
      : mealNames.length === 5
      ? [0.18, 0.27, 0.15, 0.25, 0.15]
      : [0.25, 0.3, 0.2, 0.25];

  return mealNames.map((mealName, i) => {
    const pct = splits[i] ?? 1 / mealNames.length;
    const targetMealKcal = Math.round(targetKcal * pct);

    const mealNameLower = mealName.toLowerCase();

    const foods: MealFood[] = [];

    const pushFood = (food?: FoodDbItem, grams?: number) => {
      if (!food || !grams) return;
      const scaled = scaleFood(food, grams);
      foods.push({
        ...scaled,
        substitutions: buildSubstitutions(food, allowed),
      });
    };

    if (mealNameLower.includes("café") || mealNameLower.includes("cafe") || mealNameLower.includes("desjejum")) {
      pushFood(firstByCategory(allowed, "carboidrato", carbMorning), isLowCarb ? 35 : 50);
      pushFood(
        firstByCategory(
          allowed,
          isVegan || isVegetarian ? "proteina-vegetal" : "laticinio",
          breakfastProtein
        ) ??
          firstByCategory(allowed, isVegan || isVegetarian ? "proteina-vegetal" : "proteina", breakfastProtein),
        isLowCarb ? 120 : 150
      );
      pushFood(firstByCategory(allowed, "fruta", fruitPool), isLowCarb ? 80 : 120);
      pushFood(firstByCategory(allowed, "gordura", fatPool), 15);
    } else if (mealNameLower.includes("almoço") || mealNameLower.includes("almoco") || mealNameLower.includes("jantar")) {
      pushFood(firstByCategory(allowed, "carboidrato", carbLunch), isLowCarb ? 90 : 140);
      pushFood(
        firstByCategory(
          allowed,
          isVegan || isVegetarian ? "proteina-vegetal" : "proteina",
          mainProtein
        ),
        isLowCarb ? 170 : 150
      );
      pushFood(firstByCategory(allowed, "legume", veggiePool), 100);
      pushFood(firstByCategory(allowed, "folhoso", leafyPool), 50);
      pushFood(firstByCategory(allowed, "gordura", fatPool), 10);
    } else if (mealNameLower.includes("lanche")) {
      pushFood(firstByCategory(allowed, "fruta", fruitPool), isLowCarb ? 80 : 120);
      pushFood(
        firstByCategory(
          allowed,
          isVegan ? "proteina-vegetal" : isVegetarian ? "laticinio" : "laticinio",
          snackProtein
        ) ??
          firstByCategory(allowed, isVegan ? "proteina-vegetal" : "proteina", snackProtein),
        isLowCarb ? 120 : 140
      );
      pushFood(firstByCategory(allowed, "gordura", fatPool), 15);
    } else if (mealNameLower.includes("ceia")) {
      pushFood(
        firstByCategory(
          allowed,
          isVegan ? "proteina-vegetal" : "laticinio",
          isVegan ? ["tofu", "tempeh"] : ["queijo-cottage", "iogurte-grego", "ovo"]
        ) ??
          firstByCategory(allowed, isVegan ? "proteina-vegetal" : "proteina", ["ovo"]),
        100
      );
      pushFood(firstByCategory(allowed, "fruta", ["morango", "maca"]), 80);
    } else {
      pushFood(firstByCategory(allowed, "carboidrato", carbLunch), 100);
      pushFood(
        firstByCategory(
          allowed,
          isVegan || isVegetarian ? "proteina-vegetal" : "proteina",
          mainProtein
        ),
        140
      );
      pushFood(firstByCategory(allowed, "legume", veggiePool), 100);
    }

    const totals = foods.reduce(
      (acc, item) => {
        acc.kcal += item.kcal;
        acc.proteinG += item.proteinG;
        acc.carbsG += item.carbsG;
        acc.fatG += item.fatG;
        return acc;
      },
      { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 }
    );

    return {
      name: mealName,
      time: times[i] ?? "08:00",
      kcal: targetMealKcal || Math.round(totals.kcal),
      proteinG: Math.round(totals.proteinG),
      carbsG: Math.round(totals.carbsG),
      fatG: Math.round(totals.fatG),
      items: foods,
    };
  });
}

/* =========================
   EXPORT / RELATÓRIO
========================= */

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

export function validateDietScience(params: {
  kcalTarget?: number;
  refeicoes: Array<{ alimentos?: any[] }>;
  tolerancePct?: number;
}): { ok: boolean; deltaKcal: number; pct: number; message: string } {
  const tol = Number.isFinite(params.tolerancePct) ? Number(params.tolerancePct) : 10;
  const totals = sumMacrosFromRefeicoes(params.refeicoes ?? []);
  const target = Number(params.kcalTarget);
  if (!Number.isFinite(target) || target <= 0) {
    return { ok: true, deltaKcal: 0, pct: 0, message: "Sem alvo calórico definido — check informativo." };
  }
  const delta = totals.calorias - target;
  const pct = (Math.abs(delta) / target) * 100;
  const ok = pct <= tol;
  const signal = ok ? "OK" : "ATENÇÃO";
  const msg = ok
    ? `${signal}: soma do dia ≈ alvo (${totals.calorias} vs ${Math.round(target)} kcal, Δ ${Math.round(delta)} kcal)`
    : `${signal}: soma do dia difere do alvo (${totals.calorias} vs ${Math.round(target)} kcal, Δ ${Math.round(delta)} kcal | ${pct.toFixed(1)}%)`;
  return { ok, deltaKcal: Math.round(delta), pct: Number(pct.toFixed(1)), message: msg };
}

export function buildDietExportPayload(params: {
  stateLike: any;
  nutricao: any;
  tolerancePct?: number;
}) {
  const nutricao = params.nutricao ?? {};
  const refeicoes = nutricao.refeicoes ?? [];
  const macrosTarget = nutricao.macros ?? {};
  const kcalTarget = macrosTarget.calorias;

  const totals = sumMacrosFromRefeicoes(refeicoes);
  const pesoKg = guessPesoKgFromStateLike(params.stateLike);
  const science = validateDietScience({
    kcalTarget,
    refeicoes,
    tolerancePct: params.tolerancePct ?? 10,
  });

  const title = "DRMINDSETFIT — PLANO NUTRICIONAL (EXPORT)";

  const summaryLines: string[] = [
    "Resumo do dia (consolidado)",
    `Calorias (refeições): ${totals.calorias} kcal`,
    `Proteínas: ${totals.proteinas.toFixed(1)} g`,
    `Carboidratos: ${totals.carboidratos.toFixed(1)} g`,
    `Gorduras: ${totals.gorduras.toFixed(1)} g`,
    pesoKg ? `Peso (inferido): ${pesoKg.toFixed(1)} kg` : "Peso (inferido): indisponível",
    kcalTarget != null ? `Meta calórica: ${kcalTarget} kcal` : "Meta calórica: indisponível",
    science.ok
      ? `Check científico: OK (diferença ${science.pct.toFixed(1)}%)`
      : `Check científico: ALERTA (diferença ${science.pct.toFixed(1)}% | tolerância ${(params.tolerancePct ?? 10)}%)`,
  ];

  const mealsLines: string[] = [];
  for (const r of refeicoes) {
    const nome = r?.nome ?? "Refeição";
    const horario = r?.horario ? ` (${r.horario})` : "";
    mealsLines.push(`\n• ${nome}${horario}`);

    const alimentos = r?.alimentos ?? [];
    if (!alimentos.length) {
      mealsLines.push("  - (sem alimentos cadastrados)");
      continue;
    }

    const refeicaoTotals = sumAlimentosTotals(alimentos);

    mealsLines.push(
      `  Totais: ${refeicaoTotals.calorias} kcal | P ${refeicaoTotals.proteinas.toFixed(1)}g | C ${refeicaoTotals.carboidratos.toFixed(1)}g | G ${refeicaoTotals.gorduras.toFixed(1)}g`
    );

    for (const a of alimentos) {
      const nomeA = a?.nome ?? "Alimento";
      const g = a?.gramas != null ? `${a.gramas}g` : "";
      const kcal = a?.calorias != null ? `${a.calorias} kcal` : "";
      const p = a?.proteinas != null ? `P ${Number(a.proteinas).toFixed(1)}g` : "";
      const c = a?.carboidratos != null ? `C ${Number(a.carboidratos).toFixed(1)}g` : "";
      const f = a?.gorduras != null ? `G ${Number(a.gorduras).toFixed(1)}g` : "";
      const parts = [g, kcal, p, c, f].filter(Boolean).join(" | ");
      mealsLines.push(`  - ${nomeA}${parts ? " — " + parts : ""}`);

      const subs = a?.substituicoes ?? a?.substitutos ?? [];
      if (Array.isArray(subs) && subs.length) {
        mealsLines.push("    Substituições:");
        for (const s2 of subs.slice(0, 6)) {
          const n2 = s2?.nome ?? "Opção";
          const g2 = s2?.gramas != null ? `${s2.gramas}g` : "";
          mealsLines.push(`      • ${n2}${g2 ? " — " + g2 : ""}`);
        }
      }
    }
  }

  const notesLines: string[] = [
    "",
    "Observações científicas rápidas:",
    "- Proteína: priorize distribuição ao longo do dia.",
    "- Carboidratos: ajuste conforme treino e performance.",
    "- Gorduras: mantenha mínimo fisiológico adequado.",
    "- Hidratação e fibra: essenciais para adesão.",
  ];

  return { title, summaryLines, mealsLines, notesLines };
}

export function buildDietExportTextPhase3E(params: {
  stateLike: any;
  nutricao: any;
  tolerancePct?: number;
}): string {
  const nutricao = params?.nutricao ?? {};
  const refeicoes = Array.isArray(nutricao?.refeicoes) ? nutricao.refeicoes : [];
  const lines: string[] = [];

  lines.push("MINDSETFIT — PLANO NUTRICIONAL (EDITÁVEL)");
  lines.push("");
  lines.push(`Meta (kcal): ${nutricao?.macros?.calorias ?? "—"}`);
  lines.push(
    `P: ${nutricao?.macros?.proteina ?? "—"} g | C: ${nutricao?.macros?.carboidratos ?? "—"} g | G: ${nutricao?.macros?.gorduras ?? "—"} g`
  );
  lines.push("");
  lines.push("REFEIÇÕES");
  lines.push("--------");

  refeicoes.forEach((r: any, i: number) => {
    lines.push(`${i + 1}) ${r?.horario ?? "—"} — ${r?.nome ?? "Refeição"}`);
    const alimentos = Array.isArray(r?.alimentos) ? r.alimentos : [];
    alimentos.forEach((a: any) => {
      const nome = a?.nome ?? a?.alimento ?? "Alimento";
      const qtd = a?.quantidade ?? a?.qtd ?? a?.porcao ?? a?.gramas ?? "";
      const uni = a?.unidade ?? a?.unit ?? (a?.gramas ? "g" : "");
      lines.push(`   - ${nome} ${qtd}${uni}`.trim());
    });
    lines.push("");
  });

  return lines.join("\n");
}

export async function copyTextFallbackPhase3E(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && (navigator as any).clipboard?.writeText) {
      await (navigator as any).clipboard.writeText(text);
      return true;
    }
  } catch {}

  try {
    if (typeof document !== "undefined") {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "true");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      ta.style.top = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok === true;
    }
  } catch {}

  return false;
}