import type { TrainingPlan } from "@/engine/training/core/types";

export const SMART_TRAINING_PLAN_KEY = "mf:trainingEngine:plan:v1";
export const TRAINING_DECISION_LOG_KEY = "mf:trainingEngine:decisions:v1";

export type TrainingDecisionLogEntry = {
  id: string;
  timestamp: string;
  actions: string[];
  recommendedLoadAdjustmentPct: number;
  recommendedVolumeAdjustmentPct: number;
  confidence: number;
  rationale: string[];
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveSmartTrainingPlan(plan: TrainingPlan | null): void {
  if (!canUseStorage()) return;
  if (!plan) {
    window.localStorage.removeItem(SMART_TRAINING_PLAN_KEY);
    return;
  }
  window.localStorage.setItem(SMART_TRAINING_PLAN_KEY, JSON.stringify(plan));
}

export function loadSmartTrainingPlan(): TrainingPlan | null {
  if (!canUseStorage()) return null;
  return safeParse<TrainingPlan | null>(window.localStorage.getItem(SMART_TRAINING_PLAN_KEY), null);
}

export function appendTrainingDecision(entry: TrainingDecisionLogEntry): void {
  if (!canUseStorage()) return;
  const current = safeParse<TrainingDecisionLogEntry[]>(
    window.localStorage.getItem(TRAINING_DECISION_LOG_KEY),
    [],
  );
  const next = [entry, ...current].slice(0, 50);
  window.localStorage.setItem(TRAINING_DECISION_LOG_KEY, JSON.stringify(next));
}

export function loadTrainingDecisionLog(limit = 10): TrainingDecisionLogEntry[] {
  if (!canUseStorage()) return [];
  return safeParse<TrainingDecisionLogEntry[]>(
    window.localStorage.getItem(TRAINING_DECISION_LOG_KEY),
    [],
  ).slice(0, limit);
}
