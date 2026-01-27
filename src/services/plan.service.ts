import { computeMetabolic } from "@/engine/metabolic/MetabolicEngine";
import { computeMacros, buildMealPlan } from "@/engine/nutrition/NutritionEngine";
import { buildWorkoutWeek, Modality } from "@/engine/workout/WorkoutEngine";

export type PlanDraft = {
  step1?: any;
  step2?: any;
  step3?: any;
  step4?: any;
  step5?: any;
  step6?: any;
  step7?: any;
};

export type ActivePlanV1 = {
  version: "v1";
  createdAt: string;
  metabolic: ReturnType<typeof computeMetabolic>;
  macros: ReturnType<typeof computeMacros>;
  meals: ReturnType<typeof buildMealPlan>;
  workout: ReturnType<typeof buildWorkoutWeek>;
  draft: PlanDraft;
};

const ACTIVE_PLAN_KEY = "mf:activePlan:v1";

export function saveActivePlan(plan: ActivePlanV1) {
  try { localStorage.setItem(ACTIVE_PLAN_KEY, JSON.stringify(plan)); } catch {}
}

export function loadActivePlan(): ActivePlanV1 | null {
  try {
    const r = localStorage.getItem(ACTIVE_PLAN_KEY);
    return r ? (JSON.parse(r) as ActivePlanV1) : null;
  } catch { return null; }
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

export function buildActivePlanFromDraft(draft: PlanDraft): ActivePlanV1 {
  const step1 = draft.step1 || {};
  const step2 = draft.step2 || {};
  const step3 = draft.step3 || {};
  const step5 = draft.step5 || {};
  const step6 = draft.step6 || {};
  const step7 = draft.step7 || {};

  const weightKg = Number(step2?.peso || step2?.weight || 80);
  const heightCm = Number(step2?.altura || step2?.height || 175);
  const ageYears = Number(step1?.idade || step1?.age || 28);
  const gender = normGender(step1?.sexo || step1?.gender);

  const goalRaw = String(step1?.objetivo || step1?.goal || "maintain").toLowerCase();
  const goal = goalRaw.includes("emag") || goalRaw.includes("cut") ? "cut"
    : goalRaw.includes("gan") || goalRaw.includes("bulk") ? "bulk"
    : "maintain";

  const activityFactor = activityFactorFromWeeklyFrequency(step3?.frequenciaSemanal || step3?.frequencia || step3?.atividade);

  const metabolic = computeMetabolic({
    weightKg, heightCm, ageYears, gender,
    activityFactor,
    goal,
  });

  const pref = (String(step7?.dieta || step7?.preference || "flexivel").toLowerCase() as any);
  const preference = (pref.includes("low") ? "lowcarb" : pref.includes("veg") ? "vegetariana" : "flexivel") as "flexivel"|"lowcarb"|"vegetariana";

  const macros = computeMacros({
    targetKcal: metabolic.targetKcal,
    goal,
    weightKg,
    preference,
  });

  const meals = buildMealPlan(metabolic.targetKcal, macros);

  const modalities = (step5?.modalidades || step5?.modalities || ["musculacao"]) as Modality[];
  const levelRaw = String(step3?.nivel || step3?.level || "iniciante").toLowerCase();
  const level = (levelRaw.includes("avan") ? "avancado" : levelRaw.includes("inter") ? "intermediario" : "iniciante") as "iniciante"|"intermediario"|"avancado";

  const daysByModality = (step6?.diasPorModalidade || step6?.daysByModality || {}) as Record<Modality, string[]>;

  const workout = buildWorkoutWeek({ modalities, level, daysByModality });

  return {
    version: "v1",
    createdAt: new Date().toISOString(),
    metabolic,
    macros,
    meals,
    workout,
    draft,
  };
}
