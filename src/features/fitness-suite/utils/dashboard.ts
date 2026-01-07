import type { WorkoutSession } from "../contracts/workout";

/** Safe date helpers (no deps) */
export function ymdFromISO(iso: string): string {
  // iso: 2026-01-06T... -> 2026-01-06
  if (!iso) return "";
  const m = String(iso).match(/^\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : "";
}

function toMidnightUTC(ymd: string): number {
  // ymd: YYYY-MM-DD
  if (!ymd) return 0;
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return 0;
  return Date.UTC(y, m - 1, d, 0, 0, 0, 0);
}

export function formatPct(delta: number): string {
  if (!Number.isFinite(delta)) return "0%";
  const sign = delta > 0 ? "+" : "";
  return sign + Math.round(delta * 100) + "%";
}

export function formatInt(n: number): string {
  if (!Number.isFinite(n)) return "0";
  return Math.round(n).toString();
}

export function formatKg(n: number): string {
  if (!Number.isFinite(n)) return "0 kg";
  const v = Math.round(n);
  return v.toString() + " kg";
}

export function formatMin(n: number): string {
  if (!Number.isFinite(n)) return "0 min";
  return Math.round(n).toString() + " min";
}

export type WindowStats = {
  workouts: number;
  volumeKg: number;
  sets: number;
  reps: number;
  avgDurationMin: number;
  avgIntensity: number;
};

export type TrendPair = {
  current: WindowStats;
  previous: WindowStats;
  volumeDeltaPct: number;
  workoutsDeltaPct: number;
  intensityDeltaPct: number;
};

export function sumWindow(sessions: WorkoutSession[]): WindowStats {
  const workouts = sessions.length;
  const volumeKg = sessions.reduce((a, s) => a + (s.volumeTotal || 0), 0);
  const sets = sessions.reduce((a, s) => a + (s.setsTotal || 0), 0);
  const reps = sessions.reduce((a, s) => a + (s.repsTotal || 0), 0);
  const avgDurationMin = workouts ? (sessions.reduce((a, s) => a + (s.durationMin || 0), 0) / workouts) : 0;
  const avgIntensity = workouts ? (sessions.reduce((a, s) => a + (s.intensityScore || 0), 0) / workouts) : 0;
  return { workouts, volumeKg, sets, reps, avgDurationMin, avgIntensity };
}

function safePctChange(cur: number, prev: number): number {
  if (!Number.isFinite(cur) || !Number.isFinite(prev) || prev === 0) {
    if (cur === 0) return 0;
    // Se não tem base anterior, assume 100% (apenas para feedback visual)
    return 1;
  }
  return (cur - prev) / prev;
}

/**
 * Trends: compara janela de N dias (inclui today) vs N dias anteriores
 * Usa session.date (YYYY-MM-DD) se existir; fallback para startedAt/finishedAt.
 */
export function buildTrends(sessions: WorkoutSession[], todayYmd: string, days = 7): TrendPair {
  const t0 = toMidnightUTC(todayYmd);
  const dayMs = 24 * 60 * 60 * 1000;

  const startCur = t0 - (days - 1) * dayMs;
  const startPrev = startCur - days * dayMs;
  const endPrev = startCur - dayMs;

  const getYmd = (s: WorkoutSession) => s.date || ymdFromISO(s.finishedAt) || ymdFromISO(s.startedAt) || "";
  const getTs = (ymd: string) => toMidnightUTC(ymd);

  const cur = sessions.filter(s => {
    const ts = getTs(getYmd(s));
    return ts >= startCur && ts <= t0;
  });

  const prev = sessions.filter(s => {
    const ts = getTs(getYmd(s));
    return ts >= startPrev && ts <= endPrev;
  });

  const curStats = sumWindow(cur);
  const prevStats = sumWindow(prev);

  return {
    current: curStats,
    previous: prevStats,
    volumeDeltaPct: safePctChange(curStats.volumeKg, prevStats.volumeKg),
    workoutsDeltaPct: safePctChange(curStats.workouts, prevStats.workouts),
    intensityDeltaPct: safePctChange(curStats.avgIntensity, prevStats.avgIntensity),
  };
}

/** Insight curto (coach-style) baseado em trends */
export function buildInsight(tr: TrendPair): { title: string; body: string; tone: "good" | "warn" | "neutral" } {
  const v = tr.volumeDeltaPct;
  const w = tr.workoutsDeltaPct;
  const i = tr.intensityDeltaPct;

  // Heurística simples (premium e útil, sem "IA fake")
  if (tr.current.workouts === 0) {
    return { title: "Hora de voltar", body: "Nenhum treino nos últimos 7 dias. Reinicie com um treino curto hoje.", tone: "warn" };
  }

  if (w > 0 && v > 0) {
    return { title: "Semana forte", body: "Você aumentou frequência e volume. Mantém consistência e prioriza recuperação.", tone: "good" };
  }

  if (w < 0 && v < 0) {
    return { title: "Atenção na consistência", body: "Frequência e volume caíram. Um treino leve hoje já protege sua evolução.", tone: "warn" };
  }

  if (v < 0 && i > 0) {
    return { title: "Qualidade subiu", body: "Menos volume, mais intensidade. Ótimo se você está em fase de força ou ajuste de carga.", tone: "good" };
  }

  return { title: "Progresso estável", body: "Sua semana está consistente. Próximo passo: bater um PR em 1 exercício.", tone: "neutral" };
}
