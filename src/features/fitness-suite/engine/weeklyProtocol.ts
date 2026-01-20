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


// MF_WEEKLY_PROTOCOL_ENGINE_V2
const __mfDayOrder = ["seg","ter","qua","qui","sex","sab","dom"] as const;
const __mfDayLabel: Record<(typeof __mfDayOrder)[number], string> = {
  seg: "Segunda", ter: "Terça", qua: "Quarta", qui: "Quinta", sex: "Sexta", sab: "Sábado", dom: "Domingo",
};

const __mfLabelByModality: Record<string, string> = {
  musculacao: "Musculação",
  funcional: "Funcional",
  corrida: "Corrida",
  bike_indoor: "Bike Indoor",
  crossfit: "CrossFit",
};

function __mfGetGoal(rawState: any): string {
  const p = rawState?.perfil ?? {};
  return String(p?.objetivo ?? p?.goal ?? rawState?.objetivo ?? "geral");
}

function __mfStrategyFor(modality: string, level: string, _goal: string) {
  const lvl = String(level || "iniciante");

  // Estratégias determinísticas (base conceitual: periodização, progressão, distribuição de estímulos, controle de intensidade)
  if (modality === "musculacao") {
    if (lvl === "iniciante") return {
      strategy: "Full Body progressivo (base técnica)",
      rationale: "Para iniciantes, maior frequência por grupamento e prática técnica aceleram aprendizado motor e progressão com carga segura. Distribuição semanal garante estímulo completo sem lacunas.",
    };
    if (lvl === "intermediario") return {
      strategy: "Upper/Lower (frequência 2x) ou Full Body ondulado",
      rationale: "Intermediários se beneficiam de maior especificidade e controle de volume por sessão, mantendo frequência suficiente para hipertrofia e força, com recuperação organizada na semana.",
    };
    return {
      strategy: "PPL/Upper-Lower avançado (ênfase + variação de estímulos)",
      rationale: "Avançados precisam de maior especialização e variação de estímulos (força/hipertrofia), com distribuição de volume e intensidade para maximizar performance e reduzir overuse.",
    };
  }

  if (modality === "corrida") {
    if (lvl === "iniciante") return {
      strategy: "Base aeróbia + técnica (progressão conservadora)",
      rationale: "Iniciantes priorizam consistência, economia de corrida e aumento gradual de volume. Intensidades moderadas reduzem risco e constroem capacidade aeróbia.",
    };
    if (lvl === "intermediario") return {
      strategy: "Ritmo/limiar + intervalos (estrutura semanal)",
      rationale: "Intermediários evoluem com sessões de limiar e intervalos bem distribuídas, mantendo base aeróbia e recuperações adequadas para progressão sustentável.",
    };
    return {
      strategy: "Polarizado 80/20 + VO₂/limiar (controle de carga)",
      rationale: "Avançados respondem bem à combinação de alto volume em baixa intensidade com doses estratégicas de intensidade (VO₂/limiar), otimizando performance e recuperação.",
    };
  }

  if (modality === "bike_indoor") {
    if (lvl === "iniciante") return {
      strategy: "Z2/Z3 controlado + técnica (cadência e consistência)",
      rationale: "Construção de base cardiorrespiratória com progressão de volume e familiarização com zonas de intensidade, minimizando fadiga excessiva.",
    };
    if (lvl === "intermediario") return {
      strategy: "Intervalos estruturados + base (limiar)",
      rationale: "Sessões intervaladas bem dosadas elevam capacidade de trabalho, enquanto a base mantém tolerância ao volume e melhora eficiência metabólica.",
    };
    return {
      strategy: "Blocos de potência/limiar + recuperação ativa",
      rationale: "Avançados se beneficiam de estímulos específicos (limiar/potência) com recuperação ativa planejada para sustentar intensidade sem queda de performance.",
    };
  }

  if (modality === "funcional") {
    if (lvl === "iniciante") return {
      strategy: "Padrões básicos + estabilidade (progressões simples)",
      rationale: "Prioriza padrões fundamentais, controle corporal e estabilidade. Progressões simples melhoram coordenação e reduzem risco, preparando para estímulos mais densos.",
    };
    if (lvl === "intermediario") return {
      strategy: "Força-resistência + potência moderada (ciclos)",
      rationale: "Intermediários avançam com maior densidade e progressão de complexidade, alternando estímulos para capacidade atlética e condicionamento sem sobrecarga crônica.",
    };
    return {
      strategy: "Complexidade + potência + densidade (controle de fadiga)",
      rationale: "Avançados toleram maior densidade e complexidade. O motor alterna estímulos para maximizar capacidade atlética preservando recuperação e qualidade técnica.",
    };
  }

  if (modality === "crossfit") {
    if (lvl === "iniciante") return {
      strategy: "Técnica + MetCon leve (baixa complexidade)",
      rationale: "Iniciantes precisam reduzir complexidade, priorizar técnica e cargas moderadas. MetCons controlados constroem condicionamento com segurança.",
    };
    if (lvl === "intermediario") return {
      strategy: "MetCon estruturado + força base (equilíbrio)",
      rationale: "Intermediários evoluem com MetCons estruturados, força base e recuperação planejada. Alternância energética reduz repetição burra e melhora desempenho.",
    };
    return {
      strategy: "Alta intensidade periodizada + variação energética",
      rationale: "Avançados exigem periodização de intensidade e variação energética. O motor controla densidade e descanso implícito para maximizar performance sem colapsar recuperação.",
    };
  }

  return {
    strategy: "Estratégia estruturada",
    rationale: "Estratégia definida de forma determinística com base em nível, objetivo e dias disponíveis.",
  };
}

function __mfBuildModalityStrategies(modalities: string[], levelByModality: Record<string, any>, goal: string) {
  const out: Record<string, { strategy: string; rationale: string }> = {};
  for (const m of modalities) {
    const lvl = String(levelByModality?.[m] ?? "iniciante");
    out[m] = __mfStrategyFor(m, lvl, goal);
  }
  return out;
}

// MF_WEEKLY_PROTOCOL_ENGINE_V2_USED
void __mfDayLabel;
void __mfLabelByModality;
void __mfGetGoal;
void __mfBuildModalityStrategies;

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
  // MF_ENGINE_DAY_MAP_V1
  const __dayKeys: string[] = Array.isArray(rawState?.workoutDaysSelected) ? rawState.workoutDaysSelected : [];
  const days: string[] = __dayKeys.length
    ? __dayKeys.map((k: string) => {
        const map: any = { seg: "Segunda", ter: "Terça", qua: "Quarta", qui: "Quinta", sex: "Sexta", sab: "Sábado", dom: "Domingo" };
        return map[String(k)] || String(k);
      })
    : (rawState?.diasTreino ?? WEEK_DAYS.slice(0, 5));
  const __allowed: WorkoutModality[] = ["musculacao","funcional","corrida","spinning","crossfit"];
// MF_ENGINE_ALLOWED_MODALITIES_V2
  const modalities: WorkoutModality[] = Array.isArray(rawState?.workoutModalities) && rawState.workoutModalities.length
    ? rawState.workoutModalities.map(String).filter((k: string) => (__allowed as any).includes(k))
    : ["musculacao"];
  const levelByModality = rawState?.workoutLevelByModality ?? {};

  return {
    generatedAt: new Date().toISOString(),
    modalities,
    levelByModality,
    sessions: days.map((day, idx) => {
      const __plan = (rawState?.workoutPlanByDay && typeof rawState.workoutPlanByDay === "object") ? rawState.workoutPlanByDay : {};
      const __dayKey = Array.isArray(rawState?.workoutDaysSelected) ? String(rawState.workoutDaysSelected[idx] ?? "") : "";
      const __mapped = __dayKey && __plan ? String(__plan[__dayKey] ?? "") : "";
      const __mod = ((__mapped && (modalities as any).includes(__mapped)) ? (__mapped as any) : modalities[idx % modalities.length]) as any;
      const modality: WorkoutModality = (__allowed as any).includes(__mod) ? (__mod as WorkoutModality) : (__allowed[0] as WorkoutModality);
      const level = levelByModality[modality] ?? "iniciante";
      return {
        day,
        modality,
        modalityLevel: level,
        goal: goalByModality[modality as WorkoutModality],
        structure: structureForSession(modality, level, idx),
        plan: buildSessionPlan({ modality, modalityLevel: level, structure: structureForSession(modality, level, idx) }),
      };
    }),
  };
};
