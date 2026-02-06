/**
 * Cunningham Equation (1980)
 * Mais precisa quando massa magra é conhecida
 * BMR = 500 + (22 × massa magra em kg)
 */

export type CunninghamInput = {
  leanBodyMassKg: number;
};

export type CunninghamOutput = {
  bmrKcal: number;
  method: "cunningham";
};

function round(n: number): number {
  return Math.round(n);
}

/**
 * Calcula BMR usando equação de Cunningham
 * Requer massa magra (kg)
 */
export function computeCunningham(input: CunninghamInput): CunninghamOutput {
  const bmr = 500 + (22 * input.leanBodyMassKg);

  return {
    bmrKcal: round(bmr),
    method: "cunningham",
  };
}

/**
 * Valida se a massa magra está em range fisiológico
 */
export function validateLeanMass(leanMassKg: number, weightKg: number): boolean {
  if (leanMassKg <= 0) return false;
  if (leanMassKg > weightKg) return false;

  // Massa magra deve ser entre 40-95% do peso total
  const leanPct = (leanMassKg / weightKg) * 100;
  return leanPct >= 40 && leanPct <= 95;
}
