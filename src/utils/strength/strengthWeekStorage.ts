import type { MuscleGroup } from "@/features/fitness-suite/data/strength/strengthTypes";

export type WeekdayKey = "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";
export type StrengthWeekPlan = Record<WeekdayKey, MuscleGroup[]>;

const KEY_GROUPS = "mf_strength_selected_groups";
const KEY_PLAN = "mf_strength_week_plan";

export function loadSelectedGroups(): MuscleGroup[] {
  try {
    const raw = localStorage.getItem(KEY_GROUPS);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr.filter(Boolean) as MuscleGroup[]) : [];
  } catch {
    return [];
  }
}

export function saveSelectedGroups(groups: MuscleGroup[]): void {
  localStorage.setItem(KEY_GROUPS, JSON.stringify(groups));
}

export function loadWeekPlan(): StrengthWeekPlan | null {
  try {
    const raw = localStorage.getItem(KEY_PLAN);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    return obj && typeof obj === "object" ? (obj as StrengthWeekPlan) : null;
  } catch {
    return null;
  }
}

export function saveWeekPlan(plan: StrengthWeekPlan): void {
  localStorage.setItem(KEY_PLAN, JSON.stringify(plan));
}
