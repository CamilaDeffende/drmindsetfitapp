import { TrainingPlan } from "../core/types";

export function compressSessionForTime(plan: TrainingPlan): TrainingPlan {
  return {
    ...plan,
    sessions: plan.sessions.map((session) => ({
      ...session,
      estimatedDurationMin: Math.max(25, session.estimatedDurationMin - 10),
      exercises: session.exercises.slice(0, Math.max(3, session.exercises.length - 1)),
    })),
  };
}
