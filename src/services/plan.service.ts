import { computeMetabolic } from "@/engine/metabolic/MetabolicEngine";
import { computeMacros } from "@/engine/nutrition/NutritionEngine";
import { buildWorkoutWeek, Modality } from "@/engine/workout/WorkoutEngine";
import {
  ALIMENTOS_DATABASE,
  buscarAlimento,
  calcularMacros,
  type AlimentoDatabase,
} from "@/types/alimentos";
import { generateSmartTraining } from "@/engine/training/orchestrator/generateSmartTraining";
import { ensureTrainingPlanInActivePlan } from "./training/trainingPlan.ssot";
import { saveSmartTrainingPlan } from "@/services/training/trainingEngine.storage";

export type ActivePlanV1 = {
  version: "v1";
  createdAt: string;
  createdAtISO?: string;

  metabolic?: {
    bmrKcal?: number;
    tdeeKcal?: number;
    targetKcal?: number;
    [k: string]: any;
  };

  macros?: {
    proteinG?: number;
    carbsG?: number;
    carbG?: number;
    fatG?: number;
    targetKcal?: number;
    [k: string]: any;
  };

  meals?: any;
  workout?: any;

  nutrition?: {
    kcalTarget?: number;
    kcal?: number;
    macros?: {
      proteina?: number;
      carboidratos?: number;
      gorduras?: number;
      calorias?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
      targetKcal?: number;
      [k: string]: any;
    };
    refeicoes?: any[];
    meals?: any[];
    strategy?: string;
    preference?: string;
    restrictions?: string[];
    [k: string]: any;
  };

  training?: {
    smartPlan?: any;
    workouts?: any[];
    execution?: {
      currentSession?: any | null;
      history?: any[];
      exercisePerformance?: any[];
    };
    modality?: string;
    frequency?: number;
    week?: any[];
    days?: any[];
    selectedDays?: string[];
    level?: string;
    [k: string]: any;
  };

  draft?: PlanDraft;
};

export type PlanDraft = {
  step1?: any;
  step2?: any;
  step3?: any;
  step4?: any;
  step5?: any;
  step6?: any;
  step7?: any;
};

const ACTIVE_PLAN_KEY = "mf:activePlan:v1";

export function saveActivePlan(plan: ActivePlanV1) {
  try {
    const normalized = ensureTrainingPlanInActivePlan(plan);
    localStorage.setItem(ACTIVE_PLAN_KEY, JSON.stringify(normalized));
  } catch {}
}

export function loadActivePlan(): ActivePlanV1 | null {
  try {
    const r = localStorage.getItem(ACTIVE_PLAN_KEY);
    if (!r) return null;
    return ensureTrainingPlanInActivePlan(JSON.parse(r) as ActivePlanV1) as ActivePlanV1;
  } catch {
    return null;
  }
}

function normGender(g: any): "male" | "female" | "other" {
  const v = String(g || "").toLowerCase();
  if (v === "male" || v.includes("masc")) return "male";
  if (v === "female" || v.includes("fem")) return "female";
  return "other";
}

export function activityFactorFromWeeklyFrequency(freq: any): number {
  const v = String(freq || "").toLowerCase();

  if (v.includes("sed")) return 1.2;
  if (v.includes("1") || v.includes("2") || v.includes("3")) return 1.375;
  if (v.includes("4") || v.includes("5")) return 1.55;
  if (v.includes("+") || v.includes("muito") || v.includes("6") || v.includes("7")) return 1.725;

  return 1.375;
}

function normalizeGoal(goalRaw: any): "cut" | "bulk" | "maintain" {
  const g = String(goalRaw || "").toLowerCase();

  if (
    g.includes("emag") ||
    g.includes("cut") ||
    g.includes("deficit") ||
    g.includes("perder")
  ) {
    return "cut";
  }

  if (
    g.includes("hipertrof") ||
    g.includes("gan") ||
    g.includes("bulk") ||
    g.includes("superavit")
  ) {
    return "bulk";
  }

  return "maintain";
}

function normalizePreference(
  prefRaw: string
): "flexivel" | "lowcarb" | "vegetariano" | "vegana" | "onivoro" {
  const p = String(prefRaw || "").toLowerCase();

  if (p.includes("low")) return "lowcarb";
  if (p.includes("vegano")) return "vegana";
  if (p.includes("veget")) return "vegetariano";
  if (p.includes("oniv")) return "onivoro";
  return "flexivel";
}

function mapPrimaryModality(raw: any): Modality {
  const v = String(raw || "musculacao").toLowerCase();

  const map: Record<string, Modality> = {
    musculacao: "musculacao" as Modality,
    corrida: "corrida" as Modality,
    bike: "bike" as Modality,
    funcional: "funcional" as Modality,
    cross: "crossfit" as Modality,
    crossfit: "crossfit" as Modality,
    spinning: "bike" as Modality,
  };

  return map[v] ?? ("musculacao" as Modality);
}

function normalizeLevel(raw: any): "iniciante" | "intermediario" | "avancado" {
  const v = String(raw || "").toLowerCase();

  if (v.includes("avan")) return "avancado";
  if (v.includes("inter")) return "intermediario";
  return "iniciante";
}

function normalizeRestrictions(raw: any): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => String(x || "").toLowerCase()).filter(Boolean);
}

function getDaysByModalityFromDraft(step5: any, step6: any) {
  const fromStep6 = step6?.diasPorModalidade || step6?.daysByModality;
  if (fromStep6 && typeof fromStep6 === "object") return fromStep6;

  const fromStep5 = step5?.diasPorModalidade || step5?.daysByModality;
  if (fromStep5 && typeof fromStep5 === "object") return fromStep5;

  return {};
}

function getSelectedDaysFromDraft(step5: any, step6: any): string[] {
  if (Array.isArray(step6?.days) && step6.days.length) {
    return step6.days.map(String);
  }

  const byModality = getDaysByModalityFromDraft(step5, step6);
  const uniqueDays = new Set<string>();

  for (const days of Object.values(byModality)) {
    if (!Array.isArray(days)) continue;
    for (const day of days) {
      const value = String(day || "").trim();
      if (value) uniqueDays.add(value);
    }
  }

  return Array.from(uniqueDays);
}

function buildLegacyWorkoutFallback(step3: any, step5: any, step6: any) {
  const primary = mapPrimaryModality(step5?.primary);
  const modalidadesRaw = Array.isArray(step5?.modalidades)
    ? step5.modalidades
    : Array.isArray(step5?.modalities)
      ? step5.modalities
      : [primary];

  const modalities = modalidadesRaw.map(mapPrimaryModality) as Modality[];

  const level = normalizeLevel(
    step3?.nivel ??
      step3?.level ??
      step3?.condicionamento ??
      "iniciante"
  );

  const daysByModality = getDaysByModalityFromDraft(step5, step6) as Record<Modality, string[]>;

  return buildWorkoutWeek({
    modalities: modalities.length ? modalities : [primary],
    level,
    daysByModality,
  });
}

function buildTrainingPayloadFromSmartEngine(draft: PlanDraft, step3: any, step5: any, step6: any) {
  try {
    const smartPlan = generateSmartTraining(draft as any);
    saveSmartTrainingPlan(smartPlan.plan);

    const base = {
      training: {
        smartPlan: smartPlan.plan,
      },
      workout: {
        legacyFallbackShape: buildLegacyWorkoutFallback(step3, step5, step6),
      },
      draft,
    };

    const normalized = ensureTrainingPlanInActivePlan(base as any);

    return {
      training: normalized.training,
      workout: normalized.workout,
    };
  } catch {
    return {
      training: {
        smartPlan: null,
        workouts: [],
      },
      workout: buildLegacyWorkoutFallback(step3, step5, step6),
    };
  }
}

function pickAllowedFoods(params: {
  preference: string;
  restrictions: string[];
}): AlimentoDatabase[] {
  const { preference, restrictions } = params;

  return ALIMENTOS_DATABASE.filter((food) => {
    if (preference === "vegana" && !food.vegano) return false;
    if (preference === "vegetariano" && !food.vegetariano) return false;

    if (restrictions.includes("lactose") && food.semLactose === false) return false;
    if (restrictions.includes("gluten") && food.semGluten === false) return false;
    if (restrictions.includes("ovo") && food.semOvo === false) return false;
    if (restrictions.includes("acucar") && food.semAcucar === false) return false;
    if (restrictions.includes("oleaginosas") && food.semOleaginosas === false) return false;
    if (restrictions.includes("low-sodium") && food.baixoSodio === false) return false;
    if (restrictions.includes("diabetes") && food.baixoIndiceGlicemico === false) return false;

    return true;
  });
}

function pickFoodByIdOrFallback(
  allowedFoods: AlimentoDatabase[],
  preferredIds: string[],
  fallbackCategory?: AlimentoDatabase["categoria"]
): AlimentoDatabase | null {
  for (const id of preferredIds) {
    const found = allowedFoods.find((f) => f.id === id);
    if (found) return found;
  }

  if (fallbackCategory) {
    const fallback = allowedFoods.find((f) => f.categoria === fallbackCategory);
    if (fallback) return fallback;
  }

  return allowedFoods[0] ?? null;
}

function buildFoodItem(foodId: string, grams?: number) {
  const food = buscarAlimento(foodId);
  if (!food) return null;

  const useGrams = Number(grams || food.porcaoPadrao || 100);
  const macros = calcularMacros(foodId, useGrams);
  if (!macros) return null;

  return {
    alimentoId: food.id,
    nome: food.nome,
    gramas: useGrams,
    calorias: macros.calorias,
    proteinas: macros.proteinas,
    carboidratos: macros.carboidratos,
    gorduras: macros.gorduras,
  };
}

function buildMeal(
  name: string,
  horario: string,
  selectedFoods: Array<{ id: string; grams?: number }>
) {
  const alimentos = selectedFoods
    .map((x) => buildFoodItem(x.id, x.grams))
    .filter(Boolean);

  return {
    nome: name,
    horario,
    alimentos,
  };
}

function buildRealMealPlan(params: {
  kcalTarget: number;
  preference: "flexivel" | "lowcarb" | "vegetariano" | "vegana" | "onivoro";
  restrictions: string[];
  selectedMealTypes: string[];
}) {
  const { preference, restrictions, selectedMealTypes } = params;

  const allowedFoods = pickAllowedFoods({ preference, restrictions });

  const isLowCarb = preference === "lowcarb";
  const isVeg = preference === "vegetariano" || preference === "vegana";

  const breakfastProtein = isVeg
    ? pickFoodByIdOrFallback(allowedFoods, ["tofu", "proteina-texturizada"], "proteina-vegetal")
    : pickFoodByIdOrFallback(allowedFoods, ["iogurte-grego", "ovo", "queijo-cottage", "tofu"], "proteina");

  const lunchProtein = isVeg
    ? pickFoodByIdOrFallback(allowedFoods, ["tofu", "proteina-texturizada", "lentilha", "grao-de-bico"], "proteina-vegetal")
    : pickFoodByIdOrFallback(allowedFoods, ["frango-peito", "peixe-tilapia", "atum", "peru"], "proteina");

  const dinnerProtein = isVeg
    ? pickFoodByIdOrFallback(allowedFoods, ["tofu", "lentilha", "grao-de-bico", "feijao-preto"], "proteina-vegetal")
    : pickFoodByIdOrFallback(allowedFoods, ["frango-peito", "peixe-salmao", "peixe-tilapia", "atum"], "proteina");

  const breakfastCarb = isLowCarb
    ? pickFoodByIdOrFallback(allowedFoods, ["morango", "maca", "abacate"], "fruta")
    : pickFoodByIdOrFallback(allowedFoods, ["aveia", "banana", "maca"], "carboidrato");

  const lunchCarb = isLowCarb
    ? pickFoodByIdOrFallback(allowedFoods, ["brocolis", "abobrinha", "couve-flor"], "legume")
    : pickFoodByIdOrFallback(allowedFoods, ["arroz-integral", "quinoa", "batata-doce", "arroz-branco"], "carboidrato");

  const dinnerCarb = isLowCarb
    ? pickFoodByIdOrFallback(allowedFoods, ["abobrinha", "brocolis", "couve-flor"], "legume")
    : pickFoodByIdOrFallback(allowedFoods, ["batata-doce", "quinoa", "arroz-integral", "arroz-branco"], "carboidrato");

  const fruitSnack = pickFoodByIdOrFallback(
    allowedFoods,
    ["morango", "maca", "mamao", "banana", "abacaxi"],
    "fruta"
  );

  const goodFat = pickFoodByIdOrFallback(
    allowedFoods,
    ["castanhas", "abacate", "azeite"],
    "gordura"
  );

  const greens = pickFoodByIdOrFallback(
    allowedFoods,
    ["alface", "rucula", "espinafre", "couve", "agriao"],
    "folhoso"
  );

  const legumes = pickFoodByIdOrFallback(
    allowedFoods,
    ["brocolis", "abobrinha", "couve-flor", "vagem", "cenoura"],
    "legume"
  );

  const mealTemplates: Record<string, any> = {};

  if (selectedMealTypes.includes("desjejum")) {
    mealTemplates["desjejum"] = buildMeal("Desjejum", "06:00", [
      ...(fruitSnack ? [{ id: fruitSnack.id, grams: fruitSnack.porcaoPadrao }] : []),
    ]);
  }

  if (selectedMealTypes.includes("cafe-da-manha")) {
    mealTemplates["cafe-da-manha"] = buildMeal("Café da Manhã", "08:00", [
      ...(breakfastCarb ? [{ id: breakfastCarb.id, grams: breakfastCarb.porcaoPadrao }] : []),
      ...(breakfastProtein ? [{ id: breakfastProtein.id, grams: breakfastProtein.porcaoPadrao }] : []),
      ...(goodFat ? [{ id: goodFat.id, grams: Math.min(goodFat.porcaoPadrao, 30) }] : []),
    ]);
  }

  if (selectedMealTypes.includes("almoco")) {
    mealTemplates["almoco"] = buildMeal("Almoço", "12:00", [
      ...(lunchCarb ? [{ id: lunchCarb.id, grams: lunchCarb.porcaoPadrao }] : []),
      ...(lunchProtein ? [{ id: lunchProtein.id, grams: lunchProtein.porcaoPadrao }] : []),
      ...(greens ? [{ id: greens.id, grams: greens.porcaoPadrao }] : []),
      ...(legumes ? [{ id: legumes.id, grams: legumes.porcaoPadrao }] : []),
      ...(goodFat?.id === "azeite" ? [{ id: "azeite", grams: 10 }] : []),
    ]);
  }

  if (selectedMealTypes.includes("lanche-tarde")) {
    mealTemplates["lanche-tarde"] = buildMeal("Lanche da Tarde", "16:00", [
      ...(fruitSnack ? [{ id: fruitSnack.id, grams: fruitSnack.porcaoPadrao }] : []),
      ...(breakfastProtein ? [{ id: breakfastProtein.id, grams: Math.min(breakfastProtein.porcaoPadrao, 120) }] : []),
      ...(goodFat && goodFat.id !== "azeite" ? [{ id: goodFat.id, grams: Math.min(goodFat.porcaoPadrao, 20) }] : []),
    ]);
  }

  if (selectedMealTypes.includes("jantar")) {
    mealTemplates["jantar"] = buildMeal("Jantar", "20:00", [
      ...(dinnerCarb ? [{ id: dinnerCarb.id, grams: dinnerCarb.porcaoPadrao }] : []),
      ...(dinnerProtein ? [{ id: dinnerProtein.id, grams: dinnerProtein.porcaoPadrao }] : []),
      ...(greens ? [{ id: greens.id, grams: greens.porcaoPadrao }] : []),
      ...(legumes ? [{ id: legumes.id, grams: legumes.porcaoPadrao }] : []),
    ]);
  }

  if (selectedMealTypes.includes("ceia")) {
    const ceiaProtein = isVeg
      ? breakfastProtein
      : pickFoodByIdOrFallback(
          allowedFoods,
          ["queijo-cottage", "iogurte-grego", "tofu"],
          "laticinio"
        );

    mealTemplates["ceia"] = buildMeal("Ceia", "22:00", [
      ...(ceiaProtein ? [{ id: ceiaProtein.id, grams: 100 }] : []),
      ...(fruitSnack ? [{ id: fruitSnack.id, grams: 80 }] : []),
    ]);
  }

  const orderedMealTypes = [
    "desjejum",
    "cafe-da-manha",
    "almoco",
    "lanche-tarde",
    "jantar",
    "ceia",
  ];

  return orderedMealTypes
    .filter((key) => selectedMealTypes.includes(key))
    .map((key) => mealTemplates[key])
    .filter(Boolean);
}

export function buildActivePlanFromDraft(draft: PlanDraft): ActivePlanV1 {
  const anyDraft: any = draft || {};
  const step1 = anyDraft.step1 || {};
  const step2 = anyDraft.step2 || {};
  const step3 = anyDraft.step3 || {};
  const step4 = anyDraft.step4 || {};
  const step5 = anyDraft.step5 ?? anyDraft.step5Modalidades ?? {};
  const step6 = anyDraft.step6 ?? anyDraft.step6DiasSemana ?? {};
  const step7 = anyDraft.step7 ?? anyDraft.step7Preferencias ?? {};

  const weightKg = Number(step2?.peso || step2?.weight || step1?.pesoAtual || 80);
  const heightCm = Number(step2?.altura || step2?.height || step1?.altura || 175);
  const ageYears = Number(step1?.idade || step1?.age || 28);
  const gender = normGender(step1?.sexo || step1?.gender);

  const goal = normalizeGoal(step1?.objetivo || step1?.goal);
  const activityFactor = activityFactorFromWeeklyFrequency(
    step3?.frequenciaSemanal || step3?.frequencia || step3?.atividade
  );

  const restrictions = normalizeRestrictions(
    step4?.restricoes ?? step4?.restrictions ?? []
  );

  const metabolic = computeMetabolic({
    weightKg,
    heightCm,
    ageYears,
    gender,
    bodyFatPercent:
      Number(
        step2?.percentualGordura ??
          step2?.bodyFatPercent ??
          step2?.bf ??
          step2?.gorduraCorporal ??
          step2?.["%gordura"] ??
          undefined
      ) || undefined,
    fatFreeMassKg:
      Number(
        step2?.massaMagra ??
          step2?.fatFreeMassKg ??
          step2?.ffm ??
          step2?.magraKg ??
          undefined
      ) || undefined,
    activityLevel: (
      String(step3?.nivelAtividade ?? step3?.activityLevel ?? "").toLowerCase() || undefined
    ) as any,
    isAthlete: Boolean(
      String(step3?.nivelAtividade ?? step3?.activityLevel ?? "")
        .toLowerCase()
        .includes("athlete") ||
        String(step3?.nivel ?? "").toLowerCase().includes("avanc")
    ),
    activityFactor,
    goal,
  });

  const preference = normalizePreference(
    String(step7?.dieta || step7?.preference || "flexivel")
  );

  const normalizedComputedMacros = computeMacros({
    targetKcal: metabolic.targetKcal,
    goal,
    weightKg,
    preference:
      preference === "vegana" || preference === "vegetariano"
        ? "vegetariano"
        : preference === "lowcarb"
          ? "lowcarb"
          : "flexivel",
  });

  const step4Macros = step4?.macros ?? {};
  const hasRealStep4Macros =
    Number(step4Macros?.proteina ?? 0) > 0 &&
    Number(step4Macros?.carboidratos ?? 0) > 0 &&
    Number(step4Macros?.gorduras ?? 0) >= 0;

  const macros = hasRealStep4Macros
    ? {
        proteinG: Number(step4Macros?.proteina ?? 0),
        carbsG: Number(step4Macros?.carboidratos ?? 0),
        fatG: Number(step4Macros?.gorduras ?? 0),
        targetKcal: Number(
          step4Macros?.calorias ?? step4?.kcalAlvo ?? metabolic?.targetKcal ?? 0
        ),
      }
    : normalizedComputedMacros;

  const selectedMealTypes = Array.isArray(step4?.refeicoesSelecionadas)
    ? step4.refeicoesSelecionadas
    : ["cafe-da-manha", "almoco", "lanche-tarde", "jantar"];

  const meals = buildRealMealPlan({
    kcalTarget: Number(step4?.kcalAlvo ?? metabolic?.targetKcal ?? 2000),
    preference,
    restrictions,
    selectedMealTypes,
  });

  const primaryModality = mapPrimaryModality(step5?.primary);
  const modalitiesRaw = Array.isArray(step5?.modalidades)
    ? step5.modalidades
    : Array.isArray(step5?.modalities)
      ? step5.modalities
      : [primaryModality];

  const modalities = modalitiesRaw.map(mapPrimaryModality) as Modality[];

  const level = normalizeLevel(
    step1?.nivelTreino ??
      step3?.nivel ??
      step3?.level ??
      "iniciante"
  );

  const selectedDays = getSelectedDaysFromDraft(step5, step6);
  const daysByModality = (
    getDaysByModalityFromDraft(step5, step6) ||
    { [modalities[0] ?? primaryModality]: selectedDays }
  ) as Record<Modality, string[]>;

  const workout = buildWorkoutWeek({
    modalities: modalities.length ? modalities : [primaryModality],
    level,
    daysByModality,
  });

  const trainingPayload = buildTrainingPayloadFromSmartEngine(draft, step3, step5, step6);

  const macrosTargetKcal = Number((macros as any)?.targetKcal ?? 0);

    const targetKcal = Number(
      step4?.kcalAlvo ??
        step4?.macros?.calorias ??
        macrosTargetKcal ??
        metabolic?.targetKcal ??
        0
    );

  const nutritionMacros = {
    proteina: Number(step4?.macros?.proteina ?? macros?.proteinG ?? 0),
    carboidratos: Number(step4?.macros?.carboidratos ?? macros?.carbsG ?? 0),
    gorduras: Number(step4?.macros?.gorduras ?? macros?.fatG ?? 0),
    calorias: Number(
      step4?.macros?.calorias ??
        step4?.kcalAlvo ??
        macrosTargetKcal ??
        targetKcal
    ),
    protein: Number(step4?.macros?.proteina ?? macros?.proteinG ?? 0),
    carbs: Number(step4?.macros?.carboidratos ?? macros?.carbsG ?? 0),
    fat: Number(step4?.macros?.gorduras ?? macros?.fatG ?? 0),
    targetKcal: Number(
      step4?.macros?.calorias ??
        step4?.kcalAlvo ??
        macrosTargetKcal ??
        targetKcal
    ),
  };

  const normalizedMeals = Array.isArray(meals) ? meals : [];

  const plan: ActivePlanV1 = {
    version: "v1",
    createdAt: new Date().toISOString(),
    metabolic,
    macros,
    meals: normalizedMeals,
    workout: trainingPayload?.workout ?? workout,

    nutrition: {
      kcalTarget: targetKcal,
      kcal: targetKcal,
      macros: nutritionMacros,
      refeicoes: normalizedMeals,
      meals: normalizedMeals,
      strategy: step4?.estrategia ?? goal,
      preference,
      restrictions,
    },

    training: {
      ...(trainingPayload?.training ?? {}),
      modality: String(step5?.primary ?? "musculacao"),
      frequency: selectedDays.length,
      week: (workout as any)?.week ?? (workout as any)?.days ?? [],
      days: (workout as any)?.days ?? (workout as any)?.week ?? [],
      selectedDays,
      level,
    },

    draft,
  };

  return ensureTrainingPlanInActivePlan(plan) as ActivePlanV1;
}
