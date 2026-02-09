
import { historyService } from "@/services/history/HistoryService";

export type AdaptiveRecommendation = {
  type: "warning" | "success" | "info" | "adjustment";
  title: string;
  message: string;
  action?: { label: string; handler: () => void };
};

export type PerformanceMetrics = {
  workoutFrequency: number;
  averagePSE: number;
  recoveryScore: number;
  progressionRate: number;
  adherenceRate: number;
  fatigueLevel: number;
};

export type TrainingAdjustment = {
  volumeChange: number;
  intensityChange: number;
  recommendedRestDays: number;
  deloadNeeded: boolean;
  reason: string;
};

class AdaptiveEngine {
  analyzePerformance(): PerformanceMetrics {
    const last7 = new Date();
    last7.setDate(last7.getDate() - 7);
    const startDate = last7.toISOString().split("T")[0];
    const endDate = new Date().toISOString().split("T")[0];

    const workouts = historyService.getWorkoutsByDateRange(startDate, endDate);
    const workoutFrequency = workouts.length;

    const pseWorkouts = workouts.filter((w) => w.pse !== undefined);
    const averagePSE =
      pseWorkouts.length > 0
        ? pseWorkouts.reduce((sum, w) => sum + (w.pse || 0), 0) / pseWorkouts.length
        : 5;

    let recoveryScore = 100;
    if (averagePSE > 8) recoveryScore -= 30;
    if (averagePSE > 9) recoveryScore -= 20;
    if (workoutFrequency > 6) recoveryScore -= 20;
    if (workoutFrequency > 5 && averagePSE > 7) recoveryScore -= 15;
    recoveryScore = Math.max(0, Math.min(100, recoveryScore));

    const last14 = new Date();
    last14.setDate(last14.getDate() - 14);
    const workouts14 = historyService.getWorkoutsByDateRange(
      last14.toISOString().split("T")[0],
      last7.toISOString().split("T")[0]
    );

    const avgDuration7 =
      workouts.length > 0 ? workouts.reduce((sum, w) => sum  + (w.durationMinutes ?? w.durationMin ?? 0), 0) / workouts.length : 0;
    const avgDuration14 =
      workouts14.length > 0 ? workouts14.reduce((sum, w) => sum  + (w.durationMinutes ?? w.durationMin ?? 0), 0) / workouts14.length : 0;

    const progressionRate = avgDuration14 > 0 ? ((avgDuration7 - avgDuration14) / avgDuration14) * 100 : 0;

    const expectedWorkouts = 5;
    const adherenceRate = Math.min(100, (workoutFrequency / expectedWorkouts) * 100);

    let fatigueLevel = 0;
    if (averagePSE > 8) fatigueLevel += 40;
    if (workoutFrequency > 6) fatigueLevel += 30;
    if (recoveryScore < 50) fatigueLevel += 30;
    fatigueLevel = Math.min(100, fatigueLevel);

    return {
      workoutFrequency,
      averagePSE: Math.round(averagePSE * 10) / 10,
      recoveryScore: Math.round(recoveryScore),
      progressionRate: Math.round(progressionRate * 10) / 10,
      adherenceRate: Math.round(adherenceRate),
      fatigueLevel: Math.round(fatigueLevel),
    };
  }

  generateTrainingAdjustment(m: PerformanceMetrics): TrainingAdjustment {
    let volumeChange = 0;
    let intensityChange = 0;
    let recommendedRestDays = 1;
    let deloadNeeded = false;
    let reason = "";

    if (m.fatigueLevel > 70) {
      volumeChange = -20;
      intensityChange = -15;
      recommendedRestDays = 2;
      deloadNeeded = true;
      reason = "Fadiga elevada detectada. Reduzindo volume e intensidade para recuperação.";
    } else if (m.recoveryScore < 50) {
      volumeChange = -10;
      intensityChange = -10;
      recommendedRestDays = 2;
      reason = "Recuperação inadequada. Priorizando descanso.";
    } else if (m.averagePSE > 9) {
      volumeChange = -15;
      intensityChange = -20;
      deloadNeeded = true;
      reason = "Esforço percebido muito alto. Semana de deload recomendada.";
    } else if (m.recoveryScore > 80 && m.adherenceRate > 90 && m.progressionRate > 5) {
      volumeChange = 10;
      intensityChange = 5;
      reason = "Excelente recuperação e progressão. Aumentando carga de treino.";
    } else if (m.recoveryScore > 70 && m.progressionRate < 2 && m.adherenceRate > 80) {
      volumeChange = 0;
      intensityChange = 10;
      reason = "Recuperação boa mas progressão lenta. Aumentando intensidade.";
    } else if (m.adherenceRate < 60) {
      volumeChange = 0;
      intensityChange = 0;
      recommendedRestDays = 1;
      reason = "Aderência baixa. Foque em consistência antes de aumentar carga.";
    } else {
      volumeChange = 5;
      intensityChange = 0;
      reason = "Performance estável. Progressão gradual mantida.";
    }

    return { volumeChange, intensityChange, recommendedRestDays, deloadNeeded, reason };
  }

  generateRecommendations(): AdaptiveRecommendation[] {
    const metrics = this.analyzePerformance();
    const adj = this.generateTrainingAdjustment(metrics);
    const recs: AdaptiveRecommendation[] = [];

    if (adj.deloadNeeded) {
      recs.push({ type: "warning", title: "🛑 Semana de Deload Recomendada", message: adj.reason });
    } else if (adj.volumeChange > 0) {
      recs.push({ type: "success", title: "📈 Progresso Detectado", message: adj.reason });
    } else if (adj.volumeChange < 0) {
      recs.push({ type: "warning", title: "⚠️ Ajuste Necessário", message: adj.reason });
    } else {
      recs.push({ type: "info", title: "✅ Treino Mantido", message: adj.reason });
    }

    if (metrics.fatigueLevel > 70) {
      recs.push({
        type: "warning",
        title: "😴 Fadiga Elevada",
        message: `Nível de fadiga: ${metrics.fatigueLevel}/100. Priorize sono (7-9h) e nutrição adequada.`,
      });
    }

    if (metrics.adherenceRate < 70) {
      recs.push({
        type: "info",
        title: "🎯 Aderência Baixa",
        message: `Aderência: ${metrics.adherenceRate}%. Tente treinar ~${adj.recommendedRestDays + 3}-${adj.recommendedRestDays + 4}x/semana.`,
      });
    }

    if (metrics.recoveryScore > 80 && metrics.averagePSE < 7) {
      recs.push({ type: "success", title: "💪 Recuperação Excelente", message: "Você está recuperando muito bem! Considere aumentar a intensidade." });
    }

    const weight = historyService.getWeightProgress();
    if (weight.length >= 2) {
      const recent = weight.slice(-2);
      const change = recent[1].weightKg - recent[0].weightKg;
      if (Math.abs(change) > 0.5) {
        recs.push({
          type: "info",
          title: change < 0 ? "📉 Peso Reduzindo" : "📈 Peso Aumentando",
          message: `Mudança de ${Math.abs(change).toFixed(1)}kg na última semana. ${
            change < -1 ? "Cuidado: perda muito rápida pode indicar déficit excessivo." :
            change > 1 ? "Ganho rápido: verifique se está alinhado ao objetivo." :
            "Mudança gradual e saudável."
          }`,
        });
      }
    }

    return recs;
  }

  predictOvertrainingRisk(): { riskLevel: "baixo" | "moderado" | "alto" | "crítico"; riskScore: number; factors: string[] } {
    const m = this.analyzePerformance();
    let score = 0;
    const factors: string[] = [];

    if (m.fatigueLevel > 80) { score += 40; factors.push("Fadiga crítica"); }
    else if (m.fatigueLevel > 60) { score += 25; factors.push("Fadiga elevada"); }

    if (m.averagePSE > 9) { score += 30; factors.push("Esforço percebido muito alto"); }
    else if (m.averagePSE > 8) { score += 15; factors.push("Esforço percebido alto"); }

    if (m.workoutFrequency > 6) { score += 20; factors.push("Frequência de treino muito alta"); }

    if (m.recoveryScore < 40) { score += 30; factors.push("Recuperação inadequada"); }
    else if (m.recoveryScore < 60) { score += 15; factors.push("Recuperação abaixo do ideal"); }

    if (m.progressionRate < -10) { score += 20; factors.push("Performance declinando"); }

    let riskLevel: "baixo" | "moderado" | "alto" | "crítico";
    if (score >= 80) riskLevel = "crítico";
    else if (score >= 60) riskLevel = "alto";
    else if (score >= 40) riskLevel = "moderado";
    else riskLevel = "baixo";

    return { riskLevel, riskScore: Math.min(100, score), factors };
  }

  generateRecoveryPlan(risk: "baixo" | "moderado" | "alto" | "crítico"): {
    title: string; duration: string; activities: string[]; nutrition: string[]; sleep: string;
  } {
    switch (risk) {
      case "crítico":
        return {
          title: "Recuperação Intensiva",
          duration: "7-10 dias",
          activities: ["Pausa de treinos intensos", "Caminhadas leves (20-30min)", "Alongamento suave diário", "Yoga restaurativo", "Foam rolling/massagem"],
          nutrition: ["Proteína ~2.2g/kg", "Carbo moderado (glicogênio)", "Ômega-3", "Vitamina D + magnésio", "Hidratação >3L/dia"],
          sleep: "9-10h/noite + cochilos",
        };
      case "alto":
        return {
          title: "Deload Ativo",
          duration: "5-7 dias",
          activities: ["Reduzir volume ~50%", "Reduzir intensidade ~40%", "Foco em técnica/mobilidade", "Natação ou yoga 2x/sem", "Caminhadas ao ar livre"],
          nutrition: ["Proteína ~2.0g/kg", "Carbo em torno do treino", "Frutas/vegetais", "Reduzir ultraprocessados/açúcar"],
          sleep: "8-9h/noite",
        };
      case "moderado":
        return {
          title: "Ajuste de Carga",
          duration: "3-5 dias",
          activities: ["Reduzir volume ~30%", "Manter intensidade moderada", "1-2 dias treino leve", "Alongamento pós-treino"],
          nutrition: ["Proteína ~1.8g/kg", "Carbo adequado", "Básicos: whey/creatina (se já usa)"],
          sleep: "7-8h/noite",
        };
      default:
        return {
          title: "Manutenção Normal",
          duration: "Contínuo",
          activities: ["Treinos conforme planejado", "1 dia de descanso ativo/semana", "Alongamento regular"],
          nutrition: ["Dieta conforme macros", "Hidratação adequada"],
          sleep: "7-8h/noite",
        };
    }
  }
}

export const adaptiveEngine = new AdaptiveEngine();
