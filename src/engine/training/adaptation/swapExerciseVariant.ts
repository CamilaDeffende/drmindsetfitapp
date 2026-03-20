import { TrainingPlan } from "../core/types";
import { EXERCISE_SUBSTITUTIONS } from "../library/substitutions";

export function swapExerciseVariant(plan: TrainingPlan, flaggedExercises: string[]): TrainingPlan {
  if (!flaggedExercises.length) return plan;

  const clone = structuredClone(plan);

  clone.sessions = clone.sessions.map((session) => ({
    ...session,
    exercises: session.exercises.map((exercise) => {
      if (!flaggedExercises.includes(exercise.exerciseId)) return exercise;
      const substituteId = EXERCISE_SUBSTITUTIONS[exercise.exerciseId]?.[0];
      if (!substituteId) return exercise;

      return {
        ...exercise,
        exerciseId: substituteId,
        exerciseName: substituteId,
        notes: [...(exercise.notes ?? []), "Exercício trocado por variante compatível com limitação/equipamento."],
      };
    }),
  }));

  clone.rationale.push("Troca de variante aplicada por feedback do usuário.");
  clone.version += 1;
  return clone;
}
