import { ensureTrainingPlanInActivePlan } from "./trainingPlan.ssot";

const ACTIVE_PLAN_KEY = "mf:activePlan:v1" as const;

type AnyObj = Record<string, any>;

export type TrainingExecutionSet = {
  setNumber: number;
  loadKg: number;
  restSec: number;
  completed: boolean;
  repsTarget?: string;
  repsPerformed?: number | null;
  rpe?: number | null;
  rir?: number | null;
};

export type TrainingExecutionExercise = {
  exerciseId: string;
  exerciseName: string;
  muscleGroup?: string;
  equipment?: string;
  notes?: string;
  plannedSets: number;
  plannedReps?: string;
  plannedRestSec?: number;
  performedSets: TrainingExecutionSet[];
  completed: boolean;
};

export type TrainingExecutionSession = {
  sessionId: string;
  trainingId: string;
  source: "training.workouts" | "state.treino";
  dayLabel: string;
  dayKey?: string;
  modality: string;
  title: string;
  intensity?: string;
  startedAt: string;
  finishedAt?: string;
  durationMin?: number;
  plannedExercises: number;
  completedExercises: number;
  totalVolumeLoad: number;
  adherencePct: number;
  exercises: TrainingExecutionExercise[];
};

export type TrainingExercisePerformance = {
  executedAt: string;
  sessionId: string;
  trainingId: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup?: string;
  totalVolumeLoad: number;
  totalCompletedSets: number;
};

export type TrainingExecutionStore = {
  currentSession: TrainingExecutionSession | null;
  history: TrainingExecutionSession[];
  exercisePerformance: TrainingExercisePerformance[];
};

function isObject(value: unknown): value is AnyObj {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function safeArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function readActivePlan(): AnyObj | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(ACTIVE_PLAN_KEY);
    if (!raw) return null;
    return ensureTrainingPlanInActivePlan(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeActivePlan(activePlan: AnyObj) {
  try {
    if (typeof window === "undefined") return;
    const normalized = ensureTrainingPlanInActivePlan(activePlan);
    localStorage.setItem(ACTIVE_PLAN_KEY, JSON.stringify(normalized));
  } catch {}
}

function ensureExecutionStore(activePlan: AnyObj | null): TrainingExecutionStore {
  const training = isObject(activePlan?.training) ? activePlan!.training : {};
  const execution = isObject(training.execution) ? training.execution : {};

  return {
    currentSession: isObject(execution.currentSession) ? (execution.currentSession as TrainingExecutionSession) : null,
    history: safeArray<TrainingExecutionSession>(execution.history),
    exercisePerformance: safeArray<TrainingExercisePerformance>(execution.exercisePerformance),
  };
}

export function getTrainingExecutionStore(): TrainingExecutionStore {
  const activePlan = readActivePlan();
  return ensureExecutionStore(activePlan);
}

export function getTrainingExecutionHistory(): TrainingExecutionSession[] {
  return getTrainingExecutionStore().history;
}

export function getTrainingCurrentExecutionSession(): TrainingExecutionSession | null {
  return getTrainingExecutionStore().currentSession;
}

export function beginTrainingExecutionSession(
  session: Omit<
    TrainingExecutionSession,
    "startedAt" | "finishedAt" | "completedExercises" | "totalVolumeLoad" | "adherencePct"
  > & {
    startedAt?: string;
    finishedAt?: string;
    completedExercises?: number;
    totalVolumeLoad?: number;
    adherencePct?: number;
  }
) {
  const activePlan = readActivePlan() ?? {};
  if (!isObject(activePlan.training)) activePlan.training = {};

  const store = ensureExecutionStore(activePlan);

  const currentSession: TrainingExecutionSession = {
    ...session,
    startedAt: session.startedAt ?? new Date().toISOString(),
    finishedAt: session.finishedAt,
    completedExercises: session.completedExercises ?? 0,
    totalVolumeLoad: session.totalVolumeLoad ?? 0,
    adherencePct: session.adherencePct ?? 0,
  };

  activePlan.training.execution = {
    ...store,
    currentSession,
  };

  writeActivePlan(activePlan);
  return currentSession;
}

export function completeTrainingExecutionSession(session: TrainingExecutionSession) {
  const activePlan = readActivePlan() ?? {};
  if (!isObject(activePlan.training)) activePlan.training = {};

  const store = ensureExecutionStore(activePlan);

  const finishedSession: TrainingExecutionSession = {
    ...session,
    finishedAt: session.finishedAt ?? new Date().toISOString(),
  };

  const exercisePerformance: TrainingExercisePerformance[] = [
    ...store.exercisePerformance,
    ...finishedSession.exercises.map((exercise) => {
      const totalVolumeLoad = exercise.performedSets.reduce(
        (acc, setItem) => acc + (Number(setItem.loadKg ?? 0) || 0),
        0
      );

      const totalCompletedSets = exercise.performedSets.filter((setItem) => setItem.completed).length;

      return {
        executedAt: finishedSession.finishedAt!,
        sessionId: finishedSession.sessionId,
        trainingId: finishedSession.trainingId,
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.exerciseName,
        muscleGroup: exercise.muscleGroup,
        totalVolumeLoad,
        totalCompletedSets,
      };
    }),
  ];

  activePlan.training.execution = {
    currentSession: null,
    history: [...store.history, finishedSession],
    exercisePerformance,
  };

  writeActivePlan(activePlan);
  return finishedSession;
}

export function clearTrainingCurrentExecutionSession() {
  const activePlan = readActivePlan() ?? {};
  if (!isObject(activePlan.training)) activePlan.training = {};

  const store = ensureExecutionStore(activePlan);
  activePlan.training.execution = {
    ...store,
    currentSession: null,
  };

  writeActivePlan(activePlan);
}

export function getCanonicalTrainingLoadHistory() {
  const history = getTrainingExecutionHistory();

  return history.flatMap((session) =>
    safeArray(session.exercises).map((exercise) => ({
      data: String(session.finishedAt ?? session.startedAt).slice(0, 10),
      exercicioId: exercise.exerciseId,
      exercicioNome: exercise.exerciseName,
      cargaTotal: safeArray(exercise.performedSets).reduce(
        (acc, setItem) => acc + (Number(setItem.loadKg ?? 0) || 0),
        0
      ),
      detalhes: safeArray(exercise.performedSets).map((setItem) => ({
        serie: setItem.setNumber,
        carga: Number(setItem.loadKg ?? 0) || 0,
        repeticoes: Number.parseInt(String(setItem.repsPerformed ?? exercise.plannedReps ?? "0"), 10) || 0,
      })),
    }))
  );
}
