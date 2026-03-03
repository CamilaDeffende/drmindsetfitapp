import { Goal, MacroTargetsV1, MetabolicInputV1 } from "./types";

const round = (n: number) => Math.round(n);

export function pickGoalPercent(goal: Goal, mode: "conservative" | "standard" | "athlete"): { pct: number; label: string } {
  if (goal === "cutting") {
    if (mode === "conservative") return { pct: 0.125, label: "cut_conservador_10_15" };
    if (mode === "athlete") return { pct: 0.15, label: "cut_atleta_10_20" };
    return { pct: 0.20, label: "cut_padrao_15_25" };
  }
  if (goal === "bulking") {
    if (mode === "athlete") return { pct: 0.05, label: "bulk_atleta_2_7" };
    if (mode === "conservative") return { pct: 0.075, label: "bulk_lean_5_10" };
    return { pct: 0.125, label: "bulk_padrao_10_15" };
  }
  return { pct: 0.0, label: "maintenance" };
}

export function calcCalorieTarget(tdeeFinal: number, goal: Goal, mode: "conservative" | "standard" | "athlete") {
  const { pct, label } = pickGoalPercent(goal, mode);
  if (goal === "cutting") return { calories: round(tdeeFinal * (1 - pct)), pct, label };
  if (goal === "bulking") return { calories: round(tdeeFinal * (1 + pct)), pct, label };
  return { calories: round(tdeeFinal), pct, label };
}

export function calcMacros(input: MetabolicInputV1, caloriesTarget: number): MacroTargetsV1 {
  const isAthlete = (input.trainingFrequencyPerWeek >= 5 && input.trainingOverallIntensity !== "leve");
  const isCut = input.goal === "cutting";

  const proteinG = round((isCut || isAthlete) ? 2.0 * input.weightKg : 1.6 * input.weightKg);
  const fatG = round(0.8 * input.weightKg);

  const proteinKcal = proteinG * 4;
  const fatKcal = fatG * 9;

  const remaining = Math.max(0, caloriesTarget - proteinKcal - fatKcal);
  const carbsG = round(remaining / 4);

  return {
    caloriesTargetKcalPerDay: caloriesTarget,
    proteinGPerDay: proteinG,
    fatGPerDay: fatG,
    carbsGPerDay: carbsG,
  };
}
