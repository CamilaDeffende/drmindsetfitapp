import type { ActivityLevel, IntensityKey, ModalityKey, WorkoutPlan, DayWorkout, SessionExercise } from "./workoutLibrary";
import { LIB, normalizeModality } from "./workoutLibrary";
import { hashSeed, mulberry32, pickManyUnique, pickOne } from "./workoutSeed";

type PlanByDay = Record<string, unknown>;

function inferIntensityFromState(state: any): IntensityKey {
  const raw = String(state?.perfil?.intensidade ?? state?.treino?.intensidade ?? "").toLowerCase();
  if (raw.includes("alta") || raw.includes("intens")) return "alta";
  if (raw.includes("moder")) return "moderada";
  if (raw.includes("leve")) return "leve";
  // fallback pelo nível
  const lvl = String(state?.metabolismo?.nivelAtividade ?? state?.perfil?.nivelTreino ?? "iniciante").toLowerCase();
  if (lvl.includes("avan")) return "alta";
  if (lvl.includes("inter")) return "moderada";
  return "leve";
}

function inferLevel(state: any): ActivityLevel {
  const lvl = String(state?.metabolismo?.nivelAtividade ?? state?.perfil?.nivelTreino ?? "iniciante").toLowerCase();
  if (lvl.includes("avan")) return "avancado";
  if (lvl.includes("inter")) return "intermediario";
  return "iniciante";
}

function dayTitle(mod: ModalityKey, intensity: IntensityKey) {
  const map: Record<ModalityKey, string> = {
    musculacao: "Força & Hipertrofia",
    funcional: "Funcional & Condicionamento",
    corrida: "Corrida Estruturada",
    bike_indoor: "Bike Indoor",
    crossfit: "Cross Training (WOD)",
  };
  const i = intensity === "alta" ? "Alta" : intensity === "moderada" ? "Moderada" : "Leve";
  return `${map[mod]} • Intensidade ${i}`;
}

function prescription(mod: ModalityKey, level: ActivityLevel, intensity: IntensityKey, exName: string): Partial<SessionExercise> {
  // MVP: prescrição segura + coerente. Depois refinamos periodização e blocos por objetivo.
  if (mod === "corrida") {
    if (exName.includes("Interval")) return { reps: "8x 1min forte / 1min leve", observacoes: "Aqueça 10min + desaquecimento 8–10min" };
    if (exName.includes("Tempo")) return { reps: "20–30min ritmo constante", observacoes: "RPE 7–8, controlado" };
    if (exName.includes("Long")) return { reps: "40–75min", observacoes: "Z2 predominante, progressivo no final" };
    if (exName.includes("Subidas")) return { reps: "10x 30–45s subida / retorno leve", observacoes: "Foco em técnica e postura" };
    return { reps: "25–45min Z2", observacoes: "Cadência confortável, conversa possível" };
  }

  if (mod === "bike_indoor") {
    if (exName.includes("HIIT")) return { reps: "10x 30s forte / 60s leve", observacoes: "RPE 8–9 nos sprints" };
    if (exName.includes("Limiar")) return { reps: "3x 8min forte / 4min leve", observacoes: "RPE 7–8" };
    if (exName.includes("Subida")) return { reps: "6x 3min subida / 2min leve", observacoes: "Resistência alta, técnica" };
    return { reps: "30–60min Z2", observacoes: "Cadência estável (80–95rpm)" };
  }

  if (mod === "crossfit") {
    if (exName.includes("EMOM")) return { reps: "EMOM 12–16min", observacoes: "Manter consistência por minuto" };
    if (exName.includes("AMRAP")) return { reps: "AMRAP 12–18min", observacoes: "Ritmo sustentável" };
    if (exName.includes("For Time")) return { reps: "For Time (cap 12–18min)", observacoes: "Pacing inteligente" };
    if (exName.includes("Técnica")) return { reps: "Técnica + força (5x3)", observacoes: "Execução perfeita" };
    return { reps: "Progressões 10–15min", observacoes: "Controle e qualidade" };
  }

  // musculação/funcional
  const baseSeries = level === "iniciante" ? 3 : level === "intermediario" ? 4 : 5;
  const reps =
    intensity === "alta" ? "6–10" :
    intensity === "moderada" ? "8–12" :
    "10–15";
  const descanso =
    intensity === "alta" ? "90–120s" :
    intensity === "moderada" ? "60–90s" :
    "45–75s";

  return {
    series: baseSeries,
    reps,
    descanso,
    rpe: intensity === "alta" ? "RPE 8" : intensity === "moderada" ? "RPE 7" : "RPE 6–7",
  };
}

function groupFromExercises(exs: SessionExercise[]): string[] {
  const set = new Set<string>();
  exs.forEach(e => {
    if (e.grupamento) set.add(e.grupamento);
    else if (e.tags?.includes("core")) set.add("Core");
    else if (e.tags?.includes("conditioning")) set.add("Condicionamento");
  });
  return Array.from(set);
}

export function generateWeeklyWorkout(params: {
  state: any;
  daysSelected: string[];
  planByDay: PlanByDay;
}): WorkoutPlan {
  const level = inferLevel(params.state);
  const intensity = inferIntensityFromState(params.state);

  const seedBase = JSON.stringify({
    nome: params.state?.perfil?.nomeCompleto ?? "",
    idade: params.state?.perfil?.idade ?? "",
    sexo: params.state?.perfil?.sexo ?? "",
    objetivo: params.state?.perfil?.objetivo ?? "",
    nivel: level,
    intensity,
    days: params.daysSelected,
    plan: params.planByDay,
    v: 1,
    t: Date.now(), // garante variação a cada "Gerar Treino"
  });

  const rand = mulberry32(hashSeed(seedBase));

  const treinos: DayWorkout[] = (params.daysSelected ?? []).map((dayKey) => {
    const modRaw = params.planByDay?.[dayKey];
    const mod = normalizeModality(modRaw) ?? "musculacao";

    // tamanho do treino por modalidade/nivel/intensidade
    const n =
      mod === "corrida" || mod === "bike_indoor" ? 1 :
      mod === "crossfit" ? 2 :
      mod === "funcional" ? (level === "iniciante" ? 6 : 8) :
      (level === "iniciante" ? 6 : level === "intermediario" ? 8 : 10);

    const pool = LIB[mod] ?? [];
    const picked = mod === "corrida" || mod === "bike_indoor"
      ? [pickOne(pool, rand)]
      : pickManyUnique(pool, n, rand);

    const exercicios: SessionExercise[] = picked.map((ex) => ({
      ...ex,
      ...prescription(mod, level, intensity, ex.nome),
    }));

    return {
      dia: String(dayKey),
      modalidade: mod,
      titulo: dayTitle(mod, intensity),
      grupamentos: groupFromExercises(exercicios),
      exercicios,
    };
  });

  const divisaoSemanal =
    treinos.length <= 2 ? "Full-body / Multimodal" :
    treinos.length <= 4 ? "Upper/Lower / Multimodal" :
    "Semanal estruturado (multimodal)";

  return {
    divisaoSemanal,
    frequencia: treinos.length,
    treinos,
  };
}
