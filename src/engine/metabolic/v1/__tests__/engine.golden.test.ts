import { describe, expect, test } from "vitest";
import { buildMetabolicPlanV1 } from "../index";
import type { MetabolicInputV1 } from "../types";

describe("MF Metabolic Engine V1 — golden", () => {
  test("perfil padrão (sem FFM) cutting", () => {
    const input: MetabolicInputV1 = {
      sex: "male",
      ageYears: 30,
      weightKg: 80,
      heightCm: 180,
      trainingFrequencyPerWeek: 4,
      trainingOverallIntensity: "moderada",
      weeklySessions: [
        { modality: "musculacao", intensity: "alta", minutes: 60 },
        { modality: "corrida", intensity: "moderada", minutes: 40 },
      ],
      goal: "cutting",
    };
    const r = buildMetabolicPlanV1(input);
    expect(r.version).toBe("v1");
    expect(r.ree.reeKcalPerDay).toBeGreaterThan(1000);
    expect(r.tdee.tdeeFinalKcalPerDay).toBeGreaterThan(r.ree.reeKcalPerDay);
    expect(r.macros.proteinGPerDay).toBeGreaterThan(0);
  });

  test("atleta com FFM e ingestão reportada (EA)", () => {
    const input: MetabolicInputV1 = {
      sex: "female",
      ageYears: 28,
      weightKg: 62,
      heightCm: 165,
      ffmKg: 46,
      trainingFrequencyPerWeek: 6,
      trainingOverallIntensity: "alta",
      weeklySessions: [
        { modality: "crossfit", intensity: "alta", minutes: 60 },
        { modality: "corrida", intensity: "moderada", minutes: 40 },
        { modality: "bike_indoor", intensity: "moderada", minutes: 45 },
        { modality: "musculacao", intensity: "alta", minutes: 60 },
      ],
      reportedIntakeKcalPerDay: 1900,
      goal: "cutting",
    };
    const r = buildMetabolicPlanV1(input);
    expect(r.ree.formulaUsed).toBe("cunningham_1980");
    expect(r.athleteAlerts.length).toBeGreaterThan(0);
  });
});
