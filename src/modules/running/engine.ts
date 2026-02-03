import { RunnerInputs, WeekPlan } from "./types";
import { buildWeekTemplate } from "./templates";

export function generateRunningWeek(inputs: RunnerInputs): WeekPlan {
  // Guardrails: individualização mínima e segura
  if (![3,4,5,6].includes(inputs.daysPerWeek)) {
    throw new Error("daysPerWeek inválido (use 3..6).");
  }
  return buildWeekTemplate(inputs);
}

export function toPrettyJSON(plan: WeekPlan): string {
  return JSON.stringify(plan, null, 2);
}
