/**
 * Protocolo de Pollock 7 Dobras Cutâneas
 * Método clássico para estimativa de % gordura corporal
 *
 * Dobras medidas (mm):
 * - Peitoral
 * - Axilar média
 * - Tríceps
 * - Subescapular
 * - Abdômen
 * - Suprailíaca
 * - Coxa
 */

export type Gender = "male" | "female";

export type Pollock7Input = {
  gender: Gender;
  ageYears: number;
  weightKg: number;
  // Dobras em milímetros
  peitoral: number;
  axilarMedia: number;
  triceps: number;
  subescapular: number;
  abdomen: number;
  suprailiaca: number;
  coxa: number;
};

export type Pollock7Output = {
  fatPercentage: number;
  leanMassKg: number;
  fatMassKg: number;
  method: "pollock7";
  sumOfFolds: number;
  bodyDensity: number;
};

function round(n: number, decimals: number = 1): number {
  return Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Calcula % gordura usando protocolo de Pollock 7 dobras
 */
export function computePollock7(input: Pollock7Input): Pollock7Output {
  // Soma das 7 dobras
  const sumOfFolds =
    input.peitoral +
    input.axilarMedia +
    input.triceps +
    input.subescapular +
    input.abdomen +
    input.suprailiaca +
    input.coxa;

  // Idade em anos
  const age = input.ageYears;

  // Densidade corporal (equações de Pollock)
  let bodyDensity: number;

  if (input.gender === "male") {
    // Homens: BD = 1.112 - 0.00043499(sum) + 0.00000055(sum²) - 0.00028826(age)
    bodyDensity =
      1.112 -
      0.00043499 * sumOfFolds +
      0.00000055 * (sumOfFolds * sumOfFolds) -
      0.00028826 * age;
  } else {
    // Mulheres: BD = 1.097 - 0.00046971(sum) + 0.00000056(sum²) - 0.00012828(age)
    bodyDensity =
      1.097 -
      0.00046971 * sumOfFolds +
      0.00000056 * (sumOfFolds * sumOfFolds) -
      0.00012828 * age;
  }

  // Conversão de densidade corporal para % gordura (equação de Siri)
  // %G = (495 / BD) - 450
  const fatPercentage = (495 / bodyDensity) - 450;

  // Cálculo de massa gorda e magra
  const fatMassKg = (fatPercentage / 100) * input.weightKg;
  const leanMassKg = input.weightKg - fatMassKg;

  return {
    fatPercentage: round(fatPercentage, 1),
    leanMassKg: round(leanMassKg, 1),
    fatMassKg: round(fatMassKg, 1),
    method: "pollock7",
    sumOfFolds: round(sumOfFolds, 1),
    bodyDensity: round(bodyDensity, 4),
  };
}

/**
 * Valida se as dobras estão em range fisiológico
 */
export function validateFolds(input: Pollock7Input): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Cada dobra deve estar entre 1-60mm (valores extremos)
  const folds = [
    { name: "peitoral", value: input.peitoral },
    { name: "axilar média", value: input.axilarMedia },
    { name: "tríceps", value: input.triceps },
    { name: "subescapular", value: input.subescapular },
    { name: "abdômen", value: input.abdomen },
    { name: "suprailíaca", value: input.suprailiaca },
    { name: "coxa", value: input.coxa },
  ];

  for (const fold of folds) {
    if (fold.value < 1 || fold.value > 60) {
      errors.push(`Dobra ${fold.name} fora do range (1-60mm): ${fold.value}mm`);
    }
  }

  // Soma total deve estar entre 20-350mm
  const sum = folds.reduce((acc, f) => acc + f.value, 0);
  if (sum < 20 || sum > 350) {
    errors.push(`Soma das dobras fora do range (20-350mm): ${sum}mm`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
