import type { ActiveWorkoutSession } from "./trainingPlanToActiveWorkoutsAdapter";

export function canonicalWorkoutsToLegacyWeek(workouts: ActiveWorkoutSession[]) {
  return workouts.map((session) => ({
    id: session.id,
    dia: session.dayLabel,
    dayKey: session.dayKey,
    titulo: session.title,
    modalidade: session.modality,
    foco: session.focus,
    duracaoMin: session.estimatedDurationMin,
    intensidade: session.intensity,
    exercicios: session.blocks.flatMap((b) => b.exercises).map((ex) => ({
      id: ex.exerciseId,
      nome: ex.name,
      grupoMuscular: ex.muscleGroup,
      equipamento: ex.equipment,
      series: ex.sets,
      repeticoes: ex.reps,
      descansoSeg: ex.restSec,
      observacoes: ex.notes,
    })),
  }));
}
