import { ensureTrainingPlanInActivePlan } from "./trainingPlan.ssot";

export type ActiveWorkoutExercise = {
  exerciseId: string;
  name: string;
  muscleGroup?: string;
  equipment?: string;
  mediaUrl?: string;
  mediaType?: "image" | "gif" | "mp4" | "webm";
  posterUrl?: string;
  targetMuscles?: string[];
  sourceLabel?: string;
  sets?: number;
  reps?: string;
  restSec?: number;
  rir?: number;
  rpe?: number;
  notes?: string;
  substitutions?: string[];
};

export type ActiveWorkoutBlock = {
  type: string;
  label: string;
  exercises: ActiveWorkoutExercise[];
};

export type ActiveWorkoutSession = {
  id: string;
  dayKey: "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";
  dayLabel: string;
  modality: string;
  title: string;
  focus: string;
  level: "iniciante" | "intermediario" | "avancado" | "auto";
  intensity: string;
  estimatedDurationMin: number;
  rationale?: string;
  blocks: ActiveWorkoutBlock[];
  tags?: string[];
};

type AnyObj = Record<string, any>;

function safeArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function readActivePlan(): AnyObj | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("mf:activePlan:v1");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return ensureTrainingPlanInActivePlan(parsed);
  } catch {
    return null;
  }
}

export function getCanonicalTrainingWorkouts(): ActiveWorkoutSession[] {
  const ap = readActivePlan();
  const workouts = ap?.training?.workouts;
  return Array.isArray(workouts) ? workouts : [];
}

export function getCanonicalTrainingSessionByIndex(index: number): ActiveWorkoutSession | null {
  const workouts = getCanonicalTrainingWorkouts();
  if (!workouts.length) return null;
  return workouts[index] ?? null;
}

export function getCanonicalTrainingSessionByDayKey(dayKey: string): ActiveWorkoutSession | null {
  const workouts = getCanonicalTrainingWorkouts();
  return workouts.find((w) => String(w?.dayKey ?? "").toLowerCase() === String(dayKey ?? "").toLowerCase()) ?? null;
}

export function getCanonicalTrainingDayOptions() {
  return getCanonicalTrainingWorkouts().map((w, idx) => ({
    index: idx,
    id: w.id,
    dayKey: w.dayKey,
    dayLabel: w.dayLabel,
    title: w.title,
    modality: w.modality,
    focus: w.focus,
    estimatedDurationMin: w.estimatedDurationMin,
    exerciseCount: safeArray(w.blocks).flatMap((b) => safeArray(b?.exercises)).length,
  }));
}

export function getCanonicalTrainingExercises(session: ActiveWorkoutSession | null): ActiveWorkoutExercise[] {
  if (!session) return [];
  return safeArray(session.blocks).flatMap((block) => safeArray(block?.exercises));
}
