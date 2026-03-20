import { TrainingPlan } from "../core/types";

export function compressSessionForTime(plan: TrainingPlan, availableMin: number): TrainingPlan {
  const clone = structuredClone(plan);

  clone.sessions = clone.sessions.map((session) => {
    if (session.estimatedDurationMin <= availableMin) return session;

    const trimmed = session.exercises.slice(0, Math.max(3, session.exercises.length - 1));
    return {
      ...session,
      exercises: trimmed,
      estimatedDurationMin: Math.max(availableMin, 25),
      rationale: [...session.rationale, "Sessão comprimida por restrição real de tempo sem quebrar o estímulo principal."],
    };
  });

  clone.rationale.push("Compressão de sessão aplicada por indisponibilidade de tempo.");
  clone.version += 1;
  return clone;
}
