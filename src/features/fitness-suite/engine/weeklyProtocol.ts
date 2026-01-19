export type WorkoutModality =
  | "musculacao"
  | "funcional"
  | "hiit"
  | "corrida"
  | "crossfit"
  | "spinning";

export type ActivityLevel = "iniciante" | "intermediario" | "avancado";

export type WorkoutStructure = {
  type: "força" | "hipertrofia" | "técnico" | "metabólico" | "resistência";
  volume: number;
  intensidade: "baixa" | "moderada" | "alta";
  descanso: string;
  duracaoEstimada: string;
};

import { buildSessionPlan } from "./sessionPlanner";
import type { SessionWorkoutPlan } from "./sessionPlanner";

export type WeeklyWorkoutProtocol = {
  generatedAt: string;
  modalities: WorkoutModality[];
  levelByModality: Record<WorkoutModality, ActivityLevel>;
  sessions: {
    day: string;
    modality: WorkoutModality;
    modalityLevel: ActivityLevel;
    goal: string;
    structure: WorkoutStructure;
    plan?: SessionWorkoutPlan;
  }[];
};

const WEEK_DAYS = ["Segunda","Terça","Quarta","Quinta","Sexta","Sábado","Domingo"];

const baseByLevel = {
  iniciante: { volume: 4, intensidade: "baixa", descanso: "60–90s", duracao: "35–45min" },
  intermediario: { volume: 6, intensidade: "moderada", descanso: "60–90s", duracao: "45–60min" },
  avancado: { volume: 8, intensidade: "alta", descanso: "45–75s", duracao: "55–70min" },
} as const;

const goalByModality: Record<WorkoutModality, string> = {
  musculacao: "Hipertrofia e força com execução técnica",
  funcional: "Capacidade geral e coordenação",
  hiit: "Condicionamento metabólico",
  corrida: "Base aeróbia e eficiência",
  crossfit: "Técnica + capacidade metabólica",
  spinning: "Resistência e potência em bike",
};

const structureForSession = (
  modality: WorkoutModality,
  level: ActivityLevel,
  index: number
): WorkoutStructure => {
  const base = baseByLevel[level];
  const alt = index % 2 === 0;

  if (modality === "musculacao") {
    return {
      type: alt ? "força" : "hipertrofia",
      volume: base.volume + (alt ? 1 : 0),
      intensidade: alt ? "alta" : base.intensidade,
      descanso: alt ? "90–120s" : base.descanso,
      duracaoEstimada: base.duracao,
    };
  }

  if (modality === "funcional") {
    return {
      type: alt ? "técnico" : "metabólico",
      volume: base.volume,
      intensidade: alt ? base.intensidade : "alta",
      descanso: alt ? "45–75s" : "60–90s",
      duracaoEstimada: alt ? base.duracao : "30–45min",
    };
  }

  if (modality === "hiit") {
    return {
      type: "metabólico",
      volume: base.volume + 1,
      intensidade: level === "iniciante" ? "moderada" : "alta",
      descanso: alt ? "75–120s" : "45–75s",
      duracaoEstimada: "20–35min",
    };
  }

  if (modality === "crossfit") {
    return {
      type: alt ? "técnico" : "metabólico",
      volume: base.volume + (alt ? 0 : 1),
      intensidade: alt ? base.intensidade : "alta",
      descanso: alt ? "60–120s" : "45–90s",
      duracaoEstimada: alt ? "30–45min" : "25–40min",
    };
  }

  if (modality === "corrida") {
    return {
      type: "resistência",
      volume: base.volume,
      intensidade: alt ? base.intensidade : "alta",
      descanso: "—",
      duracaoEstimada: alt ? base.duracao : "25–40min",
    };
  }

  return {
    type: "resistência",
    volume: base.volume,
    intensidade: base.intensidade,
    descanso: "—",
    duracaoEstimada: base.duracao,
  };
};

export const buildWeeklyProtocol = (rawState: any): WeeklyWorkoutProtocol => {
  const days: string[] = rawState?.diasTreino ?? WEEK_DAYS.slice(0, 5);
  const modalities: WorkoutModality[] = rawState?.workoutModalities ?? ["musculacao"];
  const levelByModality = rawState?.workoutLevelByModality ?? {};

  return {
    generatedAt: new Date().toISOString(),
    modalities,
    levelByModality,
    sessions: days.map((day, idx) => {
      const modality = modalities[idx % modalities.length];
      const level = levelByModality[modality] ?? "iniciante";
      return {
        day,
        modality,
        modalityLevel: level,
        goal: goalByModality[modality],
        structure: structureForSession(modality, level, idx),
        plan: buildSessionPlan({ modality, modalityLevel: level, structure: structureForSession(modality, level, idx) }),
      };
    }),
  };
};
