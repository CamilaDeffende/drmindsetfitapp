import { Exercise } from "./types";

export function findExerciseById(exercises: Exercise[], id: string): Exercise | undefined {
  return exercises.find((item) => item.id === id);
}
