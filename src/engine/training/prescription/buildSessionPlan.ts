import { SessionFocus } from "../core/enums";
import { SessionPlan, TrainingProfile } from "../core/types";
import { assignSetRepSchemes } from "./assignSetRepSchemes";
import { selectExercises } from "./selectExercises";

export function buildSessionPlan(dayIndex: number, focus: SessionFocus, profile: TrainingProfile): SessionPlan {
  const selected = selectExercises(focus, profile);
  const exercises = assignSetRepSchemes(selected, profile);

  return {
    name: `Sessão ${dayIndex} - ${focus}`,
    dayIndex,
    focus,
    estimatedDurationMin: Math.min(profile.sessionDurationMin, Math.max(30, exercises.length * 12)),
    exercises,
    rationale: [
      `Sessão construída para foco ${focus}.`,
      "Exercícios escolhidos por compatibilidade com equipamento, padrão motor e objetivo.",
    ],
  };
}
