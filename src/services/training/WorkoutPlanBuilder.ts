// MF_WORKOUT_PLAN_BUILDER_V4
// Preview semanal do onboarding priorizando os dias/modalidades reais do Step 5.
// Quando existir treino canônico, ele é usado como fonte de exercícios para musculação.
// Para modalidades como bike, corrida, funcional e crossfit, usamos uma prévia coerente
// com o nível selecionado, sem depender do motor canônico de força.

import { buildActivePlanFromDraft } from "@/services/plan.service";

export type MF_Level = "iniciante" | "intermediario" | "avancado";

export type MF_Session = {
  day: string;
  modality: string;
  level: MF_Level;
  exercises: any[];
  slot?: number;
};

export type MF_PlanPreview = {
  sessions: MF_Session[];
  meta: {
    modalities: string[];
    exerciseSource: string;
    weekOrder: string[];
  };
};

const WEEK: string[] = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];

const PREVIEW_LIBRARY: Record<string, Record<MF_Level, string[]>> = {
  bike: {
    iniciante: ["Zona 2", "Cadencia confortavel", "Recuperacao ativa"],
    intermediario: ["Sweet Spot", "Cadencia alta", "Bloco progressivo", "Recuperacao ativa"],
    avancado: ["HIIT Bike", "Sprint curto", "Cadencia alta", "Bloco progressivo", "Resfriamento"],
  },
  corrida: {
    iniciante: ["Caminhada acelerada", "Trote leve", "Mobilidade de tornozelo"],
    intermediario: ["Rodagem moderada", "Tempo Run", "Drills de tecnica", "Desaceleracao"],
    avancado: ["Intervalado", "Tiro curto", "Rodagem de recuperacao", "Drills de tecnica", "Desaceleracao"],
  },
  funcional: {
    iniciante: ["Agachamento livre", "Afundo alternado", "Prancha", "Farmer's Carry"],
    intermediario: ["Agachamento livre", "Push-Up", "Dead Bug", "Farmer's Carry", "Pallof Press"],
    avancado: ["Walking Lunge", "Push-Up", "Pallof Press", "Farmer's Carry", "Front Plank", "Dead Bug"],
  },
  crossfit: {
    iniciante: ["Air Squat", "Push-Up", "Farmer's Carry", "Bike Interval"],
    intermediario: ["Goblet Squat", "Push-Up", "Bike Interval", "Farmer's Carry", "Front Plank"],
    avancado: ["Goblet Squat", "Assisted Pull-Up", "Bike Interval", "Pallof Press", "Walking Lunge", "Front Plank"],
  },
};

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizeDay(value: unknown): string {
  const raw = String(value ?? "").trim().toLowerCase();
  const map: Record<string, string> = {
    seg: "seg",
    segunda: "seg",
    ter: "ter",
    terca: "ter",
    terça: "ter",
    qua: "qua",
    quarta: "qua",
    qui: "qui",
    quinta: "qui",
    sex: "sex",
    sexta: "sex",
    sab: "sab",
    sabado: "sab",
    sábado: "sab",
    dom: "dom",
    domingo: "dom",
  };

  return map[raw] ?? raw;
}

function normalizeModality(value: unknown): string {
  const raw = String(value ?? "").trim().toLowerCase();
  const map: Record<string, string> = {
    musculacao: "musculacao",
    musculação: "musculacao",
    corrida: "corrida",
    bike: "bike",
    spinning: "bike",
    funcional: "funcional",
    cross: "crossfit",
    crossfit: "crossfit",
  };

  return map[raw] ?? raw;
}

function normalizeLevel(value: unknown): MF_Level {
  const raw = String(value ?? "").toLowerCase();
  if (raw.includes("avan")) return "avancado";
  if (raw.includes("inter")) return "intermediario";
  return "iniciante";
}

function extractExerciseName(exercise: any, index: number) {
  return (
    exercise?.name ??
    exercise?.nome ??
    exercise?.title ??
    exercise?.titulo ??
    exercise?.exerciseName ??
    exercise?.label ??
    `Exercicio ${index + 1}`
  );
}

function hashText(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pickPreviewExercises(modality: string, level: MF_Level, day: string, slot: number) {
  const catalog = PREVIEW_LIBRARY[modality]?.[level] ?? PREVIEW_LIBRARY[modality]?.iniciante ?? [];
  if (!catalog.length) return [];

  const desiredCount =
    modality === "bike" || modality === "corrida"
      ? Math.min(catalog.length, 3)
      : Math.min(catalog.length, level === "iniciante" ? 4 : 5);

  const startIndex = hashText(`${modality}:${level}:${day}:${slot}`) % catalog.length;
  const names: string[] = [];

  for (let i = 0; i < desiredCount; i += 1) {
    const name = catalog[(startIndex + i) % catalog.length];
    if (!names.includes(name)) names.push(name);
  }

  return names.map((name) => ({ name }));
}

function groupCanonicalStrengthWorkouts(workouts: any[]) {
  const grouped: Record<string, any[]> = {};

  for (const workout of workouts) {
    const day = normalizeDay(workout?.dayKey ?? workout?.day);
    const modality = normalizeModality(workout?.modality ?? "musculacao");
    if (day !== "seg" && day !== "ter" && day !== "qua" && day !== "qui" && day !== "sex" && day !== "sab" && day !== "dom") {
      continue;
    }
    if (modality !== "musculacao") continue;

    const key = `${day}:${modality}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(workout);
  }

  return grouped;
}

function getLegacyWeekSource(activePlan: any) {
  const trainingWeek = safeArray<any>(activePlan?.training?.week);
  if (trainingWeek.length) return trainingWeek;

  const trainingDays = safeArray<any>(activePlan?.training?.days);
  if (trainingDays.length) return trainingDays;

  return safeArray<any>(activePlan?.workout?.week);
}

function extractWorkoutExercises(workout: any) {
  return safeArray<any>(workout?.blocks).flatMap((block) =>
    safeArray<any>(block?.exercises).map((exercise, index) => ({
      ...exercise,
      name: extractExerciseName(exercise, index),
    }))
  );
}

function buildSessionsFromLegacyWeek(activePlan: any, draft: any): MF_Session[] {
  const legacyWeek = getLegacyWeekSource(activePlan);
  const canonicalWorkouts = safeArray<any>(activePlan?.training?.workouts);
  const groupedStrength = groupCanonicalStrengthWorkouts(canonicalWorkouts);
  const usedStrengthIndex: Record<string, number> = {};

  const step5 = draft?.step5 ?? {};
  const levelsByModality =
    (step5?.condicionamentoPorModalidade && typeof step5.condicionamentoPorModalidade === "object"
      ? step5.condicionamentoPorModalidade
      : {}) ?? {};

  const slotByDay: Record<string, number> = {};
  const sessions: MF_Session[] = [];

  for (const item of legacyWeek) {
    const day = normalizeDay(item?.dayKey ?? item?.day ?? item?.dia);
    const modality = normalizeModality(item?.modalidade ?? item?.modality ?? item?.type);
    if (!WEEK.includes(day) || !modality) continue;

    const slot = slotByDay[day] ?? 0;
    slotByDay[day] = slot + 1;

    const level = normalizeLevel(
      levelsByModality?.[modality] ??
        item?.level ??
        activePlan?.training?.level ??
        "iniciante"
    );

    let exercises: any[] = [];

    if (modality === "musculacao") {
      const key = `${day}:${modality}`;
      const dayStrengthSessions = groupedStrength[key] ?? [];
      const currentIndex = usedStrengthIndex[key] ?? 0;
      const selectedWorkout = dayStrengthSessions[currentIndex] ?? dayStrengthSessions[dayStrengthSessions.length - 1];
      usedStrengthIndex[key] = currentIndex + 1;
      exercises = selectedWorkout ? extractWorkoutExercises(selectedWorkout) : [];
    }

    if (!exercises.length) {
      exercises = pickPreviewExercises(modality, level, day, slot);
    }

    sessions.push({
      day,
      modality,
      level,
      slot,
      exercises,
    });
  }

  return sessions.sort((a, b) => {
    const dayDiff = WEEK.indexOf(a.day) - WEEK.indexOf(b.day);
    if (dayDiff !== 0) return dayDiff;
    return (a.slot ?? 0) - (b.slot ?? 0);
  });
}

function normalizePreviewSessions(workouts: any[]): MF_Session[] {
  const sessions: MF_Session[] = [];
  const slotByDay: Record<string, number> = {};

  for (const workout of workouts) {
    const day = normalizeDay(workout?.dayKey ?? workout?.day);
    if (!WEEK.includes(day)) continue;

    const exercises = extractWorkoutExercises(workout);
    const slot = slotByDay[day] ?? 0;
    slotByDay[day] = slot + 1;

    sessions.push({
      day,
      modality: normalizeModality(workout?.modality ?? "musculacao"),
      level: normalizeLevel(workout?.level),
      slot,
      exercises,
    });
  }

  return sessions.sort((a, b) => {
    const dayDiff = WEEK.indexOf(a.day) - WEEK.indexOf(b.day);
    if (dayDiff !== 0) return dayDiff;
    return (a.slot ?? 0) - (b.slot ?? 0);
  });
}

export function buildWorkoutPlanPreview(draft: any): MF_PlanPreview {
  try {
    const activePlan = buildActivePlanFromDraft(draft ?? {});
    const legacyWeek = getLegacyWeekSource(activePlan);
    const sessions = legacyWeek.length
      ? buildSessionsFromLegacyWeek(activePlan, draft ?? {})
      : normalizePreviewSessions(safeArray<any>(activePlan?.training?.workouts));

    const modalities = Array.from(
      new Set(
        sessions
          .map((session) => String(session?.modality ?? "").trim())
          .filter(Boolean)
      )
    );

    return {
      sessions,
      meta: {
        modalities,
        exerciseSource: legacyWeek.length ? "workout.week+training.workouts" : "training.workouts",
        weekOrder: WEEK,
      },
    };
  } catch {
    return {
      sessions: [],
      meta: {
        modalities: [],
        exerciseSource: "training.workouts",
        weekOrder: WEEK,
      },
    };
  }
}
