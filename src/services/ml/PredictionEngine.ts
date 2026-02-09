import { historyService, WorkoutRecord } from "@/services/history/HistoryService";

export type WorkoutPrediction = {
  estimatedDurationMin: number;
  estimatedCalories: number;
  estimatedPSE: number;
  confidence: number; // 0-100
};

export type WeightPrediction = {
  predictedWeightKg: number;
  daysInFuture: number;
  confidence: number; // 0-100
  trend: "descendo" | "subindo" | "estável";
};

export type OptimalWorkoutTime = {
  hour: number;
  reason: string;
  successRate: number; // 0-100
};

class PredictionEngine {
  /**
   * Prediz duração/calorias/PSE por tipo (heurística + histórico)
   */
  predictWorkout(type: WorkoutRecord["type"], targetDistanceKm?: number): WorkoutPrediction {
    const hist = historyService.getWorkoutsByType(type);

    if (hist.length < 3) {
      return {
        estimatedDurationMin: this.getDefaultDuration(type),
        estimatedCalories: this.getDefaultCalories(type),
        estimatedPSE: 7,
        confidence: 30,
      };
    }

    const avgDuration = hist.reduce((s, w) => s + (w.durationMinutes ?? w.durationMin ?? 0), 0) / hist.length;
    const avgCalories = hist.reduce((s, w) => s + (w.caloriesBurned ?? w.caloriesKcal ?? 0), 0) / hist.length;

    const pse = hist.filter((w) => typeof w.pse === "number");
    const avgPSE =
      pse.length > 0 ? pse.reduce((s, w) => s + (w.pse || 0), 0) / pse.length : 7;

    let estimatedDuration = avgDuration;
    let estimatedCalories = avgCalories;

    // ajuste por distância alvo (corrida/ciclismo)
    if (targetDistanceKm && (type === "corrida" || type === "ciclismo")) {
      const withDist = hist.filter((w) => (w.distanceMeters || 0) > 0);
      if (withDist.length >= 3) {
        const avgPaceMinPerKm =
          withDist.reduce((s, w) => {
            const km = (w.distanceMeters || 0) / 1000;
            return s + (km > 0 ? (w.durationMinutes ?? w.durationMin ?? 0) / km : 0);
          }, 0) / withDist.length;

        estimatedDuration = avgPaceMinPerKm * targetDistanceKm;

        // heurística kcal/km
        const kcalPerKm = type === "corrida" ? 65 : 45;
        estimatedCalories = kcalPerKm * targetDistanceKm;
      }
    }

    const confidence = Math.min(95, 30 + hist.length * 5);

    return {
      estimatedDurationMin: Math.max(5, Math.round(estimatedDuration)),
      estimatedCalories: Math.max(50, Math.round(estimatedCalories)),
      estimatedPSE: Math.round(avgPSE * 10) / 10,
      confidence,
    };
  }

  /**
   * Regressão linear simples em peso + R² como confiança
   */
  predictWeight(daysInFuture: number): WeightPrediction {
    const data = historyService.getWeightProgress();
    if (data.length < 2) {
      return { predictedWeightKg: 0, daysInFuture, confidence: 0, trend: "estável" };
    }

    const first = new Date(data[0].dateIso).getTime();
    const pts = data.map((d) => ({
      x: (new Date(d.dateIso).getTime() - first) / (1000 * 60 * 60 * 24),
      y: d.weightKg,
    }));

    const n = pts.length;
    const sumX = pts.reduce((s, p) => s + p.x, 0);
    const sumY = pts.reduce((s, p) => s + p.y, 0);
    const sumXY = pts.reduce((s, p) => s + p.x * p.y, 0);
    const sumX2 = pts.reduce((s, p) => s + p.x * p.x, 0);

    const denom = n * sumX2 - sumX * sumX;
    const m = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
    const b = (sumY - m * sumX) / n;

    const lastX = pts[pts.length - 1].x;
    const futureX = lastX + daysInFuture;
    const predicted = m * futureX + b;

    let trend: "descendo" | "subindo" | "estável" = "estável";
    if (m < -0.05) trend = "descendo";
    else if (m > 0.05) trend = "subindo";

    // R²
    const meanY = sumY / n;
    const ssTotal = pts.reduce((s, p) => s + Math.pow(p.y - meanY, 2), 0);
    const ssResidual = pts.reduce((s, p) => s + Math.pow(p.y - (m * p.x + b), 2), 0);
    const r2 = ssTotal > 0 ? 1 - ssResidual / ssTotal : 0;
    const confidence = Math.round(Math.max(0, Math.min(100, r2 * 100)));

    return {
      predictedWeightKg: Math.round(predicted * 10) / 10,
      daysInFuture,
      confidence,
      trend,
    };
  }

  /**
   * Melhor horário: combinação de frequência + menor PSE
   */
  findOptimalWorkoutTime(): OptimalWorkoutTime {
    const workouts = historyService.getAllWorkouts();
    if (workouts.length < 5) {
      return { hour: 18, reason: "Dados insuficientes. Sugestão padrão: 18h.", successRate: 50 };
    }

    type Bucket = { count: number; pseCount: number; pseSum: number };
    const buckets: Record<number, Bucket> = {};

    for (const w of workouts) {
      const h = new Date(w.dateIso).getHours();
      if (!buckets[h]) buckets[h] = { count: 0, pseCount: 0, pseSum: 0 };
      buckets[h].count++;
      if (typeof w.pse === "number") {
        buckets[h].pseCount++;
        buckets[h].pseSum += w.pse;
      }
    }

    const maxCount = Math.max(...Object.values(buckets).map((b) => b.count));
    let bestHour = 18;
    let bestScore = -1;
    let bestAvgPSE = 7;

    for (const hStr of Object.keys(buckets)) {
      const h = Number(hStr);
      const b = buckets[h];
      const avgPSE = b.pseCount > 0 ? b.pseSum / b.pseCount : 7;

      const freqScore = maxCount > 0 ? b.count / maxCount : 0; // 0..1
      const pseScore = Math.max(0, Math.min(1, (10 - avgPSE) / 10)); // 0..1

      const score = freqScore * 0.6 + pseScore * 0.4;
      if (score > bestScore) {
        bestScore = score;
        bestHour = h;
        bestAvgPSE = avgPSE;
      }
    }

    const successRate = Math.round(Math.max(35, Math.min(95, bestScore * 100)));
    const reason = `Melhor consistência e esforço percebido nesse horário (PSE médio ~${bestAvgPSE.toFixed(
      1
    )}).`;

    return { hour: bestHour, reason, successRate };
  }

  private getDefaultDuration(type: WorkoutRecord["type"]): number {
    switch (type) {
      case "corrida":
        return 45;
      case "ciclismo":
        return 60;
      case "musculacao":
        return 60;
      case "crossfit":
        return 50;
      case "funcional":
        return 45;
      default:
        return 45;
    }
  }

  private getDefaultCalories(type: WorkoutRecord["type"]): number {
    switch (type) {
      case "corrida":
        return 450;
      case "ciclismo":
        return 500;
      case "musculacao":
        return 350;
      case "crossfit":
        return 550;
      case "funcional":
        return 400;
      default:
        return 400;
    }
  }
}

export const predictionEngine = new PredictionEngine();
