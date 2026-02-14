/**
 * Active Training Bridge (SSOT-first, defensive fallbacks)
 * Goal: Provide Planos Ativos a stable, non-breaking view-model.
 * Rule: No pain/injury/medical content.
 */
export type MFTrainingDay =
  | "SEG" | "TER" | "QUA" | "QUI" | "SEX" | "SAB" | "DOM";

export type MFTrainingSummary = {
  id: string;
  modality: string;
  level?: string;
  intensity?: string;
  days?: MFTrainingDay[];
  note?: string;
};

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

function normDay(d: any): MFTrainingDay | null {
  const s = String(d || "").trim().toUpperCase();
  const map: Record<string, MFTrainingDay> = {
    "SEGUNDA": "SEG", "SEG": "SEG",
    "TERCA": "TER", "TERÇA": "TER", "TER": "TER",
    "QUARTA": "QUA", "QUA": "QUA",
    "QUINTA": "QUI", "QUI": "QUI",
    "SEXTA": "SEX", "SEX": "SEX",
    "SABADO": "SAB", "SÁBADO": "SAB", "SAB": "SAB",
    "DOMINGO": "DOM", "DOM": "DOM",
  };
  return map[s] || null;
}

/**
 * SSOT key expected in this project: mf:activePlan:v1
 * Tolerant: will not throw.
 */
export function getActiveTrainingSummaries(): MFTrainingSummary[] {
  // 1) SSOT activePlan
  const ap = safeJsonParse<any>(typeof window !== "undefined" ? localStorage.getItem("mf:activePlan:v1") : null);
  const fromAP = ap?.activities || ap?.modalities || ap?.training?.activities || ap?.training?.modalities;

  const arr: any[] = Array.isArray(fromAP) ? fromAP : [];

  const mappedFromAP: MFTrainingSummary[] = arr.map((x, idx) => {
    const daysRaw = x?.days || x?.weekDays || x?.schedule?.days || [];
    const days = (Array.isArray(daysRaw) ? daysRaw : [])
      .map(normDay)
      .filter(Boolean) as MFTrainingDay[];

    const modality = String(x?.name || x?.modality || x?.type || "Atividade").trim() || "Atividade";
    const level = x?.level ? String(x.level) : undefined;
    const intensity = x?.intensity ? String(x.intensity) : (x?.effort ? String(x.effort) : undefined);

    return {
      id: String(x?.id || `${modality}-${idx}`),
      modality,
      level,
      intensity,
      days: days.length ? days : undefined,
      note: "Plano ativo e alinhado ao seu objetivo.",
    };
  }).filter(Boolean);

  if (mappedFromAP.length) return mappedFromAP;

  // 2) Fallback: onboarding progress (common keys)
  const prog =
    safeJsonParse<any>(typeof window !== "undefined" ? localStorage.getItem("mf:onboarding:progress:v1") : null) ||
    safeJsonParse<any>(typeof window !== "undefined" ? localStorage.getItem("mf:onboardingProgress:v1") : null) ||
    safeJsonParse<any>(typeof window !== "undefined" ? localStorage.getItem("onboardingProgress") : null);

  const mods: any[] = Array.isArray(prog?.modalidades) ? prog.modalidades
    : Array.isArray(prog?.atividadesFisicas) ? prog.atividadesFisicas
    : Array.isArray(prog?.activities) ? prog.activities
    : [];

  return mods.map((m, idx) => {
    const modality = String(m?.name || m?.modality || m?.type || m || "Atividade").trim() || "Atividade";
    return {
      id: String(m?.id || `${modality}-${idx}`),
      modality,
      level: m?.level ? String(m.level) : (prog?.nivel ? String(prog.nivel) : undefined),
      intensity: m?.intensity ? String(m.intensity) : (prog?.intensidade ? String(prog.intensidade) : undefined),
      days: undefined,
      note: "Atividade ativa detectada. Ajuste fino disponível no plano.",
    };
  });
}
