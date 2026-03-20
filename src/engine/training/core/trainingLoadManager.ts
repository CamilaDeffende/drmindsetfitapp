import type {
  DailyLoadPoint,
  TrainingLoadInput,
  TrainingLoadMetrics,
  ReadinessTrendMetrics,
} from "./trainingMetrics.types";

function round(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((acc, v) => acc + v, 0) / values.length;
}

function stdDev(values: number[]): number {
  if (values.length <= 1) return 0;
  const avg = mean(values);
  const variance =
    values.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / values.length;
  return Math.sqrt(variance);
}

export function computeSessionLoad(input: TrainingLoadInput): number {
  const rpe = Math.max(0, Math.min(10, input.sessionRpe));
  const duration = Math.max(0, input.durationMinutes);
  return round(rpe * duration, 2);
}

export function computeTrainingLoadMetrics(history: DailyLoadPoint[]): TrainingLoadMetrics {
  const ordered = [...history].slice(-28);
  const loads = ordered.map((d) => Math.max(0, d.load));
  const last7 = loads.slice(-7);
  const last28 = loads.slice(-28);

  const acuteLoad = last7.reduce((a, b) => a + b, 0);
  const chronicLoad = last28.length ? last28.reduce((a, b) => a + b, 0) / 4 : 0;
  const loadRatio = chronicLoad > 0 ? acuteLoad / chronicLoad : acuteLoad > 0 ? 2 : 1;

  const weeklyLoad = acuteLoad;
  const averageDailyLoad = mean(last7);
  const loadStd = stdDev(last7);
  const monotony = loadStd > 0 ? averageDailyLoad / loadStd : averageDailyLoad > 0 ? 5 : 0;
  const strain = weeklyLoad * monotony;

  return {
    acuteLoad: round(acuteLoad),
    chronicLoad: round(chronicLoad),
    loadRatio: round(loadRatio),
    monotony: round(monotony),
    strain: round(strain),
    weeklyLoad: round(weeklyLoad),
    averageDailyLoad: round(averageDailyLoad),
    loadStdDev: round(loadStd),
  };
}

export function computeReadinessTrend(history: DailyLoadPoint[]): ReadinessTrendMetrics {
  const readinessValues = history
    .slice(-7)
    .map((d) => (typeof d.readiness === "number" ? d.readiness : null))
    .filter((v): v is number => v !== null);

  const current = readinessValues.length ? readinessValues[readinessValues.length - 1] : 0;
  const average7d = readinessValues.length ? mean(readinessValues) : 0;
  const baseline3 = readinessValues.slice(0, 3);
  const recent3 = readinessValues.slice(-3);

  const baselineAvg = baseline3.length ? mean(baseline3) : average7d;
  const recentAvg = recent3.length ? mean(recent3) : average7d;
  const trendDelta = recentAvg - baselineAvg;

  return {
    current: round(current),
    average7d: round(average7d),
    trendDelta: round(trendDelta),
    declining: trendDelta <= -0.5,
  };
}
