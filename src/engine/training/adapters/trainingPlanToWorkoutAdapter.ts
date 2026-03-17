import type { TrainingPlan, TrainingSession, PrescribedExercise } from "../core/types";

type LegacyExercise = {
  exercicio: {
    id: string;
    nome: string;
    grupoMuscular: string;
    equipamento: string;
    descricao: string;
    substituicoes: string[];
  };
  series: number;
  repeticoes: string;
  descanso: number;
  observacoes?: string;

  // aliases legados consumidos no app
  nome: string;
  reps: string;
};

type LegacyWorkoutDay = {
  dia: string;
  modalidade: string;
  titulo: string;
  grupamentos: string[];
  exercicios: LegacyExercise[];
  volumeTotal: number;
};

type LegacyWorkoutOutput = {
  week: LegacyWorkoutDay[];
  split: string;
  rationale: string[];
  meta: {
    source: "smart-training-engine";
    version: number;
    createdAt: string;
  };
};

const DAY_KEYS = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"] as const;

function inferGroupamentos(session: TrainingSession): string[] {
  const text = `${session.focus} ${session.name}`.toLowerCase();
  const groups = new Set<string>();

  if (text.includes("lower") || text.includes("quadr") || text.includes("perna") || text.includes("hinge") || text.includes("posterior")) {
    groups.add("pernas");
  }
  if (text.includes("upper") || text.includes("peito") || text.includes("push")) {
    groups.add("peito");
  }
  if (text.includes("pull") || text.includes("costas") || text.includes("row") || text.includes("back")) {
    groups.add("costas");
  }
  if (text.includes("ombro") || text.includes("shoulder")) {
    groups.add("ombros");
  }
  if (text.includes("core")) {
    groups.add("core");
  }
  if (text.includes("cardio") || text.includes("interval") || text.includes("metabolic")) {
    groups.add("cardio");
  }

  return groups.size ? Array.from(groups) : ["full body"];
}

function inferModalidade(session: TrainingSession): string {
  const text = `${session.focus} ${session.name}`.toLowerCase();
  if (text.includes("interval") || text.includes("cardio")) return "cardio";
  if (text.includes("running") || text.includes("run")) return "corrida";
  if (text.includes("bike") || text.includes("cycling")) return "bike";
  return "musculacao";
}

function toLegacyExercise(item: PrescribedExercise): LegacyExercise {
  const grupoMuscular =
    item.name.toLowerCase().includes("squat") || item.name.toLowerCase().includes("lunge")
      ? "pernas"
      : item.name.toLowerCase().includes("row") || item.name.toLowerCase().includes("pull")
        ? "costas"
        : item.name.toLowerCase().includes("press") || item.name.toLowerCase().includes("push")
          ? "peito"
          : item.name.toLowerCase().includes("curl") || item.name.toLowerCase().includes("triceps")
            ? "bracos"
            : item.name.toLowerCase().includes("plank") || item.name.toLowerCase().includes("pallof") || item.name.toLowerCase().includes("bug")
              ? "core"
              : "geral";

  return {
    exercicio: {
      id: item.exerciseId,
      nome: item.name,
      grupoMuscular,
      equipamento: "auto",
      descricao: item.rationale ?? "",
      substituicoes: [],
    },
    series: item.sets,
    repeticoes: item.reps ?? (item.durationSec ? `${item.durationSec}s` : "8-12"),
    descanso: item.restSec,
    observacoes: item.rationale,
    nome: item.name,
    reps: item.reps ?? (item.durationSec ? `${item.durationSec}s` : "8-12"),
  };
}

export function trainingPlanToWorkoutAdapter(plan: TrainingPlan): LegacyWorkoutOutput {
  const week: LegacyWorkoutDay[] = plan.sessions.map((session, index) => {
    const exercicios = session.exercises.map(toLegacyExercise);
    const volumeTotal = exercicios.reduce((sum, exercise) => sum + (Number(exercise.series) || 0), 0);

    return {
      dia: DAY_KEYS[index] ?? `dia-${index + 1}`,
      modalidade: inferModalidade(session),
      titulo: session.name,
      grupamentos: inferGroupamentos(session),
      exercicios,
      volumeTotal,
    };
  });

  return {
    week,
    split: plan.split,
    rationale: plan.rationale,
    meta: {
      source: "smart-training-engine",
      version: plan.version,
      createdAt: plan.createdAt,
    },
  };
}
