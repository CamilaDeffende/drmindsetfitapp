import { calculateREEAuto } from "@/services/nutrition/energyEquations";
import { computeCunningham } from "./equations/cunningham";
import { computeHarrisBenedict } from "./equations/harris-benedict";
import { computeFAOWHO } from "./equations/fao-who";

export type Gender = "male" | "female" | "other";

export type MetabolicMethod = "mifflin" | "cunningham" | "harris-benedict" | "fao-who" | "auto";

export type MetabolicInput = {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  gender: Gender;

  // Compat (auto REE)
  bodyFatPercent?: number;
  fatFreeMassKg?: number;
  activityLevel?: "sedentary" | "light" | "moderate" | "high" | "athlete";
  isAthlete?: boolean;

  activityFactor: number; // ex.: 1.2, 1.375, 1.55, 1.725
  goal: "cut" | "maintain" | "bulk";

  // Opcional — usado para Cunningham
  leanBodyMassKg?: number;

  // Opcional — padrão "auto"
  method?: MetabolicMethod;
};

export type MetabolicOutput = {
  bmrKcal: number;
  tdeeKcal: number;
  targetKcal: number;
  activityFactor: number;

  // Saída resolvida (nunca "auto")
  method: "mifflin" | "cunningham" | "harris-benedict" | "fao-who";

  // Compat / auditoria
  equationUsed?: string;
  reeKcalAuto?: number;
};

function round(n: number) {
  return Math.round(n);
}

/**
 * Mifflin-St Jeor (padrão)
 * male: 10W + 6.25H - 5A + 5
 * female: 10W + 6.25H - 5A - 161
 * other: usa média conservadora (0) sem +5/-161
 */
function computeMifflin(input: MetabolicInput): number {
  const W = input.weightKg;
  const H = input.heightCm;
  const A = input.ageYears;

  let sexConst = 0;
  if (input.gender === "male") sexConst = 5;
  if (input.gender === "female") sexConst = -161;

  return 10 * W + 6.25 * H - 5 * A + sexConst;
}

/**
 * Seleciona automaticamente o melhor método baseado em dados disponíveis
 * Prioridade: Cunningham (se tem massa magra) > Mifflin
 */
function selectMethod(input: MetabolicInput): "mifflin" | "cunningham" {
  if (input.leanBodyMassKg && input.leanBodyMassKg > 0) return "cunningham";
  return "mifflin";
}

/**
 * Calcula metabolismo usando método especificado ou auto (REE inteligente)
 */
export function computeMetabolic(input: MetabolicInput): MetabolicOutput {
  const requested = input.method ?? "auto";

  // AUTO: usa calculateREEAuto (mais inteligente) quando disponível
  if (requested === "auto") {
    const sex: "male" | "female" = input.gender === "female" ? "female" : "male";
    const auto = calculateREEAuto({
      sex,
      age: input.ageYears,
      weightKg: input.weightKg,
      heightCm: input.heightCm,
      bodyFatPercent: input.bodyFatPercent,
      fatFreeMassKg: input.fatFreeMassKg,
      activityLevel: input.activityLevel,
      isAthlete: Boolean(input.isAthlete),
    });

    const bmr = auto.reeKcal;
    const tdee = bmr * input.activityFactor;

    let target = tdee;
    if (input.goal === "cut") target = tdee - 400;
    if (input.goal === "bulk") target = tdee + 250;

    if (target < 1200) target = 1200;

    // map seguro para método resolvido
    const m = String((auto as any).method || (auto as any).methodUsed || "").toLowerCase();
    const resolved: MetabolicOutput["method"] =
      m === "cunningham" ? "cunningham" :
      m === "harris-benedict" ? "harris-benedict" :
      m === "fao-who" ? "fao-who" :
      "mifflin";

    return {
      bmrKcal: round(bmr),
      tdeeKcal: round(tdee),
      targetKcal: round(target),
      activityFactor: input.activityFactor,
      method: resolved,
      equationUsed: (auto as any).equationUsed,
      reeKcalAuto: (auto as any).reeKcal,
    };
  }

  // Manual ou semi-auto: usa seleção local (equações do engine)
  const method = requested === "mifflin" || requested === "cunningham" || requested === "harris-benedict" || requested === "fao-who"
    ? requested
    : selectMethod(input);

  let bmr: number;

  switch (method) {
    case "cunningham": {
      if (!input.leanBodyMassKg || input.leanBodyMassKg <= 0) {
        bmr = computeMifflin(input);
      } else {
        bmr = computeCunningham({ leanBodyMassKg: input.leanBodyMassKg }).bmrKcal;
      }
      break;
    }
    case "harris-benedict": {
      bmr = computeHarrisBenedict({
        weightKg: input.weightKg,
        heightCm: input.heightCm,
        ageYears: input.ageYears,
        gender: input.gender,
      }).bmrKcal;
      break;
    }
    case "fao-who": {
      bmr = computeFAOWHO({
        weightKg: input.weightKg,
        ageYears: input.ageYears,
        gender: input.gender,
      }).bmrKcal;
      break;
    }
    case "mifflin":
    default: {
      bmr = computeMifflin(input);
      break;
    }
  }

  const tdee = bmr * input.activityFactor;

  let target = tdee;
  if (input.goal === "cut") target = tdee - 400;
  if (input.goal === "bulk") target = tdee + 250;

  if (target < 1200) target = 1200;

  return {
    bmrKcal: round(bmr),
    tdeeKcal: round(tdee),
    targetKcal: round(target),
    activityFactor: input.activityFactor,
    method,
  };
}

// Re-exportar funções individuais para uso direto
export { computeCunningham } from "./equations/cunningham";
export { computeHarrisBenedict } from "./equations/harris-benedict";
export { computeFAOWHO } from "./equations/fao-who";
