import { useState, useEffect } from "react";
import { adaptiveEngine, AdaptiveRecommendation, PerformanceMetrics } from "@/services/ai/AdaptiveEngine";
import { predictionEngine, WorkoutPrediction, WeightPrediction, OptimalWorkoutTime } from "@/services/ml/PredictionEngine";
import { WorkoutRecord } from "@/services/history/HistoryService";

export function useAI() {
  const [recommendations, setRecommendations] = useState<AdaptiveRecommendation[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = () => {
    setLoading(true);
    try {
      const recs = adaptiveEngine.generateRecommendations();
      const perf = adaptiveEngine.analyzePerformance();
      setRecommendations(recs);
      setMetrics(perf);
    } catch (e) {
      console.error("Erro ao carregar IA:", e);
    } finally {
      setLoading(false);
    }
  };

  const predictWorkout = (type: WorkoutRecord["type"], distanceKm?: number): WorkoutPrediction =>
    predictionEngine.predictWorkout(type, distanceKm);

  const predictWeight = (daysInFuture: number): WeightPrediction =>
    predictionEngine.predictWeight(daysInFuture);

  const getOptimalWorkoutTime = (): OptimalWorkoutTime =>
    predictionEngine.findOptimalWorkoutTime();

  const getOvertrainingRisk = () => adaptiveEngine.predictOvertrainingRisk();

  const getRecoveryPlan = (riskLevel: "baixo" | "moderado" | "alto" | "crítico") =>
    adaptiveEngine.generateRecoveryPlan(riskLevel);

  return {
    recommendations,
    metrics,
    loading,
    predictWorkout,
    predictWeight,
    getOptimalWorkoutTime,
    getOvertrainingRisk,
    getRecoveryPlan,
    refresh,
  };
}
