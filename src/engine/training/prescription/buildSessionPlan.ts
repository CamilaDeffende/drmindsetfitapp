import { TrainingSession } from "../core/types";
import { safePlanId } from "../core/utils";
import { assignSetRepSchemes } from "./assignSetRepSchemes";
import { selectExercises } from "./selectExercises";
import { SessionTemplate, TrainingProfile } from "../core/types";

export function buildSessionPlan(template: SessionTemplate, profile: TrainingProfile): TrainingSession {
  const selected = selectExercises(template.requiredPatterns, profile);
  const exercises = assignSetRepSchemes(selected, profile);
  const estimatedDurationMin = Math.min(profile.sessionDurationMin, template.targetDurationMin);

  return {
    id: safePlanId(),
    name: template.name,
    focus: template.focus,
    estimatedDurationMin,
    exercises,
    rationale: `sessão construída para ${template.focus.toLowerCase()} com ${exercises.length} exercícios`,
  };
}
