import { describe, expect, it } from "vitest";
import { predictAdherence } from "../core/trainingPredictionEngine";

describe("trainingPredictionEngine", () => {
  it("prevê aderência alta em cenário favorável", () => {
    const result = predictAdherence({
      completedSessions: 5,
      plannedSessions: 5,
      averageReadiness: 8.5,
      averageSessionDuration: 55,
      lifestyleConstraintScore: 2,
    });

    expect(result.band).toBe("high");
    expect(result.score).toBeGreaterThanOrEqual(75);
  });

  it("prevê aderência baixa em cenário desfavorável", () => {
    const result = predictAdherence({
      completedSessions: 2,
      plannedSessions: 5,
      averageReadiness: 4.5,
      averageSessionDuration: 95,
      lifestyleConstraintScore: 8,
    });

    expect(result.band).toBe("low");
    expect(result.score).toBeLessThan(55);
  });
});
