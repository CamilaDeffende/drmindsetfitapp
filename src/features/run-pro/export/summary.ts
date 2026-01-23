import type { RunMetrics, RunSample } from "@/features/run-pro/engine/types";
import { computeCoachScore } from "@/features/run-pro/coach/score";

export type RunSummary = {
  distKm: number;
  avgPaceSecPerKm: number | null;
  bestKmPaceSec: number | null;
  worstKmPaceSec: number | null;
  movingTimeSec: number | null;
  stabilitySec: number | null;
  coachScore: number | null;
  coachLabel: string;
};

function sd(values: number[]): number | null {
  if (values.length < 6) return null;
  const mean = values.reduce((x, y) => x + y, 0) / values.length;
  const v = values.reduce((acc, x) => acc + (x - mean) ** 2, 0) / values.length;
  return Math.sqrt(v);
}

export function buildSummary(samples: RunSample[], metrics?: RunMetrics | null): RunSummary {
  const distKm = (metrics?.distTotalM ?? (samples.at(-1)?.distTotalM ?? 0)) / 1000;

  const paces = samples
    .map((s) => s.paceSecPerKm)
    .filter((x): x is number => typeof x === "number" && Number.isFinite(x) && x > 0);

  const paceSd = sd(paces);

  // splits por km (tempo/km) usando marcos de distTotalM
  const splitTimes: number[] = [];
  if (samples.length >= 2) {
    let lastKm = 0;
    let lastTs = samples[0].ts;
    for (let i = 1; i < samples.length; i++) {
      if (samples[i].distTotalM >= (lastKm + 1) * 1000) {
        const t = (samples[i].ts - lastTs) / 1000;
        splitTimes.push(t);
        lastKm += 1;
        lastTs = samples[i].ts;
        if (splitTimes.length >= 20) break;
      }
    }
  }

  const avgPaceSecPerKm =
    paces.length > 0 ? Math.round(paces.reduce((a, b) => a + b, 0) / paces.length) : null;

  const bestKmPaceSec = splitTimes.length ? Math.min(...splitTimes) : null;
  const worstKmPaceSec = splitTimes.length ? Math.max(...splitTimes) : null;

  const movingTimeSec = metrics?.movingTimeMs ? Math.round(metrics.movingTimeMs / 1000) : null;

  const coach = computeCoachScore(samples, metrics);

  return {
    distKm,
    avgPaceSecPerKm,
    bestKmPaceSec,
    worstKmPaceSec,
    movingTimeSec,
    stabilitySec: paceSd == null ? null : Math.round(paceSd),
    coachScore: coach.score,
    coachLabel: coach.label,
  };
}
