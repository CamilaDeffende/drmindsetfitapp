/* Motor determinístico do Protocolo Semanal
   - Mesmo input => mesmo output
   - Sem random
   - Nível sempre por modalidade (não existe nível geral)
*/
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
  volume: number; // 1–10 (escala interna)
  intensidade: "baixa" | "moderada" | "alta";
  descanso: string;
  duracaoEstimada: string;
};

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
  }[];
};

const WEEK_DAYS: string[] = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
];

const MODALITY_PRIORITY: WorkoutModality[] = [
  "musculacao",
  "corrida",
  "funcional",
  "spinning",
  "hiit",
  "crossfit",
];

const normalizeModality = (v: unknown): WorkoutModality | null => {
  const s = String(v ?? "").trim().toLowerCase();
  const map: Record<string, WorkoutModality> = {
    musculacao: "musculacao",
    "musculação": "musculacao",
    funcional: "funcional",
    hiit: "hiit",
    corrida: "corrida",
    crossfit: "crossfit",
    spinning: "spinning",
    bike: "spinning",
    "bike indoor": "spinning",
    "bikeindoor": "spinning",
    "spinning / bike indoor": "spinning",
  };
  return map[s] ?? null;
};

const normalizeLevel = (v: unknown): ActivityLevel => {
  const s = String(v ?? "").trim().toLowerCase();
  if (s.startsWith("ava")) return "avancado";
  if (s.startsWith("int")) return "intermediario";
  return "iniciante";
};

const pickDays = (rawState: any): string[] => {
  const candidates = [
    rawState?.perfil?.diasTreino,
    rawState?.diasTreino,
    rawState?.diasDisponiveis,
    rawState?.treinoDias,
    rawState?.perfil?.diasDisponiveis,
  ].find((x: any) => Array.isArray(x) && x.length > 0);

  if (Array.isArray(candidates)) {
    // normaliza nomes e mantém ordem determinística do input
    const normalized = candidates
      .map((d: any) => String(d ?? "").trim())
      .filter(Boolean);
    return normalized.length ? normalized : WEEK_DAYS.slice(0, 5);
  }
  // default seguro (5x/semana)
  return WEEK_DAYS.slice(0, 5);
};

const pickModalities = (rawState: any): WorkoutModality[] => {
  const arr =
    rawState?.workoutModalities ??
    rawState?.modalidadesTreino ??
    rawState?.perfil?.modalidadesTreino ??
    rawState?.perfil?.modalidades ??
    rawState?.treino?.modalidades ??
    rawState?.treinoConfig?.modalities ??
    [];

  const mods = (Array.isArray(arr) ? arr : [])
    .map(normalizeModality)
    .filter(Boolean) as WorkoutModality[];

  // ordem determinística por prioridade
  const uniq = Array.from(new Set(mods));
  uniq.sort((a, b) => MODALITY_PRIORITY.indexOf(a) - MODALITY_PRIORITY.indexOf(b));
  return uniq.length ? uniq : ["musculacao"];
};

const pickLevelByModality = (rawState: any, mods: WorkoutModality[]) => {
  const src =
    rawState?.levelByModality ??
    rawState?.perfil?.levelByModality ??
    rawState?.treinoNiveis ??
    rawState?.modalidadeNivelMap ??
    {};

  const out: Record<WorkoutModality, ActivityLevel> = {
    musculacao: "iniciante",
    funcional: "iniciante",
    hiit: "iniciante",
    corrida: "iniciante",
    crossfit: "iniciante",
    spinning: "iniciante",
  };

  for (const m of mods) {
    const v = (src && typeof src === "object") ? (src as any)[m] : undefined;
    out[m] = normalizeLevel(v);
  }
  return out;
};

const structureFor = (modality: WorkoutModality, level: ActivityLevel): WorkoutStructure => {
  // Determinístico e seguro (tuning fino entra no PASSO 3)
  const base = {
    iniciante: { volume: 4, intensidade: "baixa" as const, descanso: "60–90s", duracao: "35–45min" },
    intermediario: { volume: 6, intensidade: "moderada" as const, descanso: "60–90s", duracao: "45–60min" },
    avancado: { volume: 8, intensidade: "alta" as const, descanso: "45–75s", duracao: "55–70min" },
  }[level];

  if (modality === "hiit" || modality === "crossfit") {
    return {
      type: "metabólico",
      volume: Math.min(10, base.volume + (level === "avancado" ? 1 : 0)),
      intensidade: level === "iniciante" ? "moderada" : "alta",
      descanso: level === "iniciante" ? "60–120s" : "45–90s",
      duracaoEstimada: level === "iniciante" ? "25–35min" : "35–50min",
    };
  }

  if (modality === "corrida" || modality === "spinning") {
    return {
      type: "resistência",
      volume: base.volume,
      intensidade: base.intensidade,
      descanso: "— (intervalos guiados)",
      duracaoEstimada: level === "iniciante" ? "25–40min" : level === "intermediario" ? "35–55min" : "45–70min",
    };
  }

  if (modality === "funcional") {
    return {
      type: "técnico",
      volume: base.volume,
      intensidade: base.intensidade,
      descanso: "45–90s",
      duracaoEstimada: base.duracao,
    };
  }

  // musculacao
  return {
    type: level === "iniciante" ? "hipertrofia" : "força",
    volume: base.volume,
    intensidade: base.intensidade,
    descanso: base.descanso,
    duracaoEstimada: base.duracao,
  };
};

const goalFor = (modality: WorkoutModality, level: ActivityLevel): string => {
  const L = level === "iniciante" ? "base e técnica" : level === "intermediario" ? "progressão e consistência" : "performance e refinamento";
  const M: Record<WorkoutModality, string> = {
    musculacao: "Hipertrofia/força com execução controlada",
    funcional: "Capacidade geral e padrões de movimento",
    hiit: "Condicionamento e potência metabólica",
    corrida: "Base aeróbia e economia de corrida",
    crossfit: "Técnica + capacidade metabólica com segurança",
    spinning: "Resistência e potência em bike indoor",
  };
  return `${M[modality]} • foco: ${L}`;
};

export const distributeWeeklySessions = (days: string[], modalities: WorkoutModality[]) => {
  // Aloca counts de forma determinística e “justa”
  const total = Math.max(1, days.length);
  const mods = modalities.length ? modalities : (["musculacao"] as WorkoutModality[]);
  const counts = new Map<WorkoutModality, number>();

  const base = Math.floor(total / mods.length);
  let remainder = total % mods.length;

  for (const m of mods) {
    const add = remainder > 0 ? 1 : 0;
    counts.set(m, base + add);
    remainder = Math.max(0, remainder - 1);
  }

  // Sequência determinística evitando repetição burra
  const ordered: WorkoutModality[] = [];
  let prev: WorkoutModality | null = null;

  for (let i = 0; i < total; i++) {
    const candidates = Array.from(counts.entries())
      .filter(([, c]) => c > 0)
      .map(([m]) => m)
      .sort((a, b) => MODALITY_PRIORITY.indexOf(a) - MODALITY_PRIORITY.indexOf(b));

    let pick = candidates.find((m) => m !== prev) ?? candidates[0] ?? mods[0];

    // micro-regra: evitar HIIT/Crossfit colados quando houver alternativa
    if ((pick === "hiit" || pick === "crossfit") && candidates.some((m) => m !== pick && m !== prev)) {
      const alt = candidates.find((m) => m !== pick && m !== prev);
      if (alt) pick = alt;
    }

    ordered.push(pick);
    counts.set(pick, (counts.get(pick) ?? 1) - 1);
    prev = pick;
  }

  return days.map((d, idx) => ({ day: d, modality: ordered[idx] ?? mods[0] }));
};

export const buildWeeklyProtocol = (rawState: any): WeeklyWorkoutProtocol => {
  const days = pickDays(rawState);
  const modalities = pickModalities(rawState);
  const levelByModality = pickLevelByModality(rawState, modalities);

  const dist = distributeWeeklySessions(days, modalities);

  return {
    generatedAt: new Date().toISOString(),
    modalities,
    levelByModality,
    sessions: dist.map(({ day, modality }) => {
      const modalityLevel = levelByModality[modality] ?? "iniciante";
      return {
        day,
        modality,
        modalityLevel,
        goal: goalFor(modality, modalityLevel),
        structure: structureFor(modality, modalityLevel),
      };
    }),
  };
};
