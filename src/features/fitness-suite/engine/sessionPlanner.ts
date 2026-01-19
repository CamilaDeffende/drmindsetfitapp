import type { ActivityLevel, WorkoutModality, WorkoutStructure } from "./weeklyProtocol";
import * as WorkoutLibrary from "../workouts/library";

// Tipo leve e compatível (não força UI agora)
export type SessionExercise = {
  name: string;
  sets: number;
  reps: string;      // ex: "4-6" / "8-12" / "30-45s"
  rest: string;      // ex: "60-90s"
  notes?: string;
};

export type SessionWorkoutPlan = {
  modality: WorkoutModality;
  modalityLevel: ActivityLevel;
  structure: WorkoutStructure;
  exercises: SessionExercise[];
};

type AnyExercise = Record<string, any>;

// Tenta consumir qualquer formato de library sem quebrar build
const loadLibrary = () => (WorkoutLibrary as any);


const normalize = (v: unknown) => String(v ?? "").trim().toLowerCase();

const inferExercisesArray = (lib: any): AnyExercise[] => {
  // Tentativas comuns
  const candidates = [
    lib.EXERCISES,
    lib.EXERCISE_LIBRARY,
    lib.LIBRARY,
    lib.exercises,
    lib.exerciseLibrary,
  ];
  for (const c of candidates) {
    if (Array.isArray(c) && c.length) return c as AnyExercise[];
  }

  // Caso exista um mapa por modalidade (ex.: EXERCISES_BY_MODALITY)
  const mapCandidates = [lib.EXERCISES_BY_MODALITY, lib.exercisesByModality];
  for (const mc of mapCandidates) {
    if (mc && typeof mc === "object") {
      const arr = Object.values(mc).flat();
      if (Array.isArray(arr) && arr.length) return arr as AnyExercise[];
    }
  }

  return [];
};

const matchesModality = (ex: AnyExercise, modality: WorkoutModality): boolean => {
  const m = normalize(modality);

  // formatos possíveis
  const f1 = Array.isArray(ex.modalities) ? ex.modalities.map(normalize) : null;
  if (f1 && f1.includes(m)) return true;

  const f2 = Array.isArray(ex.tags) ? ex.tags.map(normalize) : null;
  if (f2 && f2.includes(m)) return true;

  const f3 = normalize(ex.modality);
  if (f3 && f3 === m) return true;

  // fallback: campo "category" ou "group"
  const f4 = normalize(ex.category || ex.group);
  if (f4 && f4.includes(m)) return true;

  return false;
};

const safeName = (ex: AnyExercise): string => {
  return (
    ex.name ||
    ex.title ||
    ex.nome ||
    ex.label ||
    ex.exercise ||
    "Exercício"
  );
};

const stableSortByName = (arr: AnyExercise[]) =>
  [...arr].sort((a, b) => safeName(a).localeCompare(safeName(b), "pt-BR"));

const prescriptionByStructure = (
  structure: WorkoutStructure,
  level: ActivityLevel
): Pick<SessionExercise, "sets" | "reps" | "rest" | "notes"> => {
  // default seguro
  const rest = structure.descanso || "60-90s";

  if (structure.type === "força") {
    return {
      sets: level === "avancado" ? 5 : 4,
      reps: level === "iniciante" ? "5-6" : "3-6",
      rest: rest || "90-150s",
      notes: "Foco em técnica, progressão de carga e execução controlada.",
    };
  }

  if (structure.type === "hipertrofia") {
    return {
      sets: level === "iniciante" ? 3 : 4,
      reps: level === "iniciante" ? "8-10" : "8-12",
      rest: rest || "60-90s",
      notes: "Amplitude completa, controle de tempo e proximidade de falha com segurança.",
    };
  }

  if (structure.type === "técnico") {
    return {
      sets: 3,
      reps: level === "iniciante" ? "6-8" : "8-10",
      rest: rest || "60-120s",
      notes: "Priorize qualidade, estabilidade e padrões corretos.",
    };
  }

  if (structure.type === "metabólico") {
    return {
      sets: 4,
      reps: level === "iniciante" ? "20-30s" : "30-45s",
      rest: level === "iniciante" ? "60-90s" : "45-75s",
      notes: "Blocos por tempo. Ajuste intensidade para manter técnica.",
    };
  }

  // resistência
  return {
    sets: 1,
    reps: structure.duracaoEstimada || (level === "iniciante" ? "25-35min" : "35-55min"),
    rest: "—",
    notes: "Sessão contínua ou intervalos guiados conforme prescrição.",
  };
};

const pickCountByVolume = (volume: number) => {
  if (volume >= 8) return 6;
  if (volume >= 6) return 5;
  if (volume >= 4) return 4;
  return 3;
};

export const buildSessionPlan = (args: {
  modality: WorkoutModality;
  modalityLevel: ActivityLevel;
  structure: WorkoutStructure;
}): SessionWorkoutPlan => {
  const { modality, modalityLevel, structure } = args;

  const lib = loadLibrary();
  const all = inferExercisesArray(lib);
  const filtered = stableSortByName(all.filter((ex) => matchesModality(ex, modality)));

  // Se a library ainda não tiver exercícios catalogados por modalidade, não quebra:
  const pool = filtered.length ? filtered : stableSortByName(all);

  const take = pickCountByVolume(structure.volume);
  const chosen = pool.slice(0, take);

  const presc = prescriptionByStructure(structure, modalityLevel);

  const exercises: SessionExercise[] = chosen.map((ex) => ({
    name: safeName(ex),
    sets: presc.sets,
    reps: presc.reps,
    rest: presc.rest,
    notes: presc.notes,
  }));

  // fallback final: nunca retornar vazio em modalidades de treino
  if (!exercises.length) {
    exercises.push({
      name: "Circuito base (ajuste pelo treinador)",
      sets: presc.sets,
      reps: presc.reps,
      rest: presc.rest,
      notes: presc.notes,
    });
  }

  return { modality, modalityLevel, structure, exercises };
};
