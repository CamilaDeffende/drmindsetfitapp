import { describe, expect, it } from "vitest";
import { decideMicrocycleAdjustments } from "../core/trainingPeriodizationEngine";

describe("trainingPeriodizationEngine", () => {
  it("recomenda deload em cenário de fadiga acumulada", () => {
    const result = decideMicrocycleAdjustments({
      loadMetrics: {
        acuteLoad: 2200,
        chronicLoad: 1500,
        loadRatio: 1.47,
        monotony: 2.4,
        strain: 5280,
        weeklyLoad: 2200,
        averageDailyLoad: 314.28,
        loadStdDev: 130.9,
      },
      readinessTrend: {
        current: 5,
        average7d: 6,
        trendDelta: -1.5,
        declining: true,
      },
      adherencePrediction: {
        score: 49,
        band: "low",
        explanation: "Baixa aderência prevista.",
      },
      consecutiveHardWeeks: 3,
    });

    expect(result.deloadRecommended).toBe(true);
    expect(result.volumeAdjustmentPct).toBeLessThan(0);
    expect(result.microcycleScore).toBeLessThanOrEqual(55);
  });

  it("permite progressão conservadora em cenário favorável", () => {
    const result = decideMicrocycleAdjustments({
      loadMetrics: {
        acuteLoad: 1450,
        chronicLoad: 1400,
        loadRatio: 1.03,
        monotony: 1.2,
        strain: 1740,
        weeklyLoad: 1450,
        averageDailyLoad: 207.14,
        loadStdDev: 172.61,
      },
      readinessTrend: {
        current: 8,
        average7d: 8,
        trendDelta: 0.2,
        declining: false,
      },
      adherencePrediction: {
        score: 84,
        band: "high",
        explanation: "Alta probabilidade de aderência.",
      },
      consecutiveHardWeeks: 1,
    });

    expect(result.deloadRecommended).toBe(false);
    expect(result.progressionFactor).toBeGreaterThanOrEqual(1.03);
  });
});
