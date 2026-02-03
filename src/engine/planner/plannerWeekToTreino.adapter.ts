import type { PlanejamentoTreino, DivisaoTreinoConfig, TreinoDia, ExercicioTreino, Exercicio } from "@/types";
import type { PlannerInput, WeeklyPlanOutput, PlannedSession } from "./trainingPlanner.engine";

type DayKey = keyof WeeklyPlanOutput;

// map PT curto usado no app -> dayKey do planner
const PT_TO_DAYKEY: Record<string, DayKey> = {
  Seg: "monday",
  Ter: "tuesday",
  Qua: "wednesday",
  Qui: "thursday",
  Sex: "friday",
  Sab: "saturday",
  Sáb: "saturday",
  Dom: "sunday",
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function inferDivisaoTipo(freq: number): DivisaoTreinoConfig["tipo"] {
  if (freq <= 3) return "FullBody";
  if (freq === 4) return "UpperLower";
  if (freq === 5) return "ABCDE";
  return "PushPullLegs";
}

function inferIntensidade(goal: PlannerInput["goal"]): DivisaoTreinoConfig["intensidade"] {
  if (goal === "emagrecimento") return "moderada";
  if (goal === "performance") return "intensa";
  return "moderada";
}

function makeEx(id: string, nome: string, grupo: string): Exercicio {
  return {
    id,
    nome,
    grupoMuscular: grupo,
    equipamento: "livre",
    descricao: "",
    substituicoes: [],
  };
}

/**
 * IMPORTANTe: o UI atual em PlanosAtivos renderiza `ex.nome`, `ex.series`, `ex.reps`, `ex.descanso`
 * (shape legado “flat”). Para não quebrar, a gente devolve:
 * - o shape correto (`exercicio`, `series`, `repeticoes`, `descanso`)
 * - E também aliases flat (`nome`, `reps`, `descanso`, etc.) no próprio objeto (via cast any).
 */
function strengthTemplate(): { grupamentos: string[]; exercicios: any[]; volumeTotal: number } {
  const base = [
    { ex: makeEx("EX-SQ", "Agachamento", "pernas"), series: 4, reps: "6–10", descanso: 120, rpe: "RPE 7–8" },
    { ex: makeEx("EX-BP", "Supino", "peito"), series: 4, reps: "6–10", descanso: 120, rpe: "RPE 7–8" },
    { ex: makeEx("EX-RW", "Remada", "costas"), series: 4, reps: "8–12", descanso: 90, rpe: "RPE 7–8" },
  ];

  const exercicios: any[] = base.map((b) => {
    const shaped: ExercicioTreino = {
      exercicio: b.ex,
      series: b.series,
      repeticoes: b.reps,
      descanso: b.descanso,
      observacoes: b.rpe,
    };
    // aliases legacy (PlanosAtivos)
    return {
      ...shaped,
      nome: b.ex.nome,
      reps: b.reps,
      descanso: b.descanso,
      rpe: b.rpe,
      observacoes: b.rpe,
    } as any;
  });

  const volumeTotal = base.reduce((acc, b) => acc + b.series, 0);
  const grupamentos = ["full body"];
  return { grupamentos, exercicios, volumeTotal };
}

function cardioPseudoExercise(sessionTitle: string): any[] {
  const ex = makeEx("EX-CARDIO", sessionTitle, "cardio");
  const shaped: ExercicioTreino = {
    exercicio: ex,
    series: 1,
    repeticoes: "—",
    descanso: 0,
    observacoes: "Sessão planejada pelo motor (Planner 2.0).",
  };
  return [
    {
      ...shaped,
      nome: sessionTitle,
      reps: "—",
      descanso: 0,
      observacoes: "Sessão planejada pelo motor (Planner 2.0).",
    } as any,
  ];
}

function sessionTitle(s: PlannedSession | null | undefined) {
  if (!s) return "Recuperação";
  return s.title || (s.modality === "running" ? "Corrida" : s.modality === "cycling" ? "Bike" : "Musculação");
}

function sessionModalidadeLabel(s: PlannedSession | null | undefined) {
  if (!s) return "cardio";
  if (s.modality === "strength") return "musculacao";
  if (s.modality === "running") return "corrida";
  if (s.modality === "cycling") return "ciclismo";
  return String(s.modality);
}

export function plannerWeekToTreinoPlan(args: {
  weekly: WeeklyPlanOutput;
  input: PlannerInput;
  daysSelectedPT: string[]; // ["Seg","Qua","Sex"...]
}): PlanejamentoTreino {
  const { weekly, input, daysSelectedPT } = args;

  const freq = clamp(Number(input.available_days) || 3, 1, 7);
  const diasSelecionados = (Array.isArray(daysSelectedPT) && daysSelectedPT.length ? daysSelectedPT : ["Seg","Qua","Sex"])
    .map((d) => String(d));

  const divisao: DivisaoTreinoConfig = {
    tipo: inferDivisaoTipo(freq),
    frequencia: freq,
    diasSelecionados,
    intensidade: inferIntensidade(input.goal),
  };

  const treinos: TreinoDia[] = diasSelecionados.map((pt) => {
    const dk = PT_TO_DAYKEY[pt] || "monday";
    const s = weekly[dk];
    const modLabel = sessionModalidadeLabel(s);
    const titulo = sessionTitle(s);

    if (s?.modality === "strength") {
      const t = strengthTemplate();
      return {
        dia: pt,
        // fields extras usados no UI (PlanosAtivos): modalidade + titulo
        ...( { modalidade: modLabel, titulo } as any ),
        grupamentos: t.grupamentos,
        exercicios: t.exercicios as any,
        volumeTotal: t.volumeTotal,
      } as any;
    }

    // cardio day (running/cycling/fallback)
    return {
      dia: pt,
      ...( { modalidade: modLabel, titulo } as any ),
      grupamentos: [modLabel],
      exercicios: cardioPseudoExercise(titulo) as any,
      volumeTotal: 1,
    } as any;
  });

  const plano: PlanejamentoTreino = {
    modalidade: ("misto" as any),
    divisao,
    divisaoSemanal: `${divisao.tipo} • ${freq}x/semana`,
    frequencia: freq,
    treinos,
    historicoCargas: [],
  };

  return plano;
}
