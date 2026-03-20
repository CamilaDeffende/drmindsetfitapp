import { getTrainingReadinessSnapshot } from "@/services/training/trainingReadiness.service";
import { AdaptationDecision, TrainingFeedbackInput, TrainingPlan } from "../core/types";
import { AdaptationAction } from "../core/enums";
import { analyzeTrainingFeedback } from "./analyzeTrainingFeedback";
import { calculateAdherenceTrend } from "./calculateAdherenceTrend";
import { calculateFatigueTrend } from "./calculateFatigueTrend";
import { compressSessionForTime } from "./compressSessionForTime";
import { rebalanceWeek } from "./rebalanceWeek";
import { swapExerciseVariant } from "./swapExerciseVariant";

export function adaptTrainingPlan(plan: TrainingPlan, feedback: TrainingFeedbackInput): { plan: TrainingPlan; decision: AdaptationDecision } {
  const normalized = analyzeTrainingFeedback(feedback);
  const readiness = getTrainingReadinessSnapshot();
  const fatigueTrend = calculateFatigueTrend();
  const adherenceTrend = calculateAdherenceTrend();

  let adapted = structuredClone(plan);
  const actions: AdaptationDecision["actions"] = [];
  const rationale: string[] = [];

  let loadAdj = 0;
  let volumeAdj = 0;

  if (normalized.timeConstraintMin > 0 && normalized.timeConstraintMin < 45) {
    adapted = compressSessionForTime(adapted, normalized.timeConstraintMin);
    actions.push(AdaptationAction.COMPRESS_TIME);
    volumeAdj -= 10;
    rationale.push("Tempo disponível reduzido exigiu compressão da sessão.");
  }

  if (normalized.flaggedExercises.length) {
    adapted = swapExerciseVariant(adapted, normalized.flaggedExercises);
    actions.push(AdaptationAction.SWAP_EXERCISE);
    rationale.push("Feedback do usuário sinalizou necessidade de troca de exercício.");
  }

  if (readiness.recommendation === "progress" && fatigueTrend < 40 && adherenceTrend >= 80) {
    actions.push(AdaptationAction.PROGRESS);
    loadAdj += 2.5;
    rationale.push("Prontidão alta com boa aderência permite progressão controlada.");
  } else if (readiness.recommendation === "deload" || fatigueTrend >= 70) {
    actions.push(AdaptationAction.DELOAD);
    actions.push(AdaptationAction.REDUCE_LOAD);
    actions.push(AdaptationAction.REDUCE_VOLUME);
    loadAdj -= 10;
    volumeAdj -= 20;
    adapted = rebalanceWeek(adapted);
    rationale.push("Fadiga e prontidão baixa indicam deload tático.");
  } else {
    actions.push(AdaptationAction.MAINTAIN);
    rationale.push("Contexto atual sustenta manutenção do plano com monitoramento.");
  }

  adapted.rationale.push(...rationale);
  adapted.version += 1;

  return {
    plan: adapted,
    decision: {
      actions,
      recommendedLoadAdjustmentPct: loadAdj,
      recommendedVolumeAdjustmentPct: volumeAdj,
      rationale,
      confidence: readiness.level === "high" ? 0.84 : readiness.level === "low" ? 0.88 : 0.76,
    },
  };
}
