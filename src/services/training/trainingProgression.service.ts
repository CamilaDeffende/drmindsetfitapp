import { getCanonicalTrainingLoadHistory } from "@/services/training/trainingExecution.service";

type AnyObj = Record<string, any>;

export type ProgressionSuggestion = {
  exerciseId: string;
  basedOnHistory: boolean;
  lastAverageLoadKg: number | null;
  suggestedLoadKg: number | null;
  progressionPercent: number;
  confidence: "baixa" | "media" | "alta";
  rationale: string;
};

type SuggestionInput = {
  exerciseId?: string | null;
  exerciseName?: string | null;
  currentSets?: number | null;
  currentReps?: string | null;
};

function safeArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function toNum(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function roundToStep(value: number, step = 1): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value / step) * step;
}

function parseRepRange(value: unknown): { min: number | null; max: number | null } {
  const raw = String(value ?? "").trim();
  if (!raw) return { min: null, max: null };

  const m = raw.match(/(\d+)\s*[-–aA]\s*(\d+)/);
  if (m) {
    const min = Number(m[1]);
    const max = Number(m[2]);
    return {
      min: Number.isFinite(min) ? min : null,
      max: Number.isFinite(max) ? max : null,
    };
  }

  const single = raw.match(/(\d+)/);
  if (single) {
    const n = Number(single[1]);
    return {
      min: Number.isFinite(n) ? n : null,
      max: Number.isFinite(n) ? n : null,
    };
  }

  return { min: null, max: null };
}

function inferStepKg(avgLoad: number): number {
  if (avgLoad <= 0) return 1;
  if (avgLoad <= 10) return 1;
  if (avgLoad <= 25) return 1;
  if (avgLoad <= 60) return 2.5;
  return 5;
}

function extractLoadSamples(historyItem: AnyObj): number[] {
  const details = safeArray<AnyObj>(historyItem?.details);
  const samples = details
    .map((d) => toNum(d?.carga, NaN))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (samples.length) return samples;

  const total = toNum(historyItem?.cargaTotal, 0);
  const sets = details.length || toNum(historyItem?.setsCompleted, 0);
  if (total > 0 && sets > 0) return [total / sets];

  return [];
}

function average(values: number[]): number | null {
  if (!values.length) return null;
  const sum = values.reduce((acc, n) => acc + n, 0);
  return sum / values.length;
}

function buildHistoryIndex() {
  const raw = safeArray<AnyObj>(getCanonicalTrainingLoadHistory());
  return raw
    .map((item) => {
      const dateValue = item?.completedAt ?? item?.data ?? item?.date ?? item?.createdAt ?? null;
      const ts = dateValue ? new Date(dateValue).getTime() : 0;
      return { ...item, __ts: Number.isFinite(ts) ? ts : 0 };
    })
    .sort((a, b) => b.__ts - a.__ts);
}

function filterExerciseHistory(all: AnyObj[], exerciseId?: string | null, exerciseName?: string | null): AnyObj[] {
  const id = String(exerciseId ?? "").trim().toLowerCase();
  const name = String(exerciseName ?? "").trim().toLowerCase();

  return all.filter((item) => {
    const itemId = String(item?.exerciseId ?? item?.exercicioId ?? "").trim().toLowerCase();
    const itemName = String(item?.exerciseName ?? item?.exercicioNome ?? "").trim().toLowerCase();

    if (id && itemId && itemId === id) return true;
    if (name && itemName && itemName === name) return true;
    return false;
  });
}

export function getExerciseProgressionSuggestion(input: SuggestionInput): ProgressionSuggestion | null {
  const exerciseId = String(input.exerciseId ?? "").trim();
  const exerciseName = String(input.exerciseName ?? "").trim();

  if (!exerciseId && !exerciseName) return null;

  const allHistory = buildHistoryIndex();
  const exerciseHistory = filterExerciseHistory(allHistory, exerciseId, exerciseName).slice(0, 6);

  const repRange = parseRepRange(input.currentReps);
  const currentSets = toNum(input.currentSets, 0);

  if (!exerciseHistory.length) {
    return {
      exerciseId: exerciseId || exerciseName || "unknown",
      basedOnHistory: false,
      lastAverageLoadKg: null,
      suggestedLoadKg: null,
      progressionPercent: 0,
      confidence: "baixa",
      rationale:
        currentSets > 0 && (repRange.min || repRange.max)
          ? "Sem histórico suficiente ainda. Complete pelo menos 1 sessão para liberar progressão automática."
          : "Sem histórico suficiente ainda para sugerir progressão.",
    };
  }

  const latest = exerciseHistory[0];
  const latestSamples = extractLoadSamples(latest);
  const historicalSamples = exerciseHistory.flatMap(extractLoadSamples);

  const lastAverageLoadKg = average(latestSamples);
  const historicalAverageLoadKg = average(historicalSamples);

  const baseLoad = lastAverageLoadKg ?? historicalAverageLoadKg;
  if (!baseLoad || baseLoad <= 0) {
    return {
      exerciseId: exerciseId || exerciseName || "unknown",
      basedOnHistory: true,
      lastAverageLoadKg: null,
      suggestedLoadKg: null,
      progressionPercent: 0,
      confidence: "baixa",
      rationale: "Histórico encontrado, mas sem dados de carga válidos para sugerir progressão.",
    };
  }

  const maxTarget = repRange.max ?? repRange.min ?? null;
  const minTarget = repRange.min ?? repRange.max ?? null;

  const latestDetails = safeArray<AnyObj>(latest?.details);
  const performedReps = latestDetails
    .map((d) => toNum(d?.repeticoes, NaN))
    .filter((n) => Number.isFinite(n) && n > 0);

  const avgPerformedReps = average(performedReps);
  const repGoalReached =
    maxTarget != null && avgPerformedReps != null ? avgPerformedReps >= maxTarget : false;

  let progressionPercent = 0;
  let confidence: ProgressionSuggestion["confidence"] = "media";
  let rationale = "Manter a carga atual até consolidar mais dados.";
  let suggestedLoadKg = baseLoad;

  if (repGoalReached) {
    progressionPercent = baseLoad <= 25 ? 5 : 2.5;
    confidence = exerciseHistory.length >= 3 ? "alta" : "media";
    suggestedLoadKg = baseLoad * (1 + progressionPercent / 100);
    rationale =
      avgPerformedReps != null && maxTarget != null
        ? `Última média de ${avgPerformedReps.toFixed(1)} reps atingiu o topo da faixa (${maxTarget}). Progressão recomendada.`
        : "Topo da faixa de repetições atingido. Progressão recomendada.";
  } else if (minTarget != null && avgPerformedReps != null && avgPerformedReps < minTarget) {
    progressionPercent = 0;
    confidence = "media";
    suggestedLoadKg = baseLoad;
    rationale = `A média recente (${avgPerformedReps.toFixed(1)} reps) ficou abaixo da faixa alvo (${minTarget}+). Mantenha a carga.`;
  } else {
    progressionPercent = 0;
    confidence = exerciseHistory.length >= 2 ? "media" : "baixa";
    suggestedLoadKg = baseLoad;
    rationale = "Faixa ainda em consolidação. Mantenha a carga e busque mais qualidade de execução.";
  }

  const step = inferStepKg(baseLoad);
  suggestedLoadKg = roundToStep(suggestedLoadKg, step);

  return {
    exerciseId: exerciseId || exerciseName || "unknown",
    basedOnHistory: true,
    lastAverageLoadKg: roundToStep(baseLoad, step),
    suggestedLoadKg: suggestedLoadKg > 0 ? suggestedLoadKg : null,
    progressionPercent,
    confidence,
    rationale,
  };
}
