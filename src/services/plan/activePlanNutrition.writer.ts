// MF_ACTIVEPLAN_NUTRITION_WRITER_V1
// Writer único para gravar nutrição no mf:activePlan:v1 (merge seguro).
// Importante: não depende de store/UI. É determinístico e testável.

import { MF_ACTIVEPLAN_KEY_V1 } from "@/services/ssot/getActivePlanNormalized";
import { buildNutritionPlan, type BodyInput, type EngineOptions } from "@/services/nutrition/engine/nutritionEngine";

type AnyObj = Record<string, any>;

function safeJsonParse(s: string | null): any | null {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

function safeJsonStringify(v: any): string {
  try { return JSON.stringify(v); } catch { return "{}"; }
}

export function loadActivePlanRaw(): AnyObj {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage?.getItem(MF_ACTIVEPLAN_KEY_V1) ?? null;
  const j = safeJsonParse(raw);
  return (j && typeof j === "object") ? (j as AnyObj) : {};
}

export function saveActivePlanRaw(next: AnyObj): void {
  if (typeof window === "undefined") return;
  window.localStorage?.setItem(MF_ACTIVEPLAN_KEY_V1, safeJsonStringify(next));
}

export function saveActivePlanNutrition(body: BodyInput, opts: EngineOptions): AnyObj {
  const plan = buildNutritionPlan(body, opts);

  const prev = loadActivePlanRaw();
  const next: AnyObj = {
    ...prev,
    nutrition: {
      ...(prev.nutrition || {}),
      kcalTarget: plan.macros.kcal,
      macros: {
        kcal: plan.macros.kcal,
        proteina_g: plan.macros.proteina_g,
        carbo_g: plan.macros.carbo_g,
        gordura_g: plan.macros.gordura_g,
        fibras_g: plan.macros.fibras_g,
      },
      // meals pode ser montado no onboarding (se existir); aqui preservamos se já tiver
      meals: Array.isArray(prev?.nutrition?.meals) ? prev.nutrition.meals : [],
      meta: {
        ree_kcal: plan.ree_kcal,
        tdee_kcal: plan.tdee_kcal,
        metodo_ree: plan.metodo_ree,
        fator_atividade: plan.fator_atividade,
        delta_objetivo_kcal: plan.delta_objetivo_kcal,
        notas: plan.notas,
        biotipo: opts.biotipo ?? null,
        objetivo: opts.objetivo,
        atividade: opts.atividade,
      },
    },
  };

  saveActivePlanRaw(next);
  return next;
}
