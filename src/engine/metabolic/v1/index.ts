import { MetabolicInputV1, MetabolicPlanResultV1 } from "./types";
import { calcTDEE } from "./tdee";
import { calcCalorieTarget, calcMacros } from "./goals";
import { calcEAAlerts } from "./athlete";

export function buildMetabolicPlanV1(input: MetabolicInputV1): MetabolicPlanResultV1 {
  const { ree, tdee } = calcTDEE(input);

  const isAthlete = (input.trainingFrequencyPerWeek >= 5 && input.trainingOverallIntensity !== "leve");
  const mode = isAthlete ? "athlete" : "standard";

  const goalPick = calcCalorieTarget(tdee.tdeeFinalKcalPerDay, input.goal, mode);
  const macros = calcMacros(input, goalPick.calories);
  const alerts = calcEAAlerts(input);

  return {
    version: "v1",
    ree,
    tdee,
    goal: input.goal,
    goalRange: {
      deficitOrSurplusPercent: goalPick.pct,
      rangeLabel: goalPick.label,
    },
    macros,
    athleteAlerts: alerts,
    limitations: [
      "Equações de REE são estimativas e variam por indivíduo.",
      "PAL é aproximação de estilo de vida; MET estima gasto de exercício e pode variar.",
      "Calibração por resposta (14–21 dias) melhora a precisão do motor.",
      "Alertas de EA são triagem operacional (não diagnóstico médico).",
    ],
  };
}
