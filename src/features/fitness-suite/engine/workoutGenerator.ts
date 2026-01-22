/* eslint-disable @typescript-eslint/no-explicit-any */
// AUTO-GENERATED HOTFIX — workoutGenerator.ts (limpo)
// Objetivo: gerar TreinoPlan determinístico (seed) com variações por modalidade/nível/intensidade/dias
// Mantém BUILD VERDE e evita blocos fora de escopo que quebram TS.

import type { ModalidadeTreino, IntensidadeTreino } from "@/features/fitness-suite/contracts/treino";


import { getOrCreateUserSeed, hashSeed } from "./workoutSeed";
type PlanByDay = Record<
  string,
  { modalidade?: string; intensidade?: string; intensity?: string; nivel?: string; level?: string }
>;

function stableHash(input: string): number {
  // hash simples determinístico
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(arr: readonly T[], h: number): T {
  if (!arr.length) throw new Error("pick: empty array");
  return arr[h % arr.length];
}

function normalizeMod(m?: string): ModalidadeTreino {
  const x = String(m ?? "").toLowerCase();
  if (x.includes("muscu")) return "musculacao" as any;
  if (x.includes("func")) return "funcional" as any;
  if (x.includes("corr")) return "corrida" as any;
  if (x.includes("bike") || x.includes("spinning") || x.includes("indoor")) return "bike_indoor" as any;
  if (x.includes("cross")) return "crossfit" as any;
  return "musculacao" as any;
}

function normalizeIntensity(i?: string): IntensidadeTreino {
  const x = String(i ?? "").toLowerCase();
  if (x.includes("alta") || x.includes("high")) return "alta" as any;
  if (x.includes("baixa") || x.includes("low")) return "baixa" as any;
  return "moderada" as any;
}

function inferNivel(state: any): "iniciante" | "intermediario" | "avancado" {
  const raw =
    state?.perfil?.nivelTreino ??
    state?.perfil?.nivel ??
    state?.perfil?.experience ??
    state?.avaliacao?.nivelTreino ??
    "iniciante";
  const x = String(raw).toLowerCase();
  if (x.includes("avan")) return "avancado";
  if (x.includes("inter")) return "intermediario";
  return "iniciante";
}

function inferGoal(state: any): "emagrecimento" | "hipertrofia" | "performance" | "longevidade" {
  const raw = state?.perfil?.objetivo ?? state?.perfil?.goal ?? "emagrecimento";
  const x = String(raw).toLowerCase();
  if (x.includes("hiper")) return "hipertrofia";
  if (x.includes("perf")) return "performance";
  if (x.includes("long")) return "longevidade";
  if (x.includes("estet")) return "emagrecimento";
  return "emagrecimento";
}

// Bibliotecas por modalidade (bem maior que o mínimo; seed cria variações combinatórias)
const LIB = {
  musculacao: {
    aquecimento: ["Mobilidade de ombro", "Mobilidade de quadril", "Ativação de core", "Bike leve 5min", "Corda leve 3-5min"],
    peito: ["Supino reto", "Supino inclinado", "Crucifixo", "Flexão", "Crossover"],
    costas: ["Puxada na barra", "Remada curvada", "Remada unilateral", "Pulldown", "Pullover"],
    pernas: ["Agachamento", "Leg press", "Passada", "Stiff", "Cadeira extensora", "Cadeira flexora"],
    ombro: ["Desenvolvimento", "Elevação lateral", "Elevação frontal", "Crucifixo invertido", "Arnold press"],
    bracos: ["Rosca direta", "Rosca alternada", "Tríceps testa", "Tríceps corda", "Mergulho"],
    core: ["Prancha", "Abdominal infra", "Dead bug", "Pallof press", "Russian twist"],
  },
  funcional: {
    circuitos: ["Circuito full body", "Circuito metabólico", "Circuito força+cardio", "Circuito core+glúteos", "Circuito potência"],
    moves: ["Burpee", "Kettlebell swing", "Agachamento goblet", "Puxada elástico", "Flexão", "Box step-up", "Farmer walk", "Lunge"],
    core: ["Prancha", "Hollow hold", "Mountain climber", "Dead bug", "Sit-up"],
  },
  corrida: {
    treinos: ["Base Z2", "Intervalado", "Fartlek", "Limiar", "Longão", "Subidas"],
    tecnica: ["Drills educativos", "Cadência", "Postura", "Respiração", "Aquecimento progressivo"],
  },
  bike_indoor: {
    treinos: ["Z2 contínuo", "HIIT 30/60", "Limiar 3x8", "Subidas 6x3", "Sprint 10x15/45", "Pirâmide"],
    tecnica: ["Cadência 80-95", "Posicionamento", "Respiração", "Controle de carga", "Técnica em pé/sentado"],
  },
  crossfit: {
    formatos: ["EMOM", "AMRAP", "For Time", "Chipper", "Técnica + força"],
    movimentos: ["Air squat", "Thruster", "Kettlebell swing", "Wall ball", "Box jump", "Pull-up (regressão)", "Push press", "Row (remo)"],
    core: ["Toes to bar (reg.)", "Sit-up", "Plank", "Hollow", "Russian twist"],
  },
} as const;

function prescription(mod: ModalidadeTreino, nivel: string, intensidade: IntensidadeTreino, goal: string, h: number) {
  // Ajustes de volume por nível/intensidade/objetivo (heurística segura e consistente)
  const baseSeries = nivel === "iniciante" ? 3 : nivel === "intermediario" ? 4 : 5;

  // objetivo: performance -> mais qualidade/técnica; hipertrofia -> volume moderado/alto; emagrecimento -> densidade; longevidade -> técnica/controle
  let reps = "8-12";
  let descansoSeg = 75;

  if (mod === ("corrida" as any)) {
    if (intensidade === ("alta" as any)) return { reps: "Intervalos 10x (1min forte / 1min leve)", descansoSeg: 0, notes: "RPE 8-9; aquecer 10min + desaquecimento" };
    if (intensidade === ("moderada" as any)) return { reps: "Limiar 3x 8min (forte) / 4min (leve)", descansoSeg: 0, notes: "RPE 7-8; foco em consistência" };
    return { reps: "Z2 30-50min", descansoSeg: 0, notes: "Confortável; dá pra conversar; progressão semanal leve" };
  }

  if (mod === ("bike_indoor" as any)) {
    if (intensidade === ("alta" as any)) return { reps: "HIIT 10x 30s forte / 60s leve", descansoSeg: 0, notes: "RPE 8-9; cadência controlada" };
    if (intensidade === ("moderada" as any)) return { reps: "Limiar 3x 8min / 4min leve", descansoSeg: 0, notes: "RPE 7-8; técnica e respiração" };
    return { reps: "Z2 30-60min", descansoSeg: 0, notes: "Cadência 80-95rpm; manter constância" };
  }

  if (mod === ("crossfit" as any)) {
    if (intensidade === ("alta" as any)) return { reps: "AMRAP 12-18min", descansoSeg: 0, notes: "Ritmo sustentável; evitar falha técnica" };
    if (intensidade === ("moderada" as any)) return { reps: "EMOM 12-16min", descansoSeg: 0, notes: "Consistência por minuto; técnica perfeita" };
    return { reps: "Técnica + força 20-30min", descansoSeg: 0, notes: "Controle, mobilidade, regressões" };
  }

  // musculação/funcional
  if (goal === "hipertrofia") { reps = intensidade === ("alta" as any) ? "6-10" : "8-12"; descansoSeg = intensidade === ("alta" as any) ? 120 : 90; }
  else if (goal === "performance") { reps = intensidade === ("alta" as any) ? "4-8" : "6-10"; descansoSeg = intensidade === ("alta" as any) ? 150 : 120; }
  else if (goal === "longevidade") { reps = "10-15"; descansoSeg = 60; }
  else { // emagrecimento/estética
    reps = intensidade === ("alta" as any) ? "8-12" : "10-15";
    descansoSeg = intensidade === ("alta" as any) ? 90 : 60;
  }

  // micro-variação (seed)
  const delta = (h % 3) - 1; // -1,0,1
  const series = Math.max(2, baseSeries + delta);

  return { series, reps, descansoSeg, notes: "" };
}

function buildExercises(mod: ModalidadeTreino, nivel: string, intensidade: IntensidadeTreino, goal: string, dayKey: string, seedKey: string) {
  const h = stableHash(seedKey + "|" + dayKey + "|" + mod + "|" + intensidade + "|" + goal + "|" + nivel);

  if (mod === ("musculacao" as any)) {
    const lib = LIB.musculacao;
    const split = [
      ["peito","ombro","bracos","core"],
      ["costas","bracos","core"],
      ["pernas","core"],
      ["peito","costas","core"],
      ["pernas","ombro","core"],
    ];
    const pickSplit = pick(split, h);
    const out: any[] = [];

    out.push({ nome: pick(lib.aquecimento, h+1), grupo: "Aquecimento" });

    for (const g of pickSplit) {
      const pool = (lib as any)[g] as string[];
      // 2 exercícios por grupamento (variação por seed)
      out.push({ nome: pick(pool, h + out.length * 7), grupo: g.toUpperCase() });
      out.push({ nome: pick(pool, h + out.length * 11), grupo: g.toUpperCase() });
    }
    return out;
  }

  if (mod === ("funcional" as any)) {
    const lib = LIB.funcional;
    const out: any[] = [];
    out.push({ nome: pick(lib.circuitos, h+1), grupo: "Circuito" });
    // 6 movimentos (variação)
    for (let i=0;i<6;i++) out.push({ nome: pick(lib.moves, h + i*13), grupo: "Movimento" });
    out.push({ nome: pick(lib.core, h+99), grupo: "Core" });
    return out;
  }

  if (mod === ("corrida" as any)) {
    const lib = LIB.corrida;
    return [
      { nome: pick(lib.tecnica, h+1), grupo: "Técnica" },
      { nome: pick(lib.treinos, h+7), grupo: "Sessão" },
    ];
  }

  if (mod === ("bike_indoor" as any)) {
    const lib = LIB.bike_indoor;
    return [
      { nome: pick(lib.tecnica, h+1), grupo: "Técnica" },
      { nome: pick(lib.treinos, h+7), grupo: "Sessão" },
    ];
  }

  // crossfit
  const lib = LIB.crossfit;
  return [
    { nome: pick(lib.formatos, h+1), grupo: "Formato" },
    { nome: pick(lib.movimentos, h+7), grupo: "Movimento" },
    { nome: pick(lib.movimentos, h+17), grupo: "Movimento" },
    { nome: pick(lib.core, h+99), grupo: "Core" },
  ];
}

export function generateWeeklyWorkout(params: {
  state: any;
  daysSelected: string[];
  planByDay: PlanByDay;
}): import("@/features/fitness-suite/contracts/treino").TreinoPlan {
  const { state, daysSelected, planByDay } = params;
  const nivel = inferNivel(state);
  const goal = inferGoal(state);

  const userSeed = getOrCreateUserSeed();
  const now = new Date();
  const weekKey = (() => {
    // ISO week key: YYYY-Www (UTC-safe)
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    const y = d.getUTCFullYear();
    return String(y) + "-W" + String(weekNo).padStart(2, "0");
  })();

  const profileKey = JSON.stringify({
    nome: state?.perfil?.nomeCompleto ?? "",
    idade: state?.perfil?.idade ?? "",
    altura: state?.perfil?.altura ?? "",
    peso: state?.perfil?.pesoAtual ?? state?.avaliacao?.peso ?? "",
    objetivo: state?.perfil?.objetivo ?? "",
    modalidade: state?.perfil?.modalidadePrincipal ?? "",
    nivel: nivel,
    goal: goal,
  });

  // Seed determinístico + persistente + rotativo por semana (evita repetição global)
  const baseSeed = hashSeed(String(userSeed) + "|" + weekKey + "|" + profileKey);
const treinos = (daysSelected ?? []).map((dayName, idx) => {
    const cfg = (planByDay ?? {})[dayName] ?? {};
    const mod = normalizeMod(cfg.modalidade ?? (state?.perfil?.modalidadePrincipal ?? "musculacao"));
    const intensidade = normalizeIntensity(cfg.intensidade ?? cfg.intensity ?? "moderada");

    const seedKey = String(baseSeed) + "|" + idx;
    const exs = buildExercises(mod, nivel, intensidade, goal, dayName, seedKey);
    const presc = prescription(mod, nivel, intensidade, goal, stableHash(seedKey + dayName));

    const exercicios = exs.map((e: any) => ({
      nome: e?.nome ?? "Exercício",
      grupo: e?.grupo ?? "",
      series: presc.series ?? 3,
      repeticoes: (presc as any).reps ?? "8-12",
      descansoSeg: presc.descansoSeg ?? 60,
      observacoes: (presc as any).notes ?? "",
    }));

    const grupamentos = Array.from(new Set(exercicios.map((x: any) => x.grupo).filter(Boolean)));

    return {
      dia: dayName,
      modalidade: mod,
      intensidade,
      grupamentos,
      exercicios,
      observacoesDia: "",
    } as any;
  });

  const divisaoSemanal = nivel === "iniciante"
    ? "Base + técnica"
    : nivel === "intermediario"
      ? "Progressão semanal"
      : "Performance / Intensificação";

  const plan = {
    createdAt: new Date().toISOString(),
    seed: String(baseSeed),
    nivel,
    objetivo: goal,
    divisaoSemanal,
    frequencia: treinos.length,
    treinos,
  };

  return plan as any;
}
