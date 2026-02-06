/**
 * Validação e processamento de dados de Bioimpedância
 * Método moderno de análise de composição corporal
 */

export type BioimpedanceInput = {
  weightKg: number;
  fatPercentage: number; // % gordura
  leanPercentage?: number; // % massa magra (opcional, será calculado se omitido)
  waterPercentage?: number; // % água corporal (opcional)
  metabolicAge?: number; // idade metabólica (opcional)
};

export type BioimpedanceOutput = {
  fatPercentage: number;
  leanPercentage: number;
  waterPercentage?: number;
  metabolicAge?: number;
  fatMassKg: number;
  leanMassKg: number;
  waterMassKg?: number;
  method: "bioimpedance";
  valid: boolean;
  warnings: string[];
};

function round(n: number, decimals: number = 1): number {
  return Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Valida e processa dados de bioimpedância
 */
export function processBioimpedance(input: BioimpedanceInput): BioimpedanceOutput {
  const warnings: string[] = [];

  // Validação de % gordura (range fisiológico: 5-50%)
  let fatPct = input.fatPercentage;
  if (fatPct < 5 || fatPct > 50) {
    warnings.push(`% gordura fora do range típico (5-50%): ${fatPct}%`);
    fatPct = Math.max(5, Math.min(50, fatPct)); // Clamp
  }

  // Cálculo de % massa magra
  let leanPct = input.leanPercentage ?? (100 - fatPct);
  if (leanPct < 50 || leanPct > 95) {
    warnings.push(`% massa magra fora do range típico (50-95%): ${leanPct}%`);
    leanPct = Math.max(50, Math.min(95, leanPct));
  }

  // Validação de % água (se fornecido)
  let waterPct = input.waterPercentage;
  if (waterPct !== undefined) {
    if (waterPct < 45 || waterPct > 75) {
      warnings.push(`% água fora do range típico (45-75%): ${waterPct}%`);
      waterPct = Math.max(45, Math.min(75, waterPct));
    }
  }

  // Validação de idade metabólica (se fornecido)
  let metAge = input.metabolicAge;
  if (metAge !== undefined) {
    if (metAge < 18 || metAge > 100) {
      warnings.push(`Idade metabólica fora do range típico (18-100): ${metAge}`);
      metAge = Math.max(18, Math.min(100, metAge));
    }
  }

  // Cálculos de massa em kg
  const fatMassKg = (fatPct / 100) * input.weightKg;
  const leanMassKg = (leanPct / 100) * input.weightKg;
  const waterMassKg = waterPct !== undefined ? (waterPct / 100) * input.weightKg : undefined;

  // Validação final: soma de fat + lean deve ser aproximadamente 100%
  const totalPct = fatPct + leanPct;
  if (Math.abs(totalPct - 100) > 5) {
    warnings.push(`Soma de % gordura e % magra inconsistente: ${totalPct}%`);
  }

  return {
    fatPercentage: round(fatPct, 1),
    leanPercentage: round(leanPct, 1),
    waterPercentage: waterPct !== undefined ? round(waterPct, 1) : undefined,
    metabolicAge: metAge,
    fatMassKg: round(fatMassKg, 1),
    leanMassKg: round(leanMassKg, 1),
    waterMassKg: waterMassKg !== undefined ? round(waterMassKg, 1) : undefined,
    method: "bioimpedance",
    valid: warnings.length === 0,
    warnings,
  };
}

/**
 * Estima % gordura por bioimpedância a partir de peso e altura (método simplificado)
 * Usado como fallback quando não há dados reais de bioimpedância
 */
export function estimateBioimpedanceFromBMI(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  gender: "male" | "female" | "other"
): BioimpedanceOutput {
  // Cálculo de IMC
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);

  // Estimativa aproximada de % gordura baseada em IMC, idade e sexo
  // Fórmulas empíricas (Deurenberg et al., 1991)
  let fatPct: number;

  if (gender === "male") {
    fatPct = (1.20 * bmi) + (0.23 * ageYears) - 16.2;
  } else if (gender === "female") {
    fatPct = (1.20 * bmi) + (0.23 * ageYears) - 5.4;
  } else {
    // Média das duas fórmulas
    const maleEstimate = (1.20 * bmi) + (0.23 * ageYears) - 16.2;
    const femaleEstimate = (1.20 * bmi) + (0.23 * ageYears) - 5.4;
    fatPct = (maleEstimate + femaleEstimate) / 2;
  }

  // Clamp em range fisiológico
  fatPct = Math.max(5, Math.min(50, fatPct));

  const leanPct = 100 - fatPct;
  const fatMassKg = (fatPct / 100) * weightKg;
  const leanMassKg = (leanPct / 100) * weightKg;

  return {
    fatPercentage: round(fatPct, 1),
    leanPercentage: round(leanPct, 1),
    fatMassKg: round(fatMassKg, 1),
    leanMassKg: round(leanMassKg, 1),
    method: "bioimpedance",
    valid: true,
    warnings: ["Estimativa baseada em IMC (não é bioimpedância real)"],
  };
}
