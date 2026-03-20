import { describe, expect, it } from "vitest";
import { generateSmartTraining } from "@/engine/training/orchestrator/generateSmartTraining";
import { refreshTrainingFromFeedback } from "@/engine/training/orchestrator/refreshTrainingFromFeedback";

describe("training engine adaptation", () => {
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
  });
});
