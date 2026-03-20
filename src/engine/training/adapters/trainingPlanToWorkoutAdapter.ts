import type { TrainingPlan, TrainingSession, PrescribedExercise } from "../core/types";

type LegacyWorkoutExercise = {
  nome: string;
  series: number;
  repeticoes: string;
  descansoSegundos: number;
  observacoes: string[];
};

type LegacyWorkoutDay = {
  titulo: string;
  exercicios: LegacyWorkoutExercise[];
};

type LegacyWorkoutPlan = {
  createdAt?: string;
  dias: LegacyWorkoutDay[];
};

function mapExercise(exercise: PrescribedExercise): LegacyWorkoutExercise {
  return {
    nome: exercise.name ?? exercise.exerciseName,
    series: exercise.sets,
    repeticoes: exercise.repRange,
    descansoSegundos: exercise.restSec,
    observacoes: exercise.notes ?? [],
  };
}

function mapSession(session: TrainingSession): LegacyWorkoutDay {
  return {
    titulo: session.name ?? `Sessão ${session.dayIndex}`,
    exercicios: session.exercises.map(mapExercise),
  };
}

export function trainingPlanToWorkoutAdapter(plan: TrainingPlan): LegacyWorkoutPlan {
  return {
    createdAt: plan.createdAt,
    dias: plan.sessions.map(mapSession),
  };
}
