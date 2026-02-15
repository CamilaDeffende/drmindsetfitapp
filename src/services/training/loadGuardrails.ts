/**
 * DrMindsetFit — Training Load Guardrails (base)
 * Prevents overtraining risk using simple 7-day rolling load heuristics.
 */
export type LoadWarningCode = "OVERREACHING" | "OVERTRAINING_RISK" | "LOW_RECOVERY_DATA";

export type LoadWarning = { code: LoadWarningCode; message: string };

export type LoadInputs = {
  last7dSessions?: number;
  last7dAvgRPE?: number; // 0..10
  last7dMinutes?: number;
  sorenessScore?: number; // 0..10 (optional)
  sleepScore?: number; // 0..10 (optional)
};

export type LoadResult = {
  risk: "low" | "moderate" | "high";
  warnings: LoadWarning[];
  trace: Record<string, unknown>;
};

export function assessTrainingLoad(inp: LoadInputs): LoadResult {
  const warnings: LoadWarning[] = [];
  const trace: Record<string, unknown> = { inp };

  const sessions = inp.last7dSessions ?? 0;
  const rpe = inp.last7dAvgRPE ?? 0;
  const minutes = inp.last7dMinutes ?? 0;

  if (!inp.last7dSessions || !inp.last7dAvgRPE || !inp.last7dMinutes) {
    warnings.push({ code: "LOW_RECOVERY_DATA", message: "Dados insuficientes para avaliação completa de carga/recuperação." });
  }

  // Simple load index
  const loadIndex = sessions * rpe * (minutes / Math.max(1, sessions)) / 60; // scaled
  trace["loadIndex"] = loadIndex;

  let risk: LoadResult["risk"] = "low";
  if (loadIndex > 30) risk = "moderate";
  if (loadIndex > 45) risk = "high";

  // Extra heuristics with soreness/sleep (optional)
  const sore = inp.sorenessScore ?? 0;
  const sleep = inp.sleepScore ?? 0;
  if (risk !== "low" && sore >= 7) warnings.push({ code: "OVERREACHING", message: "Sinais de excesso de carga (dor muscular alta). Considere deload." });
  if (risk === "high" && sleep <= 4) warnings.push({ code: "OVERTRAINING_RISK", message: "Risco aumentado de overtraining (carga alta + sono baixo)." });

  return { risk, warnings, trace };
}
