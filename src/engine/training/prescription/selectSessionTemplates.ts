import { SessionTemplate, WeeklyTemplate } from "../core/types";

export function selectSessionTemplates(template: WeeklyTemplate): SessionTemplate[] {
  return template.days.map((day) => ({
    name: day.name,
    split: template.split,
    dayIndex: day.dayIndex,
    focus: day.focus,
    requiredPatterns: day.requiredPatterns,
    volumeTarget: day.targetVolume,
    targetDurationMin: day.targetDurationMin,
  }));
}
