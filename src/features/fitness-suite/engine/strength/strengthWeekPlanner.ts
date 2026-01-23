import type { MuscleGroup } from "../../data/strength/strengthTypes";
import type { UserLevel } from "../../data/strength/strengthLibrary";
import type { StrengthGoal } from "./strengthStrategies";
import type { StrengthWeekPlan, WeekdayKey } from "@/utils/strength/strengthWeekStorage";

export function buildStrengthWeekPlan(params: {
  strengthDays: WeekdayKey[];
  selectedGroups: MuscleGroup[];
  userLevel: UserLevel;
  goal: StrengthGoal;
}): StrengthWeekPlan {
  const { strengthDays, selectedGroups, userLevel } = params;

  const days = [...strengthDays];
  const empty: StrengthWeekPlan = { seg: [], ter: [], qua: [], qui: [], sex: [], sab: [], dom: [] };
  if (!days.length) return empty;

  const uniq: MuscleGroup[] = [];
  const seen = new Set<string>();
  for (const g of selectedGroups) {
    if (!g) continue;
    if (!seen.has(g)) {
      seen.add(g);
      uniq.push(g);
    }
  }

  const priority: MuscleGroup[] = [
    "quadriceps",
    "posterior",
    "gluteos",
    "costas",
    "peito",
    "ombros",
    "biceps",
    "triceps",
    "panturrilhas",
    "core",
  ];
  uniq.sort((a, b) => priority.indexOf(a) - priority.indexOf(b));

  const maxPerDay = userLevel === "iniciante" ? 3 : userLevel === "intermediario" ? 4 : 5;

  const plan: StrengthWeekPlan = { ...empty };

  let cursor = 0;
  for (const g of uniq) {
    let placed = false;
    for (let tries = 0; tries < days.length * 2; tries++) {
      const day = days[cursor % days.length]!;
      const bucket = plan[day];
      if (bucket.length < maxPerDay && !bucket.includes(g)) {
        bucket.push(g);
        placed = true;
        cursor++;
        break;
      }
      cursor++;
    }
    if (!placed) {
      const day = days[cursor % days.length]!;
      if (!plan[day].includes(g)) plan[day].push(g);
      cursor++;
    }
  }

  return plan;
}
