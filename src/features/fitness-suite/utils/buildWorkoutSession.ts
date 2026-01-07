import { WorkoutExerciseSnapshot, WorkoutSession } from "../contracts/workout";

function makeSessionId(prefix = "ws") {
  return prefix + "_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
}

function diffMin(aIso: string, bIso: string) {
  const a = new Date(aIso).getTime();
  const b = new Date(bIso).getTime();
  const d = Math.max(0, b - a);
  return Math.round(d / 60000);
}

function safeNumber(n: any) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

function calcTotals(exercises: WorkoutExerciseSnapshot[]) {
  let volumeTotal = 0;
  let setsTotal = 0;
  let repsTotal = 0;

  for (const ex of exercises) {
    for (const st of ex.sets) {
      const reps = safeNumber(st.reps);
      const load = safeNumber(st.load);
      repsTotal += reps;
      setsTotal += 1;
      volumeTotal += reps * load;
    }
  }

  return { volumeTotal, setsTotal, repsTotal };
}

function calcIntensityScore(volumeTotal: number, setsTotal: number) {
  // score simples e estável (pode evoluir depois)
  if (!setsTotal) return 0;
  return Math.round((volumeTotal / setsTotal) * 10) / 10;
}

export function buildWorkoutSession(input: {
  date: string;                 // YYYY-MM-DD
  startedAt: string;            // ISO
  finishedAt: string;           // ISO
  exercises: WorkoutExerciseSnapshot[];
}): WorkoutSession {
  const { volumeTotal, setsTotal, repsTotal } = calcTotals(input.exercises);
  const durationMin = diffMin(input.startedAt, input.finishedAt);

  return {
    id: makeSessionId("ws"),
    date: input.date,
    startedAt: input.startedAt,
    finishedAt: input.finishedAt,
    durationMin,
    exercises: input.exercises,
    volumeTotal,
    setsTotal,
    repsTotal,
    intensityScore: calcIntensityScore(volumeTotal, setsTotal),
  };
}
