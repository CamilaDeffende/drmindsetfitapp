import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../services/training/trainingReadiness.service", () => {
  return {
    getTrainingReadinessSnapshot: () => ({
      fatigueHotspots: [],
      microcycle: { shouldDeload: false, week: 2 },
      score: 78,
      level: "moderate",
      recommendation: "maintain",
      rationale: "Mocked readiness for adaptation test.",
      flags: [],
      recentSessions: 4,
      avgAdherencePct: 82,
      avgSessionScore: 76,
      avgVolumeLoad: 1200,
      recommendedLoadAdjustmentPct: 0,
    }),
  };
});

vi.mock("../../../services/training/trainingEngine.storage", () => {
  return {
    appendTrainingDecision: vi.fn(),
    saveSmartTrainingPlan: vi.fn(),
    loadSmartTrainingPlan: vi.fn(() => null),
    loadTrainingDecisionLog: vi.fn(() => []),
  };
});

import { generateSmartTraining } from "../orchestrator/generateSmartTraining";
import { refreshTrainingFromFeedback } from "../orchestrator/refreshTrainingFromFeedback";

describe("training engine adaptation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("aplica compressão por tempo e mantém plano válido", () => {
    const generated = generateSmartTraining({
      objective: "hypertrophy",
      experienceLevel: "intermediate",
      weeklyDays: 4,
      sessionDurationMin: 60,
      availableEquipment: ["dumbbell", "bench"],
      recoveryScore: 4,
      adherenceHistoryScore: 4,
      environment: "home",
      modality: "strength",
    });

    const refreshed = refreshTrainingFromFeedback(generated.plan, {
      timeConstraintMin: 35,
      sessionScore: 62,
      adherencePct: 75,
      perceivedRecovery: 60,
    });

    expect(refreshed.plan.version).toBeGreaterThan(generated.plan.version);
    expect(refreshed.validation.valid).toBeTruthy();
    expect(refreshed.decision.actions.length).toBeGreaterThan(0);
  });
});
