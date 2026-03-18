import { SessionBlockType, TrainingGoal } from "../core/enums";
import { Exercise, PrescribedExercise, TrainingProfile } from "../core/types";

export function assignSetRepSchemes(exercises: Exercise[], profile: TrainingProfile): PrescribedExercise[] {
  return exercises.map((exercise, index) => {
    const primary = index === 0;
    let reps = "8-12";
    let restSec = primary ? 90 : 60;
    let rir = 2;

    if (profile.primaryGoal === TrainingGoal.STRENGTH && exercise.isCompound) {
      reps = primary ? "4-6" : "6-8";
      restSec = primary ? 150 : 90;
      rir = 2;
    } else if (profile.primaryGoal === TrainingGoal.FAT_LOSS) {
      reps = exercise.isCompound ? "8-12" : "12-15";
      restSec = 45;
      rir = 2;
    } else if (profile.primaryGoal === TrainingGoal.GENERAL_FITNESS) {
      reps = "8-12";
      restSec = 60;
      rir = 3;
    }

    return {
      exerciseId: exercise.id,
      name: exercise.name,
      blockType: primary ? SessionBlockType.PRIMARY : SessionBlockType.ACCESSORY,
      sets: primary ? 3 : 2,
      reps,
      restSec,
      rir,
      rationale: primary ? "movimento principal da sessão" : "complemento coerente com o foco",
    };
  });
}
