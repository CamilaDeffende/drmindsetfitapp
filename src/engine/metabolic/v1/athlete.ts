import { AthleteAlertV1, MetabolicInputV1 } from "./types";
import { calcWeeklyEATAvgPerDay } from "./eat";

function makeAlert(code: AthleteAlertV1["code"], severity: AthleteAlertV1["severity"], message: string, action: string): AthleteAlertV1 {
  return { code, severity, message, action };
}

export function calcEAAlerts(input: MetabolicInputV1): AthleteAlertV1[] {
  const alerts: AthleteAlertV1[] = [];
  const isAthlete = (input.trainingFrequencyPerWeek >= 5 && input.trainingOverallIntensity !== "leve");

  if (!isAthlete) {
    alerts.push(makeAlert(
      "GENERAL_SAFETY_NOTE",
      "info",
      "Estimativas metabólicas são aproximações; calibração por resposta (14–21 dias) melhora precisão.",
      "Acompanhe peso médio semanal, fome (0–10), passos/NEAT e performance para ajustes finos."
    ));
    return alerts;
  }

  if (typeof input.ffmKg !== "number" || input.ffmKg <= 0) {
    alerts.push(makeAlert(
      "MISSING_FFM_FOR_EA",
      "warning",
      "Modo atleta: para estimar Energia Disponível (EA), é necessário informar FFM (massa magra).",
      "Informe FFM (bioimpedância/pregas confiáveis) ou use apenas calibração por resposta."
    ));
    return alerts;
  }

  if (typeof input.reportedIntakeKcalPerDay !== "number" || input.reportedIntakeKcalPerDay <= 0) {
    alerts.push(makeAlert(
      "MISSING_FFM_FOR_EA",
      "warning",
      "Modo atleta: para estimar EA, é necessária a ingestão energética reportada (kcal/dia).",
      "Informe ingestão média diária (kcal) para habilitar alerta de baixa Energia Disponível."
    ));
    return alerts;
  }

  const eat = calcWeeklyEATAvgPerDay(input.weightKg, input.weeklySessions);
  const exerciseKcal = eat.avgKcalPerDay;

  const ea = (input.reportedIntakeKcalPerDay - exerciseKcal) / input.ffmKg;

  if (ea < 30) {
    alerts.push(makeAlert(
      "EA_LOW_POSSIBLE",
      "high",
      `Possível baixa Energia Disponível (EA estimada ≈ ${ea.toFixed(1)} kcal/kg FFM/dia). Isso pode aumentar risco de problemas de saúde e performance.`,
      "Considere reduzir déficit, ajustar volume/recuperação e buscar avaliação profissional (médico/nutricionista)."
    ));
  } else {
    alerts.push(makeAlert(
      "GENERAL_SAFETY_NOTE",
      "info",
      `EA estimada ≈ ${ea.toFixed(1)} kcal/kg FFM/dia (estimativa).`,
      "Monitore sinais: queda de performance, fadiga, sono, humor e recuperação."
    ));
  }

  return alerts;
}
