// MF_EXERCISE_CATALOG_V1
// Adapter único para o motor inteligente consumir o banco de exercícios já existente.
// Fonte real: src/features/fitness-suite/data/exercises.ts (export: exercises)

import { exercises as MF_EXERCISES } from "@/features/fitness-suite/data/exercises";

export type MF_Exercise = any;

export const __MF_EXERCISE_SOURCE = "src/features/fitness-suite/data/exercises.ts";

export function getExerciseCatalog(): MF_Exercise[] {
  try {
    const arr: any = (typeof MF_EXERCISES !== "undefined" ? MF_EXERCISES : null) as any;
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
