import { computeMetabolic } from "@/engine/metabolic/MetabolicEngine";
import { saveSmartTrainingPlan } from "@/services/training/trainingEngine.storage";
import { computeMacros, buildMealPlan } from "@/engine/nutrition/NutritionEngine";
import { buildWorkoutWeek, Modality } from "@/engine/workout/WorkoutEngine";
import { generateSmartTraining } from "@/engine/training/orchestrator/generateSmartTraining";
import { ensureTrainingPlanInActivePlan } from "./training/trainingPlan.ssot";

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
    carbG?: number;
    fatG?: number;
    targetKcal?: number;
    [k: string]: any;
  };

  meals?: any;
  workout?: any;
  training?: {
    smartPlan?: any;
    workouts?: any[];
    execution?: {
      currentSession?: any | null;
      history?: any[];
      exercisePerformance?: any[];
    };
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

function buildTrainingPayloadFromSmartEngine(draft: PlanDraft, step3: any, step5: any, step6: any) {
  try {
    const smartPlan = generateSmartTraining(draft as any);
    saveSmartTrainingPlan(smartPlan.plan);
    saveSmartTrainingPlan(smartPlan.plan);

    const base = {
      training: {
        smartPlan,
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
      ) || undefined,
    fatFreeMassKg:
      Number(
        step2?.massaMagra ??
        step2?.fatFreeMassKg ??
        step2?.ffm ??
        step2?.magraKg ??
        undefined,
      ) || undefined,
    activityLevel: (
      String(step3?.nivelAtividade ?? step3?.activityLevel ?? "").toLowerCase() || undefined
    ) as any,
    isAthlete: Boolean(
      String(step3?.nivelAtividade ?? step3?.activityLevel ?? "").toLowerCase().includes("athlete") ||
      String(step3?.nivel ?? "").toLowerCase().includes("avanc"),
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

  const macros = computeMacros({
    targetKcal: metabolic.targetKcal,
    goal,
    weightKg,
    preference,
  });

  const meals = buildMealPlan(metabolic.targetKcal, macros);
  const trainingPayload = buildTrainingPayloadFromSmartEngine(draft, step3, step5, step6);

  const plan: ActivePlanV1 = {
    version: "v1",
    createdAt: new Date().toISOString(),
    metabolic,
    macros,
    meals,
    training: trainingPayload.training,
    workout: trainingPayload.workout,
    draft,
  };

  return ensureTrainingPlanInActivePlan(plan) as ActivePlanV1;
}
