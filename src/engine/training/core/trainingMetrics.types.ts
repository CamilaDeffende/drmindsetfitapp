export type DailyReadinessValue = number;

export interface TrainingLoadInput {
  sessionRpe: number;
  durationMinutes: number;
}

export interface DailyLoadPoint {
  date: string;
  load: number;
  readiness?: number;
  completed?: boolean;
}

export interface TrainingLoadMetrics {
  acuteLoad: number;
  chronicLoad: number;
  loadRatio: number;
  monotony: number;
  strain: number;
  weeklyLoad: number;
  averageDailyLoad: number;
  loadStdDev: number;
}

export interface ReadinessTrendMetrics {
  current: number;
  average7d: number;
  trendDelta: number;
  declining: boolean;
}

export interface AdherencePredictionInput {
  completedSessions: number;
  plannedSessions: number;
  averageReadiness: number;
  averageSessionDuration: number;
  lifestyleConstraintScore: number;
}

export interface AdherencePrediction {
  score: number;
  band: "low" | "moderate" | "high";
  explanation: string;
}

export interface MicrocycleDecisionInput {
  loadMetrics: TrainingLoadMetrics;
  readinessTrend: ReadinessTrendMetrics;
  adherencePrediction: AdherencePrediction;
  consecutiveHardWeeks: number;
}

export interface MicrocycleDecision {
  microcycleScore: number;
  deloadRecommended: boolean;
  progressionFactor: number;
  volumeAdjustmentPct: number;
  intensityAdjustmentPct: number;
  rationale: string[];
}
