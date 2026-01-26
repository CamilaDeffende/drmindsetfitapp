
// BLOCO 2 (Premium): motores por modalidade (NUNCA misturar)
type DayName = "seg"|"ter"|"qua"|"qui"|"sex"|"sab"|"dom";
type Modality = "musculacao"|"corrida"|"bike"|"funcional"|"crossfit";

const dayNames: DayName[] = ["seg","ter","qua","qui","sex","sab","dom"];

const normalizeModality = (m: any): Modality | null => {
  const v = String(m || "").toLowerCase();
  if (v.includes("mus")) return "musculacao";
  if (v.includes("corr")) return "corrida";
  if (v.includes("bike") || v.includes("spinning") || v.includes("indoor")) return "bike";
  if (v.includes("func")) return "funcional";
  if (v.includes("cross")) return "crossfit";
  return null;
};

const genMusculacao = (level: string, focus?: string) => ({
  title: "Musculação",
  modality: "musculacao",
  items: [
    { kind: "header", text: "Divisão inteligente • nível: " + level + (focus ? (" • foco: " + focus) : "") },
    { kind: "exercise", name: "Supino reto", sets: level==="avancado"?5:4, reps: level==="iniciante"?10:8, note: "Base de força/hipertrofia." },
    { kind: "exercise", name: "Remada curvada", sets: level==="avancado"?5:4, reps: 8, note: "Costas • postura neutra." },
    { kind: "exercise", name: "Agachamento", sets: level==="iniciante"?3:4, reps: level==="iniciante"?10:8, note: "Padrão dominante de joelho." },
  ],
});

const genCorrida = (level: string, goal?: string) => ({
  title: "Corrida",
  modality: "corrida",
  items: [
    { kind: "header", text: "Ritmo/pace • zona • objetivo: " + (goal || "condicionamento") },
    { kind: "block", name: "Aquecimento", value: "8–12 min Z1–Z2" },
    { kind: "block", name: "Parte principal", value: level==="avancado" ? "4×6 min Z3 (rec 2 min)" : (level==="iniciante" ? "20–30 min Z2 contínuo" : "3×5 min Z3 (rec 2 min)") },
    { kind: "block", name: "Desaquecimento", value: "6–10 min Z1–Z2" },
  ],
});

const genBike = (level: string) => ({
  title: "Bike Indoor",
  modality: "bike",
  items: [
    { kind: "header", text: "Tempo • cadência • percepção de esforço (RPE)" },
    { kind: "block", name: "Aquecimento", value: "8 min RPE 3–4 • 80–95 rpm" },
    { kind: "block", name: "Parte principal", value: level==="avancado" ? "5×4 min RPE 7–8 • 90–105 rpm (rec 2 min)" : "25–35 min RPE 5–6 • 85–100 rpm" },
    { kind: "block", name: "Desaquecimento", value: "6–8 min RPE 2–3" },
  ],
});

const genFuncional = (level: string) => ({
  title: "Funcional",
  modality: "funcional",
  items: [
    { kind: "header", text: "Circuito • rounds • intervalos" },
    { kind: "block", name: "Circuito", value: level==="iniciante" ? "3 rounds • 30s on/30s off" : (level==="avancado" ? "5 rounds • 40s on/20s off" : "4 rounds • 35s on/25s off") },
    { kind: "exercise", name: "Burpee modificado", sets: 0, reps: 0, note: "Técnica > velocidade." },
    { kind: "exercise", name: "Agachamento com peso corporal", sets: 0, reps: 0, note: "Controle do tronco." },
    { kind: "exercise", name: "Remada elástico", sets: 0, reps: 0, note: "Escápulas ativas." },
  ],
});

const genCrossfit = (level: string) => ({
  title: "CrossFit",
  modality: "crossfit",
  items: [
    { kind: "header", text: "WOD completo • cap • estímulo" },
    { kind: "block", name: "WOD", value: level==="avancado" ? "AMRAP 14: 10 thrusters + 10 pull-ups + 200m run" : "AMRAP 12: 8 thrusters (leve) + 8 ring rows + 150m run" },
    { kind: "block", name: "Cap", value: "12–14 min" },
    { kind: "block", name: "Estímulo", value: "Sustentável (não morrer no minuto 3)." },
  ],
});

const generateByModality = (mod: Modality, level: string, focus?: string, goal?: string) => {
  if (mod === "musculacao") return genMusculacao(level, focus);
  if (mod === "corrida") return genCorrida(level, goal);
  if (mod === "bike") return genBike(level);
  if (mod === "funcional") return genFuncional(level);
  return genCrossfit(level);
};

// ✅ CONTRATO ÚNICO (fonte da verdade)
import type {
  WeeklyWorkoutProtocol,
  WorkoutModality,
  ActivityLevel,
  WorkoutStructure,
} from "@/features/fitness-suite/contracts/weeklyWorkoutProtocol";

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
  bike_indoor: "Resistência e potência em bike",
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
      type: alt ? "forca" : "hipertrofia",
      volume: base.volume + (alt ? 1 : 0),
      intensidade: alt ? "alta" : base.intensidade,
      descanso: alt ? "90–120s" : base.descanso,
      duracaoEstimada: base.duracao,
    };
  }

  if (modality === "funcional") {
    return {
      type: alt ? "tecnico" : "metabolico",
      volume: base.volume,
      intensidade: alt ? base.intensidade : "alta",
      descanso: alt ? "45–75s" : "60–90s",
      duracaoEstimada: alt ? base.duracao : "30–45min",
    };
  }

  if (modality === "hiit") {
    return {
      type: "metabolico",
      volume: base.volume + 1,
      intensidade: level === "iniciante" ? "moderada" : "alta",
      descanso: alt ? "75–120s" : "45–75s",
      duracaoEstimada: "20–35min",
    };
  }

  if (modality === "crossfit") {
    return {
      type: alt ? "tecnico" : "metabolico",
      volume: base.volume + (alt ? 0 : 1),
      intensidade: alt ? base.intensidade : "alta",
      descanso: alt ? "60–120s" : "45–90s",
      duracaoEstimada: alt ? "30–45min" : "25–40min",
    };
  }

  if (modality === "corrida") {
    return {
      type: "resistencia",
      volume: base.volume,
      intensidade: alt ? base.intensidade : "alta",
      descanso: "—",
      duracaoEstimada: alt ? base.duracao : "25–40min",
    };
  }

  return {
    type: "resistencia",
    volume: base.volume,
    intensidade: base.intensidade,
    descanso: "—",
    duracaoEstimada: base.duracao,
  };
};

type WeeklyWorkoutProtocolEngine = WeeklyWorkoutProtocol & {
  sessions: (WeeklyWorkoutProtocol["sessions"][number] & { plan?: SessionWorkoutPlan })[];
  strategiesByModality?: Record<string, { strategy: string; rationale: string }>;
};

export const buildWeeklyProtocol = (rawState: any): WeeklyWorkoutProtocolEngine => {
  // MF_ENGINE_DAY_MAP_V1
  const __dayKeys: string[] = Array.isArray(rawState?.workoutDaysSelected) ? rawState.workoutDaysSelected : [];
  const days: string[] = __dayKeys.length
    ? __dayKeys.map((k: string) => {
        const map: any = { seg: "Segunda", ter: "Terça", qua: "Quarta", qui: "Quinta", sex: "Sexta", sab: "Sábado", dom: "Domingo" };
        return map[String(k)] || String(k);
      })
    : (rawState?.diasTreino ?? WEEK_DAYS.slice(0, 5));
  const __allowed: WorkoutModality[] = ["musculacao","funcional","corrida","bike_indoor","crossfit"];
// MF_ENGINE_ALLOWED_MODALITIES_V2
  const modalities: WorkoutModality[] = Array.isArray(rawState?.workoutModalities) && rawState.workoutModalities.length
    ? rawState.workoutModalities.map(String).filter((k: string) => (__allowed as any).includes(k))
    : ["musculacao"];
  const levelByModality = rawState?.workoutLevelByModality ?? {};
      // MF_WEEKLY_PROTOCOL_STRATEGIES_V1
      const __mfModalitiesFinal = (Array.isArray(modalities) ? modalities.map(String) : []) as string[];
      const __mfGoal = (typeof __mfGetGoal === "function")
        ? __mfGetGoal(rawState)
        : String((rawState as any)?.perfil?.objetivo ?? (rawState as any)?.goal ?? "geral");
      const __mfStrategiesByModality = (typeof __mfBuildModalityStrategies === "function")
        ? __mfBuildModalityStrategies(__mfModalitiesFinal, (levelByModality || {}), __mfGoal)
        : {};


  return {
    generatedAt: new Date().toISOString(),
      strategiesByModality: __mfStrategiesByModality,
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

export type { WeeklyWorkoutProtocol, WorkoutModality, ActivityLevel, WorkoutStructure } from "@/features/fitness-suite/contracts/weeklyWorkoutProtocol";

export function generateWeeklyProtocolPremium(state: any) {
  const modalities = Array.isArray(state?.treino?.modalidades) ? state.treino.modalidades
    : Array.isArray(state?.perfil?.modalidades) ? state.perfil.modalidades : [];
  const levelBy = (_m: any) => String((state?.treino?.nivel || state?.perfil?.nivelTreino || "iniciante")).toLowerCase();
  const goal = String(state?.perfil?.objetivo || state?.treino?.objetivo || "");
  const byDay: Record<string, any> = (state?.treino?.diasPorModalidade || state?.treino?.dias || null) as any;

  const week = dayNames.map((d) => {
    let mod: any = null;

    if (byDay && typeof byDay === "object") {
      if (byDay[d]) mod = byDay[d];
      if (!mod) {
        for (const k of Object.keys(byDay)) {
          const arr = (byDay as any)[k];
          if (Array.isArray(arr) && arr.includes(d)) { mod = k; break; }
        }
      }
    }
    if (!mod && modalities.length) mod = modalities[0];

    const nm = normalizeModality(mod) || "musculacao";
    const payload = generateByModality(nm, levelBy(nm), state?.treino?.foco, goal);

    return { day: d, modality: payload.modality, title: payload.title, items: payload.items };
  });

  return { week };
}
