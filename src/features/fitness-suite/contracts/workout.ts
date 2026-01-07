export type PR = {
  exerciseId: string;
  bestKg: number;
  reps: number;
  date: string;
};

export type WorkoutSetSnapshot = {
  reps: number;
  load: number;
};

export type WorkoutExerciseSnapshot = {
  name: string;
  muscle: string;
  sets: WorkoutSetSnapshot[];
};

export type WorkoutSession = {
  id: string;
  date: string;        // YYYY-MM-DD
  startedAt: string;   // ISO
  finishedAt: string;  // ISO
  durationMin: number;
  exercises: WorkoutExerciseSnapshot[];
  volumeTotal: number;
  setsTotal: number;
  repsTotal: number;
  intensityScore: number;
};

export function calcVolume(exercises: WorkoutExerciseSnapshot[]) {
  let volumeTotal = 0;
  let setsTotal = 0;
  let repsTotal = 0;

  for (const ex of exercises) {
    for (const st of ex.sets) {
      const reps = Number(st.reps || 0);
      const load = Number(st.load || 0);
      volumeTotal += reps * load;
      repsTotal += reps;
      setsTotal += 1;
    }
  }

  return {
    volumeTotal: Math.round(volumeTotal),
    setsTotal,
    repsTotal
  };
}
