import { TrainingSplitType } from "../core/enums";
import { WeeklyTemplate } from "../core/types";
import { WEEKLY_TEMPLATE_LIST } from "../library/weeklyTemplates";

export function selectWeeklyTemplate(split: TrainingSplitType): WeeklyTemplate {
  return WEEKLY_TEMPLATE_LIST.find((template) => template.split === split) ?? WEEKLY_TEMPLATE_LIST[0];
}
