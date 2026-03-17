import { FeedbackAnalysis } from "../core/types";

export function shouldDeload(analysis: FeedbackAnalysis): boolean {
  return analysis.recoveryTrend < 40 || analysis.fatigueTrend > 75 || (analysis.adherenceTrend < 50 && analysis.fatigueTrend > 65);
}
