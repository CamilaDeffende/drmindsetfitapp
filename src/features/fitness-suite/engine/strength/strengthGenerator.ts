import { STRENGTH_LIBRARY, filterStrengthByUserLevel, type UserLevel } from "../../data/strength/strengthLibrary";
import type { MuscleGroup, StrengthExercise } from "../../data/strength/strengthTypes";
import {
  buildStrengthPrescription,
  clampForSafety,
  STRATEGIES,
  type StrengthGoal,
  type StrengthStrategyKind,
  type SetPrescription,
} from "./strengthStrategies";

export type StrengthSplit = "full_body" | "upper_lower" | "push_pull_legs" | "abc" | "abcd";

export type StrengthDayTemplate = {
  label: string;
  focus: MuscleGroup[];
};

export type StrengthWorkoutExercise = {
  exerciseId: string;
  name: string;
  group: MuscleGroup;
  executionType: StrengthExercise["executionType"];
  biomechLevel: StrengthExercise["biomechLevel"];
  equipment: StrengthExercise["equipment"];
  strategy: {
    kind: StrengthStrategyKind;
    title: string;
    objective: string;
  };
  sets: SetPrescription[];
};

export type StrengthWorkout = {
  modality: "musculacao";
  split: StrengthSplit;
  goal: StrengthGoal;
  userLevel: UserLevel;
  dayLabel: string;
  exercises: StrengthWorkoutExercise[];
  notes?: string[];
};

/** hash determinístico simples (sem random) */
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickManyDeterministic<T>(arr: T[], count: number, seed: string): T[] {
  if (!arr.length || count <= 0) return [];
  const used = new Set<number>();
  const out: T[] = [];
  let cursor = hashString(seed);
  while (out.length < count && used.size < arr.length) {
    const idx = cursor % arr.length;
    if (!used.has(idx)) {
      used.add(idx);
      out.push(arr[idx]!);
    }
    cursor = (cursor * 1103515245 + 12345) >>> 0;
  }
  return out;
}

function resolveSplit(frequency: number, dominant: "musculacao" | "mixed"): StrengthSplit {
  if (frequency <= 2) return "full_body";
  if (frequency === 3) return dominant === "musculacao" ? "push_pull_legs" : "upper_lower";
  if (frequency === 4) return "upper_lower";
  return "abcd";
}

function templatesForSplit(split: StrengthSplit): StrengthDayTemplate[] {
  switch (split) {
    case "full_body":
      return [{ label: "Full Body", focus: ["quadriceps", "posterior", "peito", "costas", "ombros", "core"] }];
    case "upper_lower":
      return [
        { label: "Upper", focus: ["peito", "costas", "ombros", "biceps", "triceps", "core"] },
        { label: "Lower", focus: ["quadriceps", "posterior", "gluteos", "panturrilhas", "core"] },
      ];
    case "push_pull_legs":
      return [
        { label: "Push", focus: ["peito", "ombros", "triceps", "core"] },
        { label: "Pull", focus: ["costas", "biceps", "ombros", "core"] },
        { label: "Legs", focus: ["quadriceps", "posterior", "gluteos", "panturrilhas", "core"] },
      ];
    case "abc":
      return [
        { label: "A (Upper 1)", focus: ["peito", "costas", "ombros", "biceps"] },
        { label: "B (Lower)", focus: ["quadriceps", "posterior", "gluteos", "panturrilhas", "core"] },
        { label: "C (Upper 2)", focus: ["peito", "costas", "ombros", "triceps"] },
      ];
    case "abcd":
    default:
      return [
        { label: "A (Peito/Tríceps)", focus: ["peito", "triceps", "ombros", "core"] },
        { label: "B (Costas/Bíceps)", focus: ["costas", "biceps", "ombros", "core"] },
        { label: "C (Pernas)", focus: ["quadriceps", "posterior", "gluteos", "panturrilhas", "core"] },
        { label: "D (Ombros/Core)", focus: ["ombros", "core", "peito", "costas"] },
      ];
  }
}

function baseParams(goal: StrengthGoal): { baseSets: number; baseReps: { min: number; max: number }; baseRestSec: number } {
  switch (goal) {
    case "forca":
      return { baseSets: 4, baseReps: { min: 4, max: 6 }, baseRestSec: 120 };
    case "recomposicao":
      return { baseSets: 3, baseReps: { min: 8, max: 12 }, baseRestSec: 75 };
    case "hipertrofia":
    default:
      return { baseSets: 3, baseReps: { min: 8, max: 12 }, baseRestSec: 90 };
  }
}

function volumeByLevel(level: UserLevel): { compounds: number; accessories: number } {
  if (level === "iniciante") return { compounds: 2, accessories: 2 };
  if (level === "intermediario") return { compounds: 3, accessories: 2 };
  return { compounds: 3, accessories: 3 };
}

function candidatesByGroup(all: StrengthExercise[], group: MuscleGroup): StrengthExercise[] {
  return all.filter((e) => e.group === group);
}

/**
 * Escolhe exercícios APENAS dentro dos grupamentos do dia (focus).
 * Sem “preencher” com grupos fora do foco: soberania total do usuário.
 */
function chooseExercisesForDay(userLevel: UserLevel, focus: MuscleGroup[], seed: string): StrengthExercise[] {
  const allowedGroups = new Set(focus);
  const safePool = filterStrengthByUserLevel(userLevel, STRENGTH_LIBRARY).filter((e) => allowedGroups.has(e.group));

  const { compounds, accessories } = volumeByLevel(userLevel);
  const chosen: StrengthExercise[] = [];

  const bigGroups: MuscleGroup[] = ["peito", "costas", "quadriceps", "posterior", "gluteos", "ombros"];
  const compoundFocus = focus.filter((g) => bigGroups.includes(g));
  const compoundGroups = compoundFocus.length ? compoundFocus : focus;

  const compoundPool = safePool.filter((e) => e.compound);
  const compCandidates = compoundGroups.flatMap((g) => candidatesByGroup(compoundPool, g));
  chosen.push(...pickManyDeterministic(compCandidates, compounds, seed + "|comp"));

  const accessoryGroups: MuscleGroup[] = focus;
  const accPool = safePool.filter((e) => !e.compound || e.group === "core" || e.group === "panturrilhas");
  const accCandidates = accessoryGroups.flatMap((g) => candidatesByGroup(accPool, g));

  const acc = pickManyDeterministic(
    accCandidates.filter((e) => !chosen.some((c) => c.id === e.id)),
    accessories,
    seed + "|acc"
  );
  chosen.push(...acc);

  // fallback seguro: ainda dentro do foco
  const target = compounds + accessories;
  if (chosen.length < target) {
    const remaining = safePool.filter((e) => !chosen.some((c) => c.id === e.id));
    chosen.push(...pickManyDeterministic(remaining, target - chosen.length, seed + "|fill"));
  }

  return chosen;
}

function defaultStrategyKind(userLevel: UserLevel, goal: StrengthGoal): StrengthStrategyKind {
  if (userLevel === "iniciante") return "straight_sets";
  if (goal === "forca") return userLevel === "avancado" ? "back_off_set" : "piramidal_crescente";
  if (goal === "hipertrofia") return userLevel === "avancado" ? "back_off_set" : "piramidal_crescente";
  return "tut";
}

export function gerarTreinoMusculacao(params: {
  frequencyPerWeek: number;
  userLevel: UserLevel;
  goal: StrengthGoal;
  dayIndexWithinStrengthWeek: number;
  seed: string;
  /** grupamentos soberanos do dia (quando informado, sobrepõe template) */
  dayMuscleGroups?: MuscleGroup[];
  dominantModality?: "musculacao" | "mixed";
}): StrengthWorkout {
  const {
    frequencyPerWeek,
    userLevel,
    goal,
    dayIndexWithinStrengthWeek,
    seed,
    dayMuscleGroups,
    dominantModality = "musculacao",
  } = params;

  const split = resolveSplit(Math.max(1, frequencyPerWeek), dominantModality);
  const templates = templatesForSplit(split);
  const template = templates[dayIndexWithinStrengthWeek % templates.length] ?? templates[0]!;
  const dayFocus = dayMuscleGroups && dayMuscleGroups.length ? dayMuscleGroups : template.focus;

  const base = baseParams(goal);
  const daySeed = `${seed}|${split}|${template.label}|d${dayIndexWithinStrengthWeek}`;

  const exercises = chooseExercisesForDay(userLevel, dayFocus, daySeed);

  const preferredKind = defaultStrategyKind(userLevel, goal);

  const workoutExercises: StrengthWorkoutExercise[] = exercises.map((ex) => {
    const kind = clampForSafety(ex, userLevel, goal, preferredKind);
    const finalDef = STRATEGIES[kind];

    const { sets } = buildStrengthPrescription({
      userLevel,
      goal,
      exercise: ex,
      baseSets: base.baseSets,
      baseReps: base.baseReps,
      baseRestSec: base.baseRestSec,
    });

    // se buildStrengthPrescription escolheu outro tipo, garantimos coerência pelo clamp
    const finalSets = finalDef.kind === kind ? sets : finalDef.build({
      userLevel,
      goal,
      exercise: ex,
      baseSets: base.baseSets,
      baseReps: base.baseReps,
      baseRestSec: base.baseRestSec,
    });

    return {
      exerciseId: ex.id,
      name: ex.name,
      group: ex.group,
      executionType: ex.executionType,
      biomechLevel: ex.biomechLevel,
      equipment: ex.equipment,
      strategy: { kind: finalDef.kind, title: finalDef.title, objective: finalDef.objective },
      sets: finalSets,
    };
  });

  // Guard interno: iniciante nunca pode ter exercicio avançado
  if (userLevel === "iniciante") {
    const bad = workoutExercises.find((e) => e.biomechLevel === "avancado");
    if (bad) throw new Error(`Guard: iniciante recebeu exercício avançado: ${bad.exerciseId}`);
  }

  // Guard soberano: se dayMuscleGroups foi informado, nada pode sair fora
  if (dayMuscleGroups && dayMuscleGroups.length) {
    const allowed = new Set(dayMuscleGroups);
    const bad = workoutExercises.find((e) => !allowed.has(e.group));
    if (bad) throw new Error(`Guard: exercício fora dos grupamentos do dia: ${bad.exerciseId} (${bad.group})`);
  }

  return {
    modality: "musculacao",
    split,
    goal,
    userLevel,
    dayLabel: template.label,
    exercises: workoutExercises,
    notes: [
      "Treino gerado de forma determinística (mesmos inputs → mesmo output).",
      "Respeita biomecânica por nível (iniciante não recebe avançado).",
      dayMuscleGroups && dayMuscleGroups.length
        ? "Respeita grupamentos soberanos do dia (somente os selecionados)."
        : "Sem grupamentos por dia informados: usando template do split.",
    ],
  };
}
