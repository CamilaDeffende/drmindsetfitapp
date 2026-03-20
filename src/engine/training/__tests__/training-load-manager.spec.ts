import { describe, expect, it } from "vitest";
import {
  computeReadinessTrend,
  computeSessionLoad,
  computeTrainingLoadMetrics,
} from "../core/trainingLoadManager";

describe("trainingLoadManager", () => {
  it("calcula session load corretamente", () => {
    expect(computeSessionLoad({ sessionRpe: 8, durationMinutes: 45 })).toBe(360);
  });

  it("calcula métricas de carga semanal", () => {
    const history = [
      { date: "2026-03-01", load: 320, readiness: 8 },
      { date: "2026-03-02", load: 280, readiness: 8 },
      { date: "2026-03-03", load: 0, readiness: 7 },
      { date: "2026-03-04", load: 340, readiness: 7 },
      { date: "2026-03-05", load: 300, readiness: 6 },
      { date: "2026-03-06", load: 360, readiness: 6 },
      { date: "2026-03-07", load: 310, readiness: 5 },
    ];

    const result = computeTrainingLoadMetrics(history);
    expect(result.weeklyLoad).toBe(1910);
    expect(result.monotony).toBeGreaterThan(1);
    expect(result.strain).toBeGreaterThan(0);
  });

  it("detecta tendência de readiness em queda", () => {
    const history = [
      { date: "2026-03-01", load: 250, readiness: 8 },
      { date: "2026-03-02", load: 300, readiness: 8 },
      { date: "2026-03-03", load: 280, readiness: 7 },
      { date: "2026-03-04", load: 320, readiness: 7 },
      { date: "2026-03-05", load: 300, readiness: 6 },
      { date: "2026-03-06", load: 290, readiness: 5 },
      { date: "2026-03-07", load: 270, readiness: 5 },
    ];

    const trend = computeReadinessTrend(history);
    expect(trend.declining).toBe(true);
    expect(trend.current).toBe(5);
  });
});
