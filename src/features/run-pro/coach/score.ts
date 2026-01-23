import type { RunMetrics, RunSample } from "@/features/run-pro/engine/types";

export type CoachScore = {
  score: number | null; // null quando insuficiente
  label: string;
  insights: string[];
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function sd(values: number[]): number | null {
  if (values.length < 6) return null;
  const mean = values.reduce((x, y) => x + y, 0) / values.length;
  const v = values.reduce((acc, x) => acc + (x - mean) ** 2, 0) / values.length;
  return Math.sqrt(v);
}


export function computeCoachScore(samples: RunSample[], metrics?: RunMetrics | null): CoachScore {
  if (!samples || samples.length < 8) return { score: null, label: "Dados insuficientes", insights: ["Comece a gravar para gerar insights."] };

  const paces = samples
    .map((s) => s.paceSecPerKm)
    .filter((x): x is number => typeof x === "number" && Number.isFinite(x) && x > 0);

  const paceSd = sd(paces);
  const paceStability = paceSd == null ? null : clamp(1 - paceSd / 60, 0, 1); // SD 0..60s
  const stabilityScore = paceStability == null ? null : Math.round(paceStability * 40); // 0-40

  // splits simples (por km) via distTotalM
  const splitPaces: number[] = [];
  let lastKm = 0;
  let lastTs = samples[0].ts;
  for (let i = 1; i < samples.length; i++) {
    const d = samples[i].distTotalM;
    if (d >= (lastKm + 1) * 1000) {
      const ts = samples[i].ts;
      const dt = (ts - lastTs) / 1000;
      splitPaces.push(dt); // tempo por km (sec)
      lastKm += 1;
      lastTs = ts;
      if (splitPaces.length >= 12) break;
    }
  }
  const splitSd = sd(splitPaces);
  const splitReg = splitSd == null ? null : clamp(1 - splitSd / 90, 0, 1); // SD 0..90s
  const splitScore = splitReg == null ? null : Math.round(splitReg * 25); // 0-25

  // qualidade GPS: usa rejects/accepts quando tiver
  const accepts = metrics?.gpsAccepts ?? 0;
  const rejects = metrics?.gpsRejects ?? 0;
  const total = accepts + rejects;
  const rejectRate = total > 0 ? rejects / total : 0;
  const gpsQuality = clamp(1 - rejectRate, 0, 1);
  const gpsScore = Math.round(gpsQuality * 20); // 0-20

  // pausas vs moving (se existir movingTimeMs/elapsedMs)
  const moving = metrics?.movingTimeMs ?? 0;
  const elapsed = metrics?.elapsedMs ?? 0;
  const movingRatio = elapsed > 0 ? moving / elapsed : 1;
  const pauseScore = Math.round(clamp(movingRatio, 0, 1) * 15); // 0-15

  const parts = [stabilityScore, splitScore, gpsScore, pauseScore].filter((x) => typeof x === "number") as number[];
  const sum = parts.reduce((a, b) => a + b, 0);
  const score = clamp(sum, 0, 100);

  let label = "Bom";
  if (score >= 85) label = "Elite";
  else if (score >= 70) label = "Muito bom";
  else if (score >= 55) label = "Bom";
  else label = "Ajustar";

  const insights: string[] = [];

  if (paceSd != null) {
    if (paceSd < 18) insights.push("Ritmo muito estável.");
    else if (paceSd < 35) insights.push("Boa consistência de ritmo.");
    else insights.push("Ritmo oscilando — tente manter constância.");
  } else {
    insights.push("Mais dados para avaliar ritmo.");
  }

  if (splitSd != null) {
    if (splitSd < 35) insights.push("Splits regulares (boa estratégia).");
    else insights.push("Splits irregulares — ajuste saída e controle.");
  }

  if (total > 0) {
    if (rejectRate < 0.08) insights.push("Sinal GPS estável.");
    else insights.push("Sinal GPS oscilou — evite áreas fechadas/sombra.");
  }

  if (elapsed > 0) {
    if (movingRatio > 0.92) insights.push("Poucas pausas, ótima fluidez.");
    else insights.push("Muitas pausas — tente blocos contínuos.");
  }

  return { score, label, insights: insights.slice(0, 3) };
}
