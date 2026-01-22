/**
 * WeeklyWorkoutProtocol — CONTRATO ÚNICO E DEFINITIVO do protocolo semanal.
 *
 * ✅ Fonte da verdade para: UI, PDF e futuras features.
 * ✅ Determinístico: mesmo input -> mesmo output (o motor vem no PASSO 2).
 * ✅ Importante: NÃO existe nível geral. Nível sempre por modalidade.
 */

export type WorkoutModality =
  | "musculacao"
  | "funcional"
  | "hiit"
  | "corrida"
  | "crossfit"
  | "bike_indoor"; // spinning / bike indoor

export type ActivityLevel = "iniciante" | "intermediario" | "avancado";

/**
 * Estrutura resumida de cada sessão.
 * (Detalhamento de exercícios/séries/reps vem no PASSO 4.)
 */
export type WorkoutStructure = {
  type: "forca" | "hipertrofia" | "tecnico" | "metabolico" | "resistencia";
  volume: number; // escala interna (ex.: 1–10) definida pelo motor
  intensidade: "baixa" | "moderada" | "alta";
  descanso: string; // ex.: "60–90s", "2–3min"
  duracaoEstimada: string; // ex.: "45–60min"
};

export type WeeklyWorkoutSession = {
  day: string; // ex.: "Segunda", "Terça" (UI define o label final)
  modality: WorkoutModality;
  modalityLevel: ActivityLevel;
  goal: string; // ex.: "Força base", "Técnica e consistência"
  structure: WorkoutStructure;
};

export type WeeklyWorkoutProtocol = {
  generatedAt: string; // ISO string
  modalities: WorkoutModality[];
  levelByModality: Partial<Record<WorkoutModality, ActivityLevel>>;
  sessions: WeeklyWorkoutSession[];
};

/**
 * Helper opcional (não obrigatório), útil para garantir formato estável.
 * Não altera lógica do app por si só — só normaliza dados para o contrato.
 */
export function asWeeklyWorkoutProtocol(p: WeeklyWorkoutProtocol): WeeklyWorkoutProtocol {
  return {
    generatedAt: p.generatedAt,
    modalities: [...p.modalities],
    levelByModality: { ...p.levelByModality },
    sessions: p.sessions.map((s) => ({
      day: s.day,
      modality: s.modality,
      modalityLevel: s.modalityLevel,
      goal: s.goal,
      structure: { ...s.structure },
    })),
  };
}
