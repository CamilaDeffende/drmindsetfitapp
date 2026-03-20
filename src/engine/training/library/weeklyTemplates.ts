import { SessionFocus, TrainingSplitType } from "../core/enums";
import { WeeklyTemplate } from "../core/types";

export const WEEKLY_TEMPLATES: Record<TrainingSplitType, SessionFocus[]> = {
  FULL_BODY: [SessionFocus.FULL_BODY, SessionFocus.FULL_BODY, SessionFocus.FULL_BODY, SessionFocus.FULL_BODY, SessionFocus.FULL_BODY, SessionFocus.FULL_BODY],
  UPPER_LOWER: [SessionFocus.UPPER, SessionFocus.LOWER, SessionFocus.UPPER, SessionFocus.LOWER, SessionFocus.UPPER, SessionFocus.LOWER],
  PUSH_PULL_LEGS: [SessionFocus.PUSH, SessionFocus.PULL, SessionFocus.LEGS, SessionFocus.PUSH, SessionFocus.PULL, SessionFocus.LEGS],
  BODY_PART: [SessionFocus.PUSH, SessionFocus.PULL, SessionFocus.LEGS, SessionFocus.UPPER, SessionFocus.CONDITIONING, SessionFocus.RECOVERY],
};

export const WEEKLY_TEMPLATE_LIST: WeeklyTemplate[] = [
  { split: TrainingSplitType.FULL_BODY, days: WEEKLY_TEMPLATES.FULL_BODY },
  { split: TrainingSplitType.UPPER_LOWER, days: WEEKLY_TEMPLATES.UPPER_LOWER },
  { split: TrainingSplitType.PUSH_PULL_LEGS, days: WEEKLY_TEMPLATES.PUSH_PULL_LEGS },
  { split: TrainingSplitType.BODY_PART, days: WEEKLY_TEMPLATES.BODY_PART },
];
