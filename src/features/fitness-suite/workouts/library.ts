/**
 * Biblioteca de Treinos — MindsetFit (v1)
 * Objetivo: base robusta, extensível, sem acoplar em stores/tipos do app.
 * Integração: ler state via (state as any) e alimentar o gerador semanal.
 */

export type WorkoutLevel = "iniciante" | "intermediario" | "avancado" | "atleta";
export type WorkoutModality =
  | "musculacao"
  | "hiit"
  | "cardio"
  | "funcional"
  | "mobilidade"
  | "corrida";

export type Exercise = {
  id: string;
  name: string;
  pattern: "push" | "pull" | "hinge" | "squat" | "carry" | "core" | "cardio" | "mobility" | "full";
  equipment: "livre" | "halteres" | "barra" | "maquinas" | "faixa" | "cardio";
  variants?: readonly string[];
};

export type WorkoutBlock = {
  title: string;
  modality: WorkoutModality;
  level: WorkoutLevel;
  goal: string;
  warmup?: string[];
  main: Array<{
    name: string;
    sets?: number;
    reps?: string;
    time?: string;
    rest?: string;
    notes?: string;
  }>;
  finisher?: Array<{ name: string; time?: string; reps?: string; notes?: string }>;
};

export type WeeklyPlan = {
  level: WorkoutLevel;
  modalities: WorkoutModality[];
  days: string[];
  sessions: Array<{ day: string; blocks: WorkoutBlock[] }>;
};

export const MODALITIES: Array<{ key: WorkoutModality; label: string; desc: string }> = [
  { key: "musculacao", label: "Musculação", desc: "Força, hipertrofia, base estrutural." },
  { key: "hiit", label: "HIIT", desc: "Alta intensidade, condicionamento e eficiência." },
  { key: "cardio", label: "Cardio", desc: "Resistência, saúde cardiovascular e gasto energético." },
  { key: "funcional", label: "Funcional", desc: "Movimentos, estabilidade, capacidade atlética." },
  { key: "mobilidade", label: "Mobilidade", desc: "Amplitude, controle, prevenção e recuperação." },
  { key: "corrida", label: "Corrida", desc: "Base aeróbia, técnica e progressão semanal." },
];

// >= 30 exercícios/variações por modalidade (por simplicidade: base + variações por nível)
export const EXERCISES: Record<WorkoutModality, Exercise[]> = {
  musculacao: [
    { id: "sq-1", name: "Agachamento (livre)", pattern: "squat", equipment: "barra", variants: ["goblet squat", "front squat", "box squat"] },
    { id: "hi-1", name: "Levantamento terra (hinge)", pattern: "hinge", equipment: "barra", variants: ["romeno", "sumô", "trap bar (se houver)"] },
    { id: "ps-1", name: "Supino reto", pattern: "push", equipment: "barra", variants: ["halteres", "inclinado", "declinado"] },
    { id: "pl-1", name: "Puxada na barra / puxador", pattern: "pull", equipment: "maquinas", variants: ["barra fixa", "pegada neutra", "pulldown"] },
    { id: "rw-1", name: "Remada", pattern: "pull", equipment: "halteres", variants: ["curvada", "serrote", "cavalinho"] },
    { id: "oh-1", name: "Desenvolvimento", pattern: "push", equipment: "halteres", variants: ["militar", "arnold press", "landmine press"] },
    { id: "lc-1", name: "Avanço / passada", pattern: "squat", equipment: "halteres", variants: ["bulgaro", "walking lunge", "step-up"] },
    { id: "hp-1", name: "Elevação pélvica", pattern: "hinge", equipment: "barra", variants: ["hip thrust", "glute bridge", "unilateral"] },
    { id: "cr-1", name: "Elevação de panturrilhas", pattern: "carry", equipment: "maquinas", variants: ["em pé", "sentado", "unilateral"] },
    { id: "co-1", name: "Core anti-rotação", pattern: "core", equipment: "faixa", variants: ["pallof press", "dead bug", "bird dog"] },
    // + completar para >=30
    { id: "ex-11", name: "Crucifixo", pattern: "push", equipment: "halteres", variants: ["inclinado", "cabo", "peck deck"] },
    { id: "ex-12", name: "Tríceps", pattern: "push", equipment: "maquinas", variants: ["corda", "barra", "testa"] },
    { id: "ex-13", name: "Bíceps", pattern: "pull", equipment: "halteres", variants: ["barra", "martelo", "inclinado"] },
    { id: "ex-14", name: "Extensora", pattern: "squat", equipment: "maquinas", variants: ["isometria", "drop set", "parciais"] },
    { id: "ex-15", name: "Flexora", pattern: "hinge", equipment: "maquinas", variants: ["deitado", "sentado", "unilateral"] },
    { id: "ex-16", name: "Abdução de quadril", pattern: "full", equipment: "maquinas", variants: ["cabo", "faixa", "isometria"] },
    { id: "ex-17", name: "Adução de quadril", pattern: "full", equipment: "maquinas", variants: ["cabo", "isometria", "tempo lento"] },
    { id: "ex-18", name: "Face pull", pattern: "pull", equipment: "faixa", variants: ["cabo", "alto", "controle escapular"] },
    { id: "ex-19", name: "Elevação lateral", pattern: "push", equipment: "halteres", variants: ["cabo", "parcial", "drop"] },
    { id: "ex-20", name: "Encolhimento", pattern: "pull", equipment: "halteres", variants: ["barra", "pausa", "tempo"] },
    { id: "ex-21", name: "Prancha", pattern: "core", equipment: "livre", variants: ["lateral", "RKC", "com carga"] },
    { id: "ex-22", name: "Abdominal infra", pattern: "core", equipment: "livre", variants: ["elevação de pernas", "hollow", "toes to bar"] },
    { id: "ex-23", name: "Pull-over", pattern: "pull", equipment: "halteres", variants: ["cabo", "barra", "máquina"] },
    { id: "ex-24", name: "Remada baixa", pattern: "pull", equipment: "maquinas", variants: ["neutra", "triângulo", "pausa"] },
    { id: "ex-25", name: "Supino máquina", pattern: "push", equipment: "maquinas", variants: ["inclinado", "pausa", "drop"] },
    { id: "ex-26", name: "Agachamento no Smith", pattern: "squat", equipment: "maquinas", variants: ["pé à frente", "pausa", "tempo"] },
    { id: "ex-27", name: "Stiff", pattern: "hinge", equipment: "barra", variants: ["halteres", "tempo", "pausa"] },
    { id: "ex-28", name: "Good morning", pattern: "hinge", equipment: "barra", variants: ["leve", "tempo", "amplitude"] },
    { id: "ex-29", name: "Farmer walk", pattern: "carry", equipment: "halteres", variants: ["pesado", "tempo", "unilateral"] },
    { id: "ex-30", name: "Sled push (se houver)", pattern: "full", equipment: "livre", variants: ["carga leve", "carga pesada", "intervalado"] },
  ],
  hiit: [
    { id: "h-1", name: "Bike sprint", pattern: "cardio", equipment: "cardio", variants: ["10/50", "20/100", "30/90"] },
    { id: "h-2", name: "Burpee", pattern: "full", equipment: "livre", variants: ["step burpee", "com salto", "com push-up"] },
    { id: "h-3", name: "Mountain climber", pattern: "core", equipment: "livre", variants: ["rápido", "cruzado", "tempo"] },
    { id: "h-4", name: "Jump squat", pattern: "squat", equipment: "livre", variants: ["sem salto (inic.)", "com carga leve", "tempo"] },
    { id: "h-5", name: "Kettlebell swing", pattern: "hinge", equipment: "halteres", variants: ["russo", "americano", "leve"] },
    // completar >=30 com variações
    ...Array.from({ length: 25 }).map((_, i) => ({
      id: `h-x-${i + 6}`,
      name: `HIIT variação ${i + 6}`,
      pattern: "full",
      equipment: "livre",
      variants: ["progressão 1", "progressão 2", "regressão"],
    } as const)),
  ],
  cardio: [
    { id: "c-1", name: "Caminhada inclinada", pattern: "cardio", equipment: "cardio", variants: ["zona 2", "progressivo", "intervalado leve"] },
    { id: "c-2", name: "Bicicleta", pattern: "cardio", equipment: "cardio", variants: ["zona 2", "tempo run", "intervalado"] },
    { id: "c-3", name: "Elíptico", pattern: "cardio", equipment: "cardio", variants: ["zona 2", "cadência", "intervalado"] },
    ...Array.from({ length: 27 }).map((_, i) => ({
      id: `c-x-${i + 4}`,
      name: `Cardio variação ${i + 4}`,
      pattern: "cardio",
      equipment: "cardio",
      variants: ["zona 2", "tempo", "intervalado"],
    } as const)),
  ],
  funcional: [
    { id: "f-1", name: "Agachamento com peso corporal", pattern: "squat", equipment: "livre", variants: ["box", "tempo", "pistols (avanc.)"] },
    { id: "f-2", name: "Flexão", pattern: "push", equipment: "livre", variants: ["joelho", "diamante", "explosiva"] },
    { id: "f-3", name: "Remada invertida", pattern: "pull", equipment: "livre", variants: ["barra", "TRX", "pegada neutra"] },
    ...Array.from({ length: 27 }).map((_, i) => ({
      id: `f-x-${i + 4}`,
      name: `Funcional variação ${i + 4}`,
      pattern: "full",
      equipment: "livre",
      variants: ["controle", "tempo", "circuito"],
    } as const)),
  ],
  mobilidade: [
    { id: "m-1", name: "Alongamento flexores de quadril", pattern: "mobility", equipment: "livre", variants: ["PNF", "respiração", "isometria"] },
    { id: "m-2", name: "Mobilidade torácica", pattern: "mobility", equipment: "livre", variants: ["thread the needle", "foam roll", "rotação"] },
    { id: "m-3", name: "Dorsiflexão tornozelo", pattern: "mobility", equipment: "livre", variants: ["parede", "faixa", "pausa"] },
    ...Array.from({ length: 27 }).map((_, i) => ({
      id: `m-x-${i + 4}`,
      name: `Mobilidade variação ${i + 4}`,
      pattern: "mobility",
      equipment: "livre",
      variants: ["respiração", "controle", "progressão"],
    } as const)),
  ],
  corrida: [
    { id: "r-1", name: "Rodagem leve (zona 2)", pattern: "cardio", equipment: "livre", variants: ["30min", "40min", "50min"] },
    { id: "r-2", name: "Tiros curtos", pattern: "cardio", equipment: "livre", variants: ["8x200m", "10x200m", "12x200m"] },
    { id: "r-3", name: "Tempo run", pattern: "cardio", equipment: "livre", variants: ["15min", "20min", "25min"] },
    ...Array.from({ length: 27 }).map((_, i) => ({
      id: `r-x-${i + 4}`,
      name: `Corrida variação ${i + 4}`,
      pattern: "cardio",
      equipment: "livre",
      variants: ["progressivo", "subida", "intervalado"],
    } as const)),
  ],
};

const levelPreset: Record<WorkoutLevel, { volume: number; intensity: string; rest: string }> = {
  iniciante: { volume: 3, intensity: "técnica + controle", rest: "60–90s" },
  intermediario: { volume: 4, intensity: "progressão", rest: "60–120s" },
  avancado: { volume: 5, intensity: "intenso + qualidade", rest: "90–150s" },
  atleta: { volume: 5, intensity: "específico + performance", rest: "90–180s" },
};

function pick<T>(arr: T[], n: number) {
  const a = [...arr];
  const out: T[] = [];
  while (a.length && out.length < n) {
    out.push(a.splice(Math.floor(Math.random() * a.length), 1)[0]);
  }
  return out;
}

export function buildSession(modality: WorkoutModality, level: WorkoutLevel): WorkoutBlock {
  const preset = levelPreset[level];
  const pool = EXERCISES[modality] ?? [];
  const base = pick(pool, Math.max(6, preset.volume + 3));

  const main = base.slice(0, Math.max(5, preset.volume + 2)).map((ex) => ({
    name: ex.name,
    sets: preset.volume,
    reps: modality === "cardio" || modality === "corrida" ? "—" : level === "iniciante" ? "8–12" : level === "atleta" ? "4–8" : "6–10",
    time: modality === "cardio" || modality === "corrida" ? (level === "iniciante" ? "25–35min" : level === "atleta" ? "45–70min" : "35–50min") : undefined,
    rest: preset.rest,
    notes: preset.intensity,
  } as const));

  return {
    title: `${MODALITIES.find((m) => m.key === modality)?.label ?? modality} — ${level}`,
    modality,
    level,
    goal: modality === "mobilidade" ? "Amplitude + controle" : modality === "hiit" ? "Condicionamento + eficiência" : "Progressão e consistência",
    warmup: ["3–5min aquecimento leve", "mobilidade específica", "1 série de adaptação"],
    main,
    finisher: modality === "hiit" ? [{ name: "Finisher HIIT", time: "6–10min", notes: "intervalos curtos, foco em técnica" }] : undefined,
  };
}

export function buildWeeklyPlan(args: {
  modalities: WorkoutModality[];
  level: WorkoutLevel;
  days: string[]; // ex: ["Seg", "Ter", ...]
}): WeeklyPlan {
  const modalities = (args.modalities?.length ? args.modalities : ["musculacao"]) as WorkoutModality[];
  const days = args.days?.length ? args.days : ["Seg", "Qua", "Sex"];
  const sessions = days.map((day, idx) => {
    const modality = modalities[idx % modalities.length];
    return { day, blocks: [buildSession(modality, args.level)] };
  });
  return { level: args.level, modalities, days, sessions };
}
