/**
 * SSOT TREINO OFICIAL
 * Fonte primária:
 * - activePlan.training.smartPlan
 * - activePlan.training.workouts
 *
 * Compatibilidade derivada temporária:
 * - activePlan.workout.week
 *
 * state.treino/state.treinoAtivo e builders legados NÃO são fonte principal.
 */

import { generateSmartTraining } from "@/engine/training/orchestrator/generateSmartTraining";
import {
  trainingPlanToActiveWorkoutsAdapter,
  type ActiveWorkoutSession,
} from "@/engine/training/adapters/trainingPlanToActiveWorkoutsAdapter";
import { canonicalWorkoutsToLegacyWeek } from "@/engine/training/adapters/canonicalWorkoutsToLegacyWeek";

type AnyObj = Record<string, any>;

function isObject(value: unknown): value is AnyObj {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function safeArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function hasCanonicalWorkouts(activePlan: AnyObj): boolean {
  return Array.isArray(activePlan?.training?.workouts) && activePlan.training.workouts.length > 0;
}

function hasSmartPlan(activePlan: AnyObj): boolean {
  return isObject(activePlan?.training?.smartPlan);
}

function extractDraft(activePlan: AnyObj): AnyObj | null {
  if (isObject(activePlan?.draft)) return activePlan.draft;
  if (isObject(activePlan?.onboardingDraft)) return activePlan.onboardingDraft;
  return null;
}

function normalizeExistingCanonicalWorkouts(activePlan: AnyObj): ActiveWorkoutSession[] {
  const existing = safeArray<any>(activePlan?.training?.workouts);
  if (!existing.length) return [];

  return existing.map((session, index) => {
    const blocks = safeArray<any>(session?.blocks).length
      ? safeArray<any>(session.blocks).map((block) => ({
          type: String(block?.type ?? "main"),
          label: String(block?.label ?? "Bloco principal"),
          exercises: safeArray<any>(block?.exercises).map((ex, exIndex) => ({
            exerciseId: String(ex?.exerciseId ?? ex?.id ?? `ex-${index + 1}-${exIndex + 1}`),
            name: String(ex?.name ?? ex?.titulo ?? `Exercício ${exIndex + 1}`),
            muscleGroup: ex?.muscleGroup ?? ex?.group ?? ex?.target,
            equipment: ex?.equipment,
            sets: typeof ex?.sets === "number" ? ex.sets : undefined,
            reps: ex?.reps != null ? String(ex.reps) : undefined,
            restSec: typeof ex?.restSec === "number" ? ex.restSec : undefined,
            rir: typeof ex?.rir === "number" ? ex.rir : undefined,
            rpe: typeof ex?.rpe === "number" ? ex.rpe : undefined,
            notes: ex?.notes,
            substitutions: safeArray<string>(ex?.substitutions),
          })),
        }))
      : [
          {
            type: "main",
            label: "Bloco principal",
            exercises: safeArray<any>(session?.exercises).map((ex, exIndex) => ({
              exerciseId: String(ex?.exerciseId ?? ex?.id ?? `ex-${index + 1}-${exIndex + 1}`),
              name: String(ex?.name ?? ex?.titulo ?? `Exercício ${exIndex + 1}`),
              muscleGroup: ex?.muscleGroup ?? ex?.group ?? ex?.target,
              equipment: ex?.equipment,
              sets: typeof ex?.sets === "number" ? ex.sets : undefined,
              reps: ex?.reps != null ? String(ex.reps) : undefined,
              restSec: typeof ex?.restSec === "number" ? ex.restSec : undefined,
              rir: typeof ex?.rir === "number" ? ex.rir : undefined,
              rpe: typeof ex?.rpe === "number" ? ex.rpe : undefined,
              notes: ex?.notes,
              substitutions: safeArray<string>(ex?.substitutions),
            })),
          },
        ];

    return {
      id: String(session?.id ?? `session-${index + 1}`),
      dayKey: (session?.dayKey ?? "seg") as ActiveWorkoutSession["dayKey"],
      dayLabel: String(session?.dayLabel ?? session?.dia ?? "Sessão"),
      modality: String(session?.modality ?? "musculacao"),
      title: String(session?.title ?? session?.titulo ?? `Treino ${index + 1}`),
      focus: String(session?.focus ?? session?.foco ?? "geral"),
      level:
        session?.level === "iniciante" ||
        session?.level === "intermediario" ||
        session?.level === "avancado" ||
        session?.level === "auto"
          ? session.level
          : "auto",
      intensity: String(session?.intensity ?? session?.intensidade ?? "moderada"),
      estimatedDurationMin:
        typeof session?.estimatedDurationMin === "number"
          ? session.estimatedDurationMin
          : typeof session?.duracaoMin === "number"
            ? session.duracaoMin
            : 45,
      rationale: session?.rationale,
      blocks,
      tags: safeArray<string>(session?.tags),
    };
  });
}

function buildFromSmartPlan(activePlan: AnyObj): { smartPlan: AnyObj | null; workouts: ActiveWorkoutSession[] } {
  const existingSmartPlan = isObject(activePlan?.training?.smartPlan) ? activePlan.training.smartPlan : null;

  if (existingSmartPlan) {
    return {
      smartPlan: existingSmartPlan,
      workouts: trainingPlanToActiveWorkoutsAdapter(existingSmartPlan),
    };
  }

  const draft = extractDraft(activePlan);
  if (!draft) {
    return { smartPlan: null, workouts: [] };
  }

  try {
    const smartPlan = generateSmartTraining(draft);
    const workouts = trainingPlanToActiveWorkoutsAdapter(smartPlan);
    return { smartPlan, workouts };
  } catch {
    return { smartPlan: null, workouts: [] };
  }
}

export function ensureTrainingPlanInActivePlan(activePlan: any): any {
  if (!isObject(activePlan)) return activePlan;

  activePlan.training = isObject(activePlan.training) ? activePlan.training : {};
  activePlan.workout = isObject(activePlan.workout) ? activePlan.workout : {};

  let smartPlan = hasSmartPlan(activePlan) ? activePlan.training.smartPlan : null;
  let workouts = hasCanonicalWorkouts(activePlan)
    ? normalizeExistingCanonicalWorkouts(activePlan)
    : [];

  if (!smartPlan || !workouts.length) {
    const built = buildFromSmartPlan(activePlan);
    smartPlan = smartPlan ?? built.smartPlan;
    workouts = workouts.length ? workouts : built.workouts;
  }

  activePlan.training.smartPlan = smartPlan ?? null;
  activePlan.training.workouts = workouts;
  activePlan.training.execution =
    isObject(activePlan.training.execution)
      ? {
          currentSession: activePlan.training.execution.currentSession ?? null,
          history: safeArray(activePlan.training.execution.history),
          exercisePerformance: safeArray(activePlan.training.execution.exercisePerformance),
        }
      : {
          currentSession: null,
          history: [],
          exercisePerformance: [],
        };

  activePlan.workout.week = canonicalWorkoutsToLegacyWeek(workouts);

  return activePlan;
}
