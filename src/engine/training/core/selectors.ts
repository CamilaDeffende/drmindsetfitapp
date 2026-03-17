import { Exercise } from "./types";
import { MovementPattern } from "./enums";

export function pickByPattern(exercises: Exercise[], pattern: MovementPattern): Exercise[] {
  return exercises.filter((exercise) => exercise.movementPattern === pattern);
}
