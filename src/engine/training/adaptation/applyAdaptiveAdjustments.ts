import type { AdaptationDecision, ExercisePrescription, TrainingPlan } from "../core/types";

function clampSets(value: number): number {
  return Math.max(1, Math.min(8, value));
}

function adjustExercise(
  exercise: ExercisePrescription,
  decision: AdaptationDecision,
): ExercisePrescription {
  let sets = exercise.sets;
  const notes = [...(exercise.notes ?? [])];

  if (decision.recommendedVolumeAdjustmentPct <= -15) {
    sets = clampSets(sets - 1);
    notes.push("Volume reduzido automaticamente pelo motor.");
  } else if (decision.recommendedVolumeAdjustmentPct >= 10) {
    sets = clampSets(sets + 1);
    notes.push("Volume ampliado automaticamente pelo motor.");
  }

  if (decision.recommendedLoadAdjustmentPct < 0) {
    notes.push(`Reduzir carga em ~${Math.abs(decision.recommendedLoadAdjustmentPct)}% nesta sessão.`);
  } else if (decision.recommendedLoadAdjustmentPct > 0) {
    notes.push(`Progredir carga em ~${decision.recommendedLoadAdjustmentPct}% se a técnica estiver estável.`);
  }

  return {
    ...exercise,
    sets,
    notes,
  };
}

export function applyAdaptiveAdjustments(
  plan: TrainingPlan,
  decision: AdaptationDecision,
): TrainingPlan {
  const clone = structuredClone(plan);

  clone.sessions = clone.sessions.map((session) => ({
    ...session,
    exercises: session.exercises.map((exercise) => adjustExercise(exercise, decision)),
    rationale: [
      ...(session.rationale ?? []),
      `Ajuste adaptativo aplicado: ${decision.actions.join(", ") || "MAINTAIN"}.`,
    ],
  }));

  clone.rationale = [
    ...(clone.rationale ?? []),
    `Motor adaptativo aplicou ajustes canônicos: ${decision.actions.join(", ") || "MAINTAIN"}.`,
  ];

  clone.version = (clone.version ?? 1) + 1;
  return clone;
}
