import { useEffect, useMemo, useState } from "react";
import { adaptiveEngine, AdaptiveRecommendation, PerformanceMetrics } from "@/services/ai/AdaptiveEngine";
import { predictionEngine, WorkoutPrediction, WeightPrediction } from "@/services/ml/PredictionEngine";
import { WorkoutType } from "@/services/history/HistoryService";

export function useAI() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(() => adaptiveEngine.computeMetrics(new Date()));
  const [recs, setRecs] = useState<AdaptiveRecommendation[]>(() => adaptiveEngine.getRecommendations(new Date()));
  const [weightPred, setWeightPred] = useState<WeightPrediction>(() => predictionEngine.predictWeight());

  useEffect(() => {
    const now = new Date();
    setMetrics(adaptiveEngine.computeMetrics(now));
    setRecs(adaptiveEngine.getRecommendations(now));
    setWeightPred(predictionEngine.predictWeight());
  }, []);

  const predictWorkout = (type: WorkoutType, distanceKm?: number): WorkoutPrediction =>
    predictionEngine.predictWorkout(type, distanceKm);

  const bestHour = useMemo(() => ({
    corrida: { hour: 7, confidence01: 0.25 },
    musculacao: { hour: 7, confidence01: 0.25 },
    ciclismo: { hour: 7, confidence01: 0.25 },
  }), []);

  return { metrics, recs, weightPred, predictWorkout, bestHour };
}
