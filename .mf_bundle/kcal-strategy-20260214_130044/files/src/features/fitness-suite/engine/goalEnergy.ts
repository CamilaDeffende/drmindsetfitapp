export type GoalKey = "emagrecimento_estetica" | "hipertrofia" | "performance_longevidade";

export type ActivityLevel = "iniciante" | "intermediario" | "avancado";

// Heurística científica-operacional:
// - Emagrecimento: déficit moderado (evitar agressivo quando carga alta).
// - Hipertrofia: leve superávit.
// - Performance/Longevidade: manutenção/leve superávit conforme carga.
export function normalizeGoal(raw: unknown): GoalKey {
  const s = String(raw ?? "").toLowerCase();
  if (s.includes("hipert")) return "hipertrofia";
  if (s.includes("perform") || s.includes("longev")) return "performance_longevidade";
  return "emagrecimento_estetica";
}

// Estima kcal/semana do treino a partir de modalidades + nível.
// (MVP seguro: usa ranges por modalidade; depois refinamos com METs, peso, duração e pace.)
export type ModalityKey = "musculacao" | "funcional" | "corrida" | "bike_indoor" | "crossfit";

export function estimateTrainingKcalPerSession(mod: ModalityKey, level: ActivityLevel, pesoKg = 70): number {
  // base por sessão (45-60min). Ajuste por nível.
  const levelMult = level === "avancado" ? 1.25 : level === "intermediario" ? 1.1 : 0.95;

  // valores conservadores (kcal/sessão) para MVP (sem risco de superestimar)
  // depois substituiremos por METs + duração + pace real.
  const base =
    mod === "musculacao" ? 280 :
    mod === "funcional" ? 360 :
    mod === "corrida" ? 420 :
    mod === "bike_indoor" ? 380 :
    400; // crossfit

  // pequeno ajuste por peso
  const weightMult = Math.max(0.85, Math.min(1.25, pesoKg / 70));
  return Math.round(base * levelMult * weightMult);
}

export function computeObjectiveDeltaKcal(goal: GoalKey, getKcal: number, treinoKcalSemanal: number) {
  // carga semanal de treino em kcal:
  // usamos para evitar déficit agressivo quando treino alto (aderência + recuperação).
  const weeklyLoad = treinoKcalSemanal;

  if (goal === "hipertrofia") {
    // leve superávit: +5% a +12% do GET, limitado por carga.
    const pct = weeklyLoad >= 2500 ? 0.05 : 0.08;
    return Math.round(getKcal * pct);
  }

  if (goal === "performance_longevidade") {
    // manutenção/leve superávit: 0% a +6% do GET conforme carga.
    const pct = weeklyLoad >= 2500 ? 0.04 : 0.02;
    return Math.round(getKcal * pct);
  }

  // emagrecimento/estética:
  // déficit moderado: -10% a -20% do GET, MAS se treino alto, reduzir déficit para preservar performance.
  const pct = weeklyLoad >= 2500 ? -0.10 : -0.15;
  return Math.round(getKcal * pct);
}

export function computeFinalTargetCalories(params: {
  getKcal: number;
  goalRaw: unknown;
  level: ActivityLevel;
  daysSelected: string[];
  planByDay: Record<string, ModalityKey>;
  pesoKg?: number;
}) {
  const goal = normalizeGoal(params.goalRaw);
  const pesoKg = params.pesoKg ?? 70;

  const treinoKcalSemanal = (params.daysSelected ?? []).reduce((acc, dayKey) => {
    const mod = params.planByDay?.[dayKey];
    if (!mod) return acc;
    return acc + estimateTrainingKcalPerSession(mod, params.level, pesoKg);
  }, 0);

  const deltaObjetivo = computeObjectiveDeltaKcal(goal, params.getKcal, treinoKcalSemanal);

  // deltaTreino: aqui é só informativo (para transparência). O GET já inclui atividade média,
  // mas usamos treinoKcalSemanal para ajustar objetivo (acima) e para exibir no relatório.
  const deltaTreinoInfo = Math.round(treinoKcalSemanal / 7);

  const alvoFinal = Math.max(1200, Math.round(params.getKcal + deltaObjetivo)); // piso de segurança MVP
  return {
    goal,
    treinoKcalSemanal,
    treinoKcalDiaMedio: deltaTreinoInfo,
    deltaObjetivoKcal: deltaObjetivo,
    caloriasAlvoFinal: alvoFinal,
  };
}
