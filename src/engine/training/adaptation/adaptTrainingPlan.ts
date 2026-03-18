import { FeedbackAnalysis, TrainingPlan } from "../core/types";
import { compressSessionForTime } from "./compressSessionForTime";
import { rebalanceWeek } from "./rebalanceWeek";

export function adaptTrainingPlan(plan: TrainingPlan, analysis: FeedbackAnalysis): TrainingPlan {
  let next = { ...plan };

  if (analysis.shouldReduceVolume) {
    next = {
      ...next,
      sessions: next.sessions.map((session) => ({
        ...session,
        exercises: session.exercises.map((exercise, index) => ({
          ...exercise,
          sets: Math.max(2, exercise.sets - (index === 0 ? 0 : 1)),
        })),
      })),
      rationale: [...next.rationale, "volume reduzido por recuperação/fadiga"],
    };
  }

  if (analysis.shouldCompressTime) {
    next = compressSessionForTime(next);
  }

  return rebalanceWeek(next);
}
