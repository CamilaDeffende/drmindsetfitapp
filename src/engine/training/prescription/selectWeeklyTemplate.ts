import { TrainingSplit } from "../core/enums";
import { WeeklyTemplate } from "../core/types";
import { WEEKLY_TEMPLATES } from "../library/weeklyTemplates";

export function selectWeeklyTemplate(split: TrainingSplit): WeeklyTemplate {
  return WEEKLY_TEMPLATES.find((template) => template.split === split) ?? WEEKLY_TEMPLATES[0];
}
