import { describe, expect, it } from "vitest";
import { generateSmartTraining } from "../orchestrator/generateSmartTraining";

describe("training engine smoke", () => {
  it("gera plano coerente a partir do onboarding", () => {
    const result = generateSmartTraining({
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

    expect(result.profile.weeklyDays).toBe(4);
    expect(result.plan.sessions.length).toBe(4);
    expect(result.validation.valid).toBeTruthy();
  });
});
