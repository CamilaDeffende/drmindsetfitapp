/**
 * Motor unificado de Composição Corporal
 * Prioriza métodos mais precisos quando dados disponíveis
 */

import { processBioimpedance, estimateBioimpedanceFromBMI, type BioimpedanceInput } from "./bioimpedance";
import { computePollock7, type Pollock7Input } from "./pollock7";

export type Gender = "male" | "female" | "other";

export type BodyCompositionInput = {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  gender: Gender;

  // Bioimpedância (prioridade 1)
  bioimpedance?: BioimpedanceInput;

  // Pollock 7 dobras (prioridade 2)
  pollock7?: Pollock7Input;
};

export type BodyCompositionOutput = {
  fatPercentage: number;
  leanMassKg: number;
  fatMassKg: number;
  method: "bioimpedance" | "pollock7" | "bmi-estimate";
  metabolicAge?: number;
  waterPercentage?: number;
  warnings: string[];
};

/**
 * Calcula composição corporal usando o melhor método disponível
 * Prioridade: Bioimpedância > Pollock 7 > Estimativa por IMC
 */
export function computeBodyComposition(input: BodyCompositionInput): BodyCompositionOutput {
  const warnings: string[] = [];

  // Prioridade 1: Bioimpedância (se disponível)
  if (input.bioimpedance) {
    const result = processBioimpedance({
      ...input.bioimpedance,
      weightKg: input.weightKg,
    });

    return {
      fatPercentage: result.fatPercentage,
      leanMassKg: result.leanMassKg,
      fatMassKg: result.fatMassKg,
      method: result.method,
      metabolicAge: result.metabolicAge,
      waterPercentage: result.waterPercentage,
      warnings: result.warnings,
    };
  }

  // Prioridade 2: Pollock 7 dobras (se disponível)
  if (input.pollock7) {
    const result = computePollock7({
      ...input.pollock7,
      weightKg: input.weightKg,
      ageYears: input.ageYears,
      gender: input.gender === "other" ? "male" : input.gender, // Fallback para male se "other"
    });

    return {
      fatPercentage: result.fatPercentage,
      leanMassKg: result.leanMassKg,
      fatMassKg: result.fatMassKg,
      method: result.method,
      warnings,
    };
  }

  // Prioridade 3: Estimativa por IMC (fallback)
  warnings.push("Usando estimativa por IMC - recomendado coletar dados de bioimpedância ou dobras cutâneas");

  const result = estimateBioimpedanceFromBMI(
    input.weightKg,
    input.heightCm,
    input.ageYears,
    input.gender
  );

  return {
    fatPercentage: result.fatPercentage,
    leanMassKg: result.leanMassKg,
    fatMassKg: result.fatMassKg,
    method: "bmi-estimate",
    warnings: [...warnings, ...result.warnings],
  };
}

// Re-exportar tipos e funções individuais
export { processBioimpedance, estimateBioimpedanceFromBMI } from "./bioimpedance";
export { computePollock7, validateFolds } from "./pollock7";
export type { BioimpedanceInput, BioimpedanceOutput } from "./bioimpedance";
export type { Pollock7Input, Pollock7Output } from "./pollock7";
