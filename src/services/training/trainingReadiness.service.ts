import { loadActivePlan } from "../plan.service";

import { getMicrocycleDeloadSnapshot, getMuscleFatigueSnapshots } from "@/services/training/trainingFatigue.service";

type AnyObj = Record<string, any>;

export type TrainingReadinessLevel = "high" | "moderate" | "low";
export type TrainingAdaptiveRecommendation = "progress" | "maintain" | "deload";

export type TrainingReadinessSnapshot = {
  fatigueHotspots: ReturnType<typeof getMuscleFatigueSnapshots>;
  microcycle: ReturnType<typeof getMicrocycleDeloadSnapshot>;

  score: number;
  level: TrainingReadinessLevel;
  recommendation: TrainingAdaptiveRecommendation;
  rationale: string;
  flags: string[];
  recentSessions: number;
  avgAdherencePct: number;
  avgSessionScore: number;
  avgVolumeLoad: number;
  recommendedLoadAdjustmentPct: number;
};

type SessionPerformance = {
  completedAt?: string;
  adherencePct?: number;
  sessionScore?: number;
  totalVolumeLoad?: number;
  completedExercises?: number;
  plannedExercises?: number;
};

function isObject(value: unknown): value is AnyObj {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function safeArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function safeNum(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((acc, item) => acc + item, 0) / values.length;
}

function getRecentSessionPerformance(limit = 7): SessionPerformance[] {
  const activePlan = loadActivePlan() as AnyObj | null;
  const execution = activePlan?.training?.execution;

  const perf = safeArray<SessionPerformance>(execution?.exercisePerformance)
    .filter((item) => isObject(item))
    .sort((a, b) => {
      const da = new Date(String(a?.completedAt ?? 0)).getTime();
      const db = new Date(String(b?.completedAt ?? 0)).getTime();
      return db - da;
    });

  return perf.slice(0, limit);
}

export function getTrainingReadinessSnapshot(): TrainingReadinessSnapshot {
  const fatigueHotspots = getMuscleFatigueSnapshots(10);
  const microcycle = getMicrocycleDeloadSnapshot();
  const sessions = getRecentSessionPerformance(7);

  if (!sessions.length) {
    return {
      score: 72,
      level: "moderate",
      recommendation: "maintain",
      rationale:
        "Sem histórico suficiente de execução canônica. Mantendo a sessão prescrita até consolidar mais dados reais.",
      flags: ["Histórico insuficiente"],
      recentSessions: 0,
      avgAdherencePct: 0,
      avgSessionScore: 0,
      avgVolumeLoad: 0,
      recommendedLoadAdjustmentPct: 0,
    fatigueHotspots,
    microcycle,
    };
  }

  const adherenceValues = sessions.map((s) => {
    const explicit = safeNum(s?.adherencePct, NaN);
    if (Number.isFinite(explicit)) return explicit;

    const completed = safeNum(s?.completedExercises, 0);
    const planned = safeNum(s?.plannedExercises, 0);
    if (planned > 0) return (completed / planned) * 100;

    return 0;
  });

  const sessionScoreValues = sessions.map((s) => {
    const explicit = safeNum(s?.sessionScore, NaN);
    if (Number.isFinite(explicit)) return explicit;

    const adherence = safeNum(s?.adherencePct, 0);
    return adherence;
  });

  const volumeValues = sessions.map((s) => safeNum(s?.totalVolumeLoad, 0)).filter((n) => n > 0);

  const avgAdherencePct = average(adherenceValues);
  const avgSessionScore = average(sessionScoreValues);
  const avgVolumeLoad = average(volumeValues);

  const latestVolume = volumeValues[0] ?? avgVolumeLoad ?? 0;
  const baseVolume = average(volumeValues.slice(1));
  const volumeDropPct =
    baseVolume > 0 ? ((baseVolume - latestVolume) / baseVolume) * 100 : 0;

  let score =
    avgAdherencePct * 0.5 +
    avgSessionScore * 0.35 +
    clamp(sessions.length * 2, 0, 15);

  const flags: string[] = [];

  if (avgAdherencePct < 70) {
    score -= 12;
    flags.push("Aderência recente abaixo do ideal");
  }

  if (avgSessionScore < 68) {
    score -= 10;
    flags.push("Qualidade média de sessão em queda");
  }

  if (volumeDropPct > 18) {
    score -= 8;
    flags.push("Queda relevante de volume recente");
  }

  score = Math.round(clamp(score, 0, 100));

  let level: TrainingReadinessLevel = "moderate";
  let recommendation: TrainingAdaptiveRecommendation = "maintain";
  let recommendedLoadAdjustmentPct = 0;
  let rationale =
    "Prontidão intermediária. A recomendação é sustentar a sessão atual com técnica, aderência e execução consistente.";

  if (score >= 82 && avgAdherencePct >= 82 && avgSessionScore >= 76) {
    level = "high";
    recommendation = "progress";
    recommendedLoadAdjustmentPct = 2.5;
    rationale =
      "Prontidão alta detectada. O histórico recente sustenta progressão leve e controlada na próxima sessão.";
  } else if (score <= 62 || avgAdherencePct < 65 || avgSessionScore < 62 || volumeDropPct > 25) {
    level = "low";
    recommendation = "deload";
    recommendedLoadAdjustmentPct = -10;
    rationale =
      "Prontidão baixa detectada. O motor recomenda deload tático ou manutenção conservadora para proteger consistência e qualidade.";
  }

  if (!flags.length) {
    flags.push("Consistência recente estável");
  }

  return {
    score,
    level,
    recommendation,
    rationale,
    fatigueHotspots,
    microcycle,
    flags,
    recentSessions: sessions.length,
    avgAdherencePct: Math.round(avgAdherencePct),
    avgSessionScore: Math.round(avgSessionScore),
    avgVolumeLoad: Math.round(avgVolumeLoad),
    recommendedLoadAdjustmentPct,
  };
}
