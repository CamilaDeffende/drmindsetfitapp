import { TrainingPlan } from "../core/types";
import { EXERCISE_VARIANTS } from "../library/exerciseVariants";

export function swapExerciseVariant(plan: TrainingPlan): TrainingPlan {
  return {
    ...plan,
    sessions: plan.sessions.map((session) => ({
      ...session,
      exercises: session.exercises.map((exercise) => {
        const variant = EXERCISE_VARIANTS[exercise.exerciseId]?.[0];
        return variant ? { ...exercise, exerciseId: variant } : exercise;
      }),
    })),
  };
}
