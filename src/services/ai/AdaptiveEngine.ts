import { historyService, WorkoutRecord } from "@/services/history/HistoryService";

export type AdaptiveRecommendation = {
  type: "warning" | "success" | "info" | "adjustment";
  title: string;
  message: string;
  action?: { label: string; href?: string };
};

export type PerformanceMetrics = {
  workoutFrequency7d: number;
  avgPSE7d: number;
  avgDurationMin7d: number;
  loadTrend14d: "up" | "down" | "stable";
  recoveryScore: number;
};

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function getWorkoutsAll(limit = 9999): WorkoutRecord[] {
  const ws = (historyService as any).getWorkouts?.(limit) ?? [];
  return Array.isArray(ws) ? (ws as WorkoutRecord[]) : [];
}

function inRange(w: any, start: Date, end: Date) {
  const di = w.dateIso ?? w.date ?? w.startTime ?? w.endTime;
  if (!di) return false;
  const t = new Date(String(di)).getTime();
  return t >= start.getTime() && t <= end.getTime();
}

function durationMin(w: any): number {
  const v =
    w.durationMinutes ??
    w.durationMin ??
    (typeof w.durationSec === "number" ? Math.round(w.durationSec / 60) : undefined);
  return typeof v === "number" ? v : 0;
}

function pseVal(w: any): number | undefined {
  return typeof w.pse === "number" ? w.pse : undefined;
}

export class AdaptiveEngine {
  computeMetrics(now = new Date()): PerformanceMetrics {
    const end = now;
    const start7 = addDays(end, -6);
    const start14 = addDays(end, -13);

    const all = getWorkoutsAll(9999);
    const w7 = all.filter((w) => inRange(w, start7, end));
    const w14 = all.filter((w) => inRange(w, start14, end));

    const workoutFrequency7d = w7.length;

    const pseArr = w7.map(pseVal).filter((x): x is number => typeof x === "number");
    const avgPSE7d = pseArr.length ? pseArr.reduce((s, v) => s + v, 0) / pseArr.length : 0;

    const avgDurationMin7d = w7.length ? w7.reduce((s, w) => s + durationMin(w), 0) / w7.length : 0;

    const mid = addDays(end, -7);
    const wPrev = w14.filter((w) => inRange(w, start14, addDays(mid, -1)));
    const avgPrev = wPrev.length ? wPrev.reduce((s, w) => s + durationMin(w), 0) / wPrev.length : 0;
    const avgNow = w7.length ? w7.reduce((s, w) => s + durationMin(w), 0) / w7.length : 0;

    const loadTrend14d: "up" | "down" | "stable" =
      avgNow > avgPrev * 1.15 ? "up" : avgNow < avgPrev * 0.85 ? "down" : "stable";

    let recoveryScore = 85;
    if (workoutFrequency7d >= 6) recoveryScore -= 18;
    if (avgPSE7d >= 8) recoveryScore -= 18;
    if (avgPSE7d >= 6 && avgPSE7d < 8) recoveryScore -= 8;
    if (loadTrend14d == "up") recoveryScore -= 10;
    if (workoutFrequency7d <= 3) recoveryScore += 5;
    recoveryScore = Math.max(0, Math.min(100, Math.round(recoveryScore)));

    return {
      workoutFrequency7d,
      avgPSE7d: Math.round(avgPSE7d * 10) / 10,
      avgDurationMin7d: Math.round(avgDurationMin7d),
      loadTrend14d,
      recoveryScore,
    };
  }

  getRecommendations(now = new Date()): AdaptiveRecommendation[] {
    const m = this.computeMetrics(now);
    const recs: AdaptiveRecommendation[] = [];

    if (m.workoutFrequency7d == 0) {
      recs.push({
        type: "info",
        title: "Vamos voltar ao ritmo",
        message: "Nenhum treino nos últimos 7 dias. Que tal iniciar com um treino leve para retomar consistência?",
        action: { label: "Abrir Progress", href: "/progress" },
      });
      return recs;
    }

    if (m.recoveryScore <= 55) {
      recs.push({
        type: "warning",
        title: "Risco de fadiga acumulada",
        message: `Recuperação estimada: ${m.recoveryScore}/100. Sugestão: reduzir volume por 24–48h e priorizar sono/hidratação.`,
        action: { label: "Treino ao Vivo", href: "/live-workout" },
      });
    } else {
      recs.push({
        type: "success",
        title: "Boa consistência",
        message: `Recuperação estimada: ${m.recoveryScore}/100. Continue progredindo com atenção à técnica e regularidade.`,
      });
    }

    if (m.loadTrend14d == "up") {
      recs.push({
        type: "adjustment",
        title: "Carga em alta",
        message: "Sua carga média aumentou nas últimas 2 semanas. Considere um dia de descarga se aparecer queda de performance.",
      });
    }

    if (m.avgPSE7d >= 8) {
      recs.push({
        type: "warning",
        title: "Esforço muito alto",
        message: "A PSE média está elevada. Alternar dias fortes/leves ajuda a manter evolução e reduzir risco de overreaching.",
      });
    }

    return recs;
  }
}

export const adaptiveEngine = new AdaptiveEngine();
