import { computeMetabolic } from "@/engine/metabolic/MetabolicEngine";
import { computeMacros, buildMealPlan } from "@/engine/nutrition/NutritionEngine";
import { buildWorkoutWeek, Modality } from "@/engine/workout/WorkoutEngine";
import { generateSmartTraining } from "@/engine/training/orchestrator/generateSmartTraining";
import { trainingPlanToWorkoutAdapter } from "@/engine/training/adapters/trainingPlanToWorkoutAdapter";

import { persistTrainingPlanToActivePlan } from "./training/activePlan.trainingWriter";

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
    [k: string]: any;
  };

  training?: {
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
    localStorage.setItem(ACTIVE_PLAN_KEY, JSON.stringify(plan));
    try { persistTrainingPlanToActivePlan(); } catch {}
    try {
      persistTrainingPlanToActivePlan();
    } catch {}
  } catch {}
}

export function loadActivePlan(): ActivePlanV1 | null {
  try {
    const r = localStorage.getItem(ACTIVE_PLAN_KEY);
    return r ? (JSON.parse(r) as ActivePlanV1) : null;
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

function buildLegacyWorkoutFallback(step3: any, step5: any, step6: any) {
  const modalities = (step5?.modalidades || step5?.modalities || ["musculacao"]) as Modality[];
  const levelRaw = String(step3?.nivel || step3?.level || "iniciante").toLowerCase();
  const level = (
    levelRaw.includes("avan")
      ? "avancado"
      : levelRaw.includes("inter")
        ? "intermediario"
        : "iniciante"
  ) as "iniciante" | "intermediario" | "avancado";

  const daysByModality = (step6?.diasPorModalidade || step6?.daysByModality || {}) as Record<Modality, string[]>;

  return buildWorkoutWeek({ modalities, level, daysByModality });
}

function buildWorkoutFromSmartEngine(draft: PlanDraft, step3: any, step5: any, step6: any) {
  try {
    const smartPlan = generateSmartTraining(draft as any);
    const adaptedWorkout = trainingPlanToWorkoutAdapter(smartPlan);

    return {
      ...adaptedWorkout,
      legacyFallbackShape: buildLegacyWorkoutFallback(step3, step5, step6),
    };
  } catch {
    return buildLegacyWorkoutFallback(step3, step5, step6);
  }
}

export function buildActivePlanFromDraft(draft: PlanDraft): ActivePlanV1 {
  const __mfAny: any = (draft as any) || {};
  const __mfStep5 = (__mfAny.step5 ?? __mfAny.step5Modalidades ?? {}) as any;
  const __mfStep6 = (__mfAny.step6 ?? __mfAny.step6DiasSemana ?? {}) as any;
  const __mfStep7 = (__mfAny.step7 ?? __mfAny.step7Preferencias ?? {}) as any;

  const step1 = draft.step1 || {};
  const step2 = draft.step2 || {};
  const step3 = draft.step3 || {};
  const step5 = __mfStep5 || {};
  const step6 = __mfStep6 || {};
  const step7 = __mfStep7 || {};

  const weightKg = Number(step2?.peso || step2?.weight || 80);
  const heightCm = Number(step2?.altura || step2?.height || 175);
  const ageYears = Number(step1?.idade || step1?.age || 28);
  const gender = normGender(step1?.sexo || step1?.gender);

  const goalRaw = String(step1?.objetivo || step1?.goal || "maintain").toLowerCase();
  const goal =
    goalRaw.includes("emag") || goalRaw.includes("cut")
      ? "cut"
      : goalRaw.includes("gan") || goalRaw.includes("bulk")
        ? "bulk"
        : "maintain";

  const activityFactor = activityFactorFromWeeklyFrequency(
    step3?.frequenciaSemanal || step3?.frequencia || step3?.atividade,
function normalizeGoal(goalRaw: string): "cut" | "bulk" | "maintain" {
  const g = String(goalRaw || "").toLowerCase();

  if (g.includes("emag") || g.includes("cut") || g.includes("deficit")) {
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

function normalizePreference(prefRaw: string): "flexivel" | "lowcarb" | "vegetariana" {
  const p = String(prefRaw || "").toLowerCase();

  if (p.includes("low")) return "lowcarb";
  if (p.includes("veg")) return "vegetariana";
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

export function buildActivePlanFromDraft(draft: PlanDraft): ActivePlanV1 {
  const anyDraft: any = draft || {};

  const step1 = anyDraft.step1 || {};
  const step2 = anyDraft.step2 || {};
  const step3 = anyDraft.step3 || {};
  const step4 = anyDraft.step4 || {};
  const step5 = anyDraft.step5 ?? anyDraft.step5Modalidades ?? {};
  const step6 = anyDraft.step6 ?? anyDraft.step6DiasSemana ?? {};
  const step7 = anyDraft.step7 ?? anyDraft.step7Preferencias ?? {};

  const weightKg = Number(
    step2?.peso ??
      step1?.pesoAtual ??
      step1?.weightKg ??
      step2?.weight ??
      80
  );

  const heightCm = Number(
    step2?.altura ??
      step1?.altura ??
      step1?.heightCm ??
      step2?.height ??
      175
  );

  const ageYears = Number(step1?.idade ?? step1?.age ?? 28);
  const gender = normGender(step1?.sexo ?? step1?.gender);

  const goal = normalizeGoal(step1?.objetivo ?? step4?.estrategia ?? "maintain");

  const activityFactor = activityFactorFromWeeklyFrequency(
    step2?.frequenciaAtividadeSemanal ??
      step3?.frequenciaSemanal ??
      step3?.frequencia ??
      step3?.atividade
  );

  const preference = normalizePreference(
    step7?.dieta ?? step7?.preference ?? "flexivel"
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
        undefined,
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
        undefined,
          step2?.fatFreeMassKg ??
          step2?.ffm ??
          step2?.magraKg ??
          undefined
      ) || undefined,
    activityLevel: (
      String(step3?.nivelAtividade ?? step3?.activityLevel ?? "").toLowerCase() || undefined
    ) as any,
    isAthlete: Boolean(
      String(step3?.nivelAtividade ?? step3?.activityLevel ?? "").toLowerCase().includes("athlete") ||
      String(step3?.nivel ?? "").toLowerCase().includes("avanc"),
      String(step3?.nivelAtividade ?? step3?.activityLevel ?? "")
        .toLowerCase()
        .includes("athlete") ||
        String(step3?.nivel ?? "").toLowerCase().includes("avanc")
    ),
    activityFactor,
    goal,
  });

  const pref = String(step7?.dieta || step7?.preference || "flexivel").toLowerCase() as any;
  const preference = (
    pref.includes("low")
      ? "lowcarb"
      : pref.includes("veg")
        ? "vegetariana"
        : "flexivel"
  ) as "flexivel" | "lowcarb" | "vegetariana";
  const step4Macros = step4?.macros ?? {};

  const hasRealStep4Macros =
    Number(step4Macros?.proteina ?? 0) > 0 ||
    Number(step4Macros?.carboidratos ?? 0) > 0 ||
    Number(step4Macros?.gorduras ?? 0) > 0;

  const computedMacrosRaw: any = computeMacros({
    targetKcal: (metabolic as any)?.targetKcal,
    goal,
    weightKg,
    preference,
  });

  const normalizedComputedMacros = {
    proteinG: Number(computedMacrosRaw?.proteinG ?? computedMacrosRaw?.proteina ?? 0),
    carbsG: Number(
      computedMacrosRaw?.carbsG ??
        computedMacrosRaw?.carbG ??
        computedMacrosRaw?.carboidratos ??
        0
    ),
    fatG: Number(computedMacrosRaw?.fatG ?? computedMacrosRaw?.gorduras ?? 0),
    targetKcal: Number(
      computedMacrosRaw?.targetKcal ??
        computedMacrosRaw?.calorias ??
        (metabolic as any)?.targetKcal ??
        0
    ),
  };

  const macros = hasRealStep4Macros
    ? {
        proteinG: Number(step4Macros?.proteina ?? 0),
        carbsG: Number(step4Macros?.carboidratos ?? 0),
        fatG: Number(step4Macros?.gorduras ?? 0),
        targetKcal: Number(
          step4Macros?.calorias ?? step4?.kcalAlvo ?? (metabolic as any)?.targetKcal
        ),
      }
    : normalizedComputedMacros;

  const hasRealMeals =
    Array.isArray(step4?.refeicoes) && step4.refeicoes.length > 0;

  const workout = buildWorkoutFromSmartEngine(draft, step3, step5, step6);
  const meals = hasRealMeals
    ? step4.refeicoes
    : buildMealPlan(
        Number(step4?.kcalAlvo ?? (metabolic as any)?.targetKcal),
        macros as any
      );

  const primaryModality = mapPrimaryModality(step5?.primary);
  const modalities: Modality[] = [primaryModality];

  const level = normalizeLevel(
    step1?.nivelTreino ??
      step3?.nivel ??
      step3?.level ??
      "iniciante"
  );

  const selectedDays = Array.isArray(step6?.days) ? step6.days : [];

  const daysByModality = {
    [modalities[0]]: selectedDays,
  } as Record<Modality, string[]>;

  const workout = buildWorkoutWeek({
    modalities,
    level,
    daysByModality,
  });

  const targetKcal = Number(
    step4?.kcalAlvo ??
      step4?.macros?.calorias ??
      macros?.targetKcal ??
      (metabolic as any)?.targetKcal ??
      0
  );

  const nutritionMacros = {
    proteina: Number(step4?.macros?.proteina ?? macros?.proteinG ?? 0),
    carboidratos: Number(step4?.macros?.carboidratos ?? macros?.carbsG ?? 0),
    gorduras: Number(step4?.macros?.gorduras ?? macros?.fatG ?? 0),
    calorias: Number(
      step4?.macros?.calorias ??
        step4?.kcalAlvo ??
        macros?.targetKcal ??
        targetKcal
    ),

    protein: Number(step4?.macros?.proteina ?? macros?.proteinG ?? 0),
    carbs: Number(step4?.macros?.carboidratos ?? macros?.carbsG ?? 0),
    fat: Number(step4?.macros?.gorduras ?? macros?.fatG ?? 0),
    targetKcal: Number(
      step4?.macros?.calorias ??
        step4?.kcalAlvo ??
        macros?.targetKcal ??
        targetKcal
    ),
  };

  const normalizedMeals = Array.isArray(meals) ? meals : [];

  return {
    version: "v1",
    createdAt: new Date().toISOString(),

    metabolic: {
      ...(metabolic as any),
      targetKcal,
    },

    macros,
    meals: normalizedMeals,
    workout,

    nutrition: {
      kcalTarget: targetKcal,
      kcal: targetKcal,
      macros: nutritionMacros,
      refeicoes: normalizedMeals,
      meals: normalizedMeals,
      strategy: step4?.estrategia ?? goal,
      preference,
    },

    training: {
      modality: String(step5?.primary ?? "musculacao"),
      frequency: selectedDays.length,
      week: (workout as any)?.week ?? (workout as any)?.days ?? [],
      days: (workout as any)?.days ?? (workout as any)?.week ?? [],
      selectedDays,
      level,
    },

    draft,
  };
}