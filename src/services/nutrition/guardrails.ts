/**
 * DrMindsetFit — Nutrition Guardrails (SSOT-safe)
 * Objetivo: impedir alvos calóricos extremos e gerar warnings auditáveis.
 */
export type GuardrailWarningCode =
  | "LOW_KCAL_FLOOR"
  | "HIGH_KCAL_CEIL"
  | "DEFICIT_TOO_AGGRESSIVE"
  | "SURPLUS_TOO_HIGH"
  | "MISSING_INPUTS";

export type GuardrailWarning = { code: GuardrailWarningCode; message: string };

export type GuardrailResult = {
  kcalTarget: number;
  confidence: number; // 0..1
  warnings: GuardrailWarning[];
  trace: Record<string, unknown>;
};

export type GuardrailInputs = {
  sex?: "male" | "female";
  age?: number;
  weightKg?: number;
  heightCm?: number;
  tdeeKcal?: number;      // manutenção
  goalKcal?: number;      // alvo proposto
  goalType?: "cut" | "maintain" | "bulk";
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function applyNutritionGuardrails(inp: GuardrailInputs): GuardrailResult {
  const warnings: GuardrailWarning[] = [];
  const trace: Record<string, unknown> = { inp };

  const tdee = typeof inp.tdeeKcal === "number" ? inp.tdeeKcal : undefined;
  const proposed = typeof inp.goalKcal === "number" ? inp.goalKcal : tdee;

  if (!tdee || !proposed) {
    warnings.push({
      code: "MISSING_INPUTS",
      message: "Inputs insuficientes para aplicar guardrails com alta confiança.",
    });
    return { kcalTarget: Math.round(proposed ?? 0), confidence: 0.25, warnings, trace };
  }

  const floor = 1200;
  const ceil = 6000;

  let target = proposed;

  if (target < floor) {
    target = floor;
    warnings.push({ code: "LOW_KCAL_FLOOR", message: `Alvo ajustado (mínimo ${floor} kcal/dia).` });
  }

  if (target > ceil) {
    target = ceil;
    warnings.push({ code: "HIGH_KCAL_CEIL", message: `Alvo ajustado (máximo ${ceil} kcal/dia).` });
  }

  const deficit = tdee - target;
  const surplus = target - tdee;

  if (deficit > 1000) {
    target = tdee - 1000;
    warnings.push({ code: "DEFICIT_TOO_AGGRESSIVE", message: "Déficit > 1000 kcal/dia é agressivo; ajustado." });
  }

  if (surplus > 800) {
    target = tdee + 800;
    warnings.push({ code: "SURPLUS_TOO_HIGH", message: "Superávit > 800 kcal/dia é alto; ajustado." });
  }

  let confidence = 0.85;
  if (typeof inp.sex !== "string") confidence -= 0.05;
  if (typeof inp.age !== "number") confidence -= 0.05;
  if (typeof inp.weightKg !== "number") confidence -= 0.05;
  if (typeof inp.heightCm !== "number") confidence -= 0.05;
  confidence = clamp(confidence, 0.2, 0.95);

  trace["tdee"] = tdee;
  trace["proposed"] = proposed;
  trace["floor"] = floor;
  trace["ceil"] = ceil;
  trace["finalTarget"] = target;
  trace["confidence"] = confidence;

  return { kcalTarget: Math.round(target), confidence, warnings, trace };
}
