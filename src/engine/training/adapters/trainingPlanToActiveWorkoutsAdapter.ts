import { lookupExerciseVisual } from "@/services/training/exerciseMediaCatalog";

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

const DAY_KEYS = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"] as const;
const DAY_LABELS: Record<(typeof DAY_KEYS)[number], string> = {
  seg: "Segunda",
  ter: "Terca",
  qua: "Quarta",
  qui: "Quinta",
  sex: "Sexta",
  sab: "Sabado",
  dom: "Domingo",
};

function normalizeDayKey(value: unknown, index: number): ActiveWorkoutSession["dayKey"] {
  const raw = String(value ?? "").trim().toLowerCase();
  const map: Record<string, ActiveWorkoutSession["dayKey"]> = {
    seg: "seg", segunda: "seg", monday: "seg",
    ter: "ter", terca: "ter", tuesday: "ter",
    qua: "qua", quarta: "qua", wednesday: "qua",
    qui: "qui", quinta: "qui", thursday: "qui",
    sex: "sex", sexta: "sex", friday: "sex",
    sab: "sab", sabado: "sab", saturday: "sab",
    dom: "dom", domingo: "dom", sunday: "dom",
  };
  return map[raw] ?? DAY_KEYS[index % DAY_KEYS.length];
}

function normalizeLevel(value: unknown): ActiveWorkoutSession["level"] {
  const raw = String(value ?? "").toLowerCase();
  if (raw.includes("inic")) return "iniciante";
  if (raw.includes("inter")) return "intermediario";
  if (raw.includes("avan")) return "avancado";
  return "auto";
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function trainingPlanToActiveWorkoutsAdapter(trainingPlan: any): ActiveWorkoutSession[] {
  const sessions = safeArray<any>(
    trainingPlan?.sessions ??
    trainingPlan?.weeklyPlan ??
    trainingPlan?.week ??
    trainingPlan?.workouts
  );

  return sessions.map((session, index) => {
    const explicitDayKey = normalizeDayKey(
      session?.dayKey ?? session?.day ?? session?.weekday,
      index
    );

    const explicitDayLabel = String(
      session?.dayLabel ?? session?.dayName ?? DAY_LABELS[explicitDayKey]
    );

    const exercises = safeArray<any>(session?.exercises).map((ex, exIndex) => {
      const exerciseId = String(ex?.exerciseId ?? ex?.id ?? `ex-${index + 1}-${exIndex + 1}`);
      const name = String(ex?.name ?? ex?.titulo ?? `Exercicio ${exIndex + 1}`);
      const visual = lookupExerciseVisual({ exerciseId, name });

      return {
        exerciseId,
        name,
        muscleGroup: ex?.muscleGroup ?? ex?.group ?? ex?.target,
        equipment: ex?.equipment,
        mediaUrl: ex?.mediaUrl ?? visual?.mediaUrl,
        mediaType: ex?.mediaType ?? visual?.mediaType,
        posterUrl: ex?.posterUrl ?? visual?.posterUrl,
        targetMuscles: Array.isArray(ex?.targetMuscles) ? ex.targetMuscles : visual?.targetMuscles,
        sourceLabel: ex?.sourceLabel ?? visual?.sourceLabel,
        sets: typeof ex?.sets === "number" ? ex.sets : undefined,
        reps: ex?.reps != null ? String(ex.reps) : undefined,
        restSec: typeof ex?.restSec === "number" ? ex.restSec : undefined,
        rir: typeof ex?.rir === "number" ? ex.rir : undefined,
        rpe: typeof ex?.rpe === "number" ? ex.rpe : undefined,
        notes: ex?.notes,
        substitutions: safeArray<string>(ex?.substitutions),
      };
    });

    return {
      id: String(session?.id ?? `session-${index + 1}`),
      dayKey: explicitDayKey,
      dayLabel: explicitDayLabel,
      modality: String(session?.modality ?? session?.type ?? "musculacao"),
      title: String(session?.title ?? session?.name ?? `Treino ${index + 1}`),
      focus: String(session?.focus ?? session?.goal ?? "geral"),
      level: normalizeLevel(session?.level ?? session?.experienceLevel),
      intensity: String(session?.intensity ?? session?.effort ?? "moderada"),
      estimatedDurationMin: Number(session?.estimatedDurationMin ?? session?.durationMin ?? 45) || 45,
      rationale: session?.rationale ?? session?.reasoning,
      blocks: [
        {
          type: String(session?.blockType ?? "main"),
          label: String(session?.blockLabel ?? "Bloco principal"),
          exercises,
        },
      ],
      tags: safeArray<string>(session?.tags),
    };
  });
}
