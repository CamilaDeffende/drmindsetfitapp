import { ExerciseDefinition, ExercisePrescription, TrainingProfile } from "../core/types";

export function assignSetRepSchemes(exercises: ExerciseDefinition[], profile: TrainingProfile): ExercisePrescription[] {
  return exercises.map((exercise, index) => {
    const compound = ["SQUAT", "HINGE", "HORIZONTAL_PUSH", "VERTICAL_PUSH", "HORIZONTAL_PULL", "VERTICAL_PULL"].includes(exercise.movementPattern);

    let sets = compound ? 3 : 2;
    let repRange = "8-12";
    let targetRir = 2;
    let restSec = compound ? 90 : 60;

    if (profile.goal === "STRENGTH") {
      repRange = compound ? "4-6" : "6-10";
      sets = compound ? 4 : 3;
      restSec = compound ? 120 : 75;
      targetRir = 2;
    } else if (profile.goal === "FAT_LOSS") {
      repRange = compound ? "8-12" : "12-15";
      restSec = 45 + index * 5;
      targetRir = 2;
    } else if (profile.goal === "HYPERTROPHY") {
      repRange = compound ? "6-10" : "10-15";
      sets = compound ? 3 : 3;
      targetRir = 1;
    }

    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      name: exercise.name,
      sets,
      repRange,
      restSec,
      targetRir,
      notes: [compound ? "priorizar técnica e progressão controlada" : "buscar execução estável e controle"],
    };
  });
}
