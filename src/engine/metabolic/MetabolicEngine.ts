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
  activityFactor: number; // ex.: 1.2, 1.375, 1.55, 1.725
  goal: "cut" | "maintain" | "bulk";
  leanBodyMassKg?: number; // Opcional - usado para Cunningham
  method?: MetabolicMethod; // Opcional - padrão "auto"
};

export type MetabolicOutput = {
  bmrKcal: number;
  tdeeKcal: number;
  targetKcal: number;
  activityFactor: number;
  method: "mifflin" | "cunningham" | "harris-benedict" | "fao-who";
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

  return (10 * W) + (6.25 * H) - (5 * A) + sexConst;
}

/**
 * Seleciona automaticamente o melhor método baseado em dados disponíveis
 * Prioridade: Cunningham (se tem massa magra) > Mifflin > Harris-Benedict
 */
function selectMethod(input: MetabolicInput): "mifflin" | "cunningham" | "harris-benedict" | "fao-who" {
  // Se tem massa magra, usar Cunningham (mais preciso)
  if (input.leanBodyMassKg && input.leanBodyMassKg > 0) {
    return "cunningham";
  }

  // Senão, usar Mifflin (padrão moderno)
  return "mifflin";
}

/**
 * Calcula metabolismo usando o método especificado ou seleção automática
 */
export function computeMetabolic(input: MetabolicInput): MetabolicOutput {
  const method = input.method === "auto" || !input.method ? selectMethod(input) : input.method;

  let bmr: number;

  // Selecionar equação baseada no método
  switch (method) {
    case "cunningham": {
      if (!input.leanBodyMassKg || input.leanBodyMassKg <= 0) {
        // Fallback para Mifflin se não tem massa magra
        bmr = computeMifflin(input);
      } else {
        const result = computeCunningham({ leanBodyMassKg: input.leanBodyMassKg });
        bmr = result.bmrKcal;
      }
      break;
    }

    case "harris-benedict": {
      const hbResult = computeHarrisBenedict({
        weightKg: input.weightKg,
        heightCm: input.heightCm,
        ageYears: input.ageYears,
        gender: input.gender,
      });
      bmr = hbResult.bmrKcal;
      break;
    }

    case "fao-who": {
      const faoResult = computeFAOWHO({
        weightKg: input.weightKg,
        ageYears: input.ageYears,
        gender: input.gender,
      });
      bmr = faoResult.bmrKcal;
      break;
    }

    case "mifflin":
    default: {
      bmr = computeMifflin(input);
      break;
    }
  }

  // Calcular TDEE
  const tdee = bmr * input.activityFactor;

  // Ajustar por objetivo
  let target = tdee;
  if (input.goal === "cut") target = tdee - 400;
  if (input.goal === "bulk") target = tdee + 250;

  // Clamp mínimo seguro (não médico, só evita absurdo)
  if (target < 1200) target = 1200;

  // method já foi resolvido no switch e nunca é "auto" aqui
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
