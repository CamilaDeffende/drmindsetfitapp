import { SessionTemplate, WeeklyTemplate } from "../core/types";
import { SESSION_TEMPLATES } from "../library/sessionTemplates";

export function selectSessionTemplates(template: WeeklyTemplate): SessionTemplate[] {
  return template.days.map((day) => {
    return (
      SESSION_TEMPLATES.find((item) => item.focus === day) ?? {
        split: String(template.split),
        focus: day,
        requiredPatterns: [],
      }
    );
  });
}
