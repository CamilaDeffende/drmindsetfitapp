/**
 * trainingPlan.ssot.ts
 * Normaliza e gera um "training plan" mínimo dentro do SSOT (mf:activePlan:v1)
 * Regras:
 * - Não fala de dor/lesão
 * - Defensivo: se não tiver modalidade/dias/intensidade, cria defaults suaves
 */
export type MFDay = "SEG" | "TER" | "QUA" | "QUI" | "SEX" | "SAB" | "DOM";

export type MFWorkoutItem = {
  day: MFDay;
  modality: string;
  title: string;      // Ex: "Base + Técnica", "Força Full Body A"
  intensity: string;  // Ex: "Leve", "Moderada", "Alta"
  level: string;      // Ex: "Iniciante", "Intermediário", "Avançado"
  durationMin?: number;
  focus?: string;
};

const ALL_DAYS: MFDay[] = ["SEG","TER","QUA","QUI","SEX","SAB","DOM"];

function to3(d: any): string {
  return String(d ?? "").trim().slice(0, 3).toUpperCase();
}

function isMFDay(x: any): x is MFDay {
  return ALL_DAYS.includes(x as MFDay);
}


function pickDays(n: number): MFDay[] {
  const base: MFDay[] = ["SEG","QUA","SEX","SAB","TER","QUI","DOM"];
  return base.slice(0, Math.max(1, Math.min(7, n)));
}

function defaultTitle(modality: string, idx: number) {
  const m = modality.toLowerCase();
  if (m.includes("corrida")) return idx % 2 === 0 ? "Base + Técnica" : "Ritmo controlado";
  if (m.includes("bike") || m.includes("cicl")) return idx % 2 === 0 ? "Endurance" : "Intervalado controlado";
  if (m.includes("cross")) return idx % 2 === 0 ? "Força + MetCon" : "Engine";
  if (m.includes("func")) return idx % 2 === 0 ? "Full Body" : "Condicionamento";
  return idx % 2 === 0 ? "Força Full Body A" : "Força Full Body B";
}

function defaultFocus(modality: string) {
  const m = modality.toLowerCase();
  if (m.includes("corrida")) return "Economia + consistência";
  if (m.includes("bike") || m.includes("cicl")) return "Base aeróbia + cadência";
  if (m.includes("cross")) return "Capacidade de trabalho";
  if (m.includes("func")) return "Aptidão geral";
  return "Hipertrofia/força";
}

function normalizeStr(x: any, fallback: string) {
  const s = String(x ?? "").trim();
  return s ? s : fallback;
}

export function ensureTrainingPlanInActivePlan(activePlan: any): any {
  if (!activePlan || typeof activePlan !== "object") return activePlan;

  const activities = Array.isArray(activePlan.activities) ? activePlan.activities
    : Array.isArray(activePlan.modalities) ? activePlan.modalities
    : Array.isArray(activePlan?.training?.activities) ? activePlan.training.activities
    : Array.isArray(activePlan?.training?.modalities) ? activePlan.training.modalities
    : [];

  const normalizedActs = activities.map((a: any) => {
    const modality = normalizeStr(a?.name || a?.modality || a?.type || a, "Atividade");
    const level = normalizeStr(a?.level, normalizeStr(activePlan?.level, "Auto"));
    const intensity = normalizeStr(a?.intensity || a?.effort, normalizeStr(activePlan?.intensity, "Auto"));
    const daysRaw = a?.days || a?.weekDays || a?.schedule?.days;
    const days: MFDay[] = (Array.isArray(daysRaw) && daysRaw.length)
      ? (daysRaw
          .map(to3)
          .filter(isMFDay) as MFDay[])
      : pickDays(3);
return { modality, level, intensity, days };
  });

  // Se ainda não tem nada, não inventa modalidades: só cria training vazio
  if (!normalizedActs.length) {
    activePlan.training = activePlan.training || {};
    activePlan.training.workouts = activePlan.training.workouts || [];
    return activePlan;
  }

  // Cria workouts por dia/modality (mínimo)
  const workouts: MFWorkoutItem[] = [];
  for (const act of normalizedActs) {
    act.days.forEach((day: MFDay, idx: number) => {
      workouts.push({
        day,
        modality: act.modality,
        level: act.level,
        intensity: act.intensity,
        title: defaultTitle(act.modality, idx),
        durationMin: act.modality.toLowerCase().includes("corrida") ? 35 : 45,
        focus: defaultFocus(act.modality),
      });
    });
  }

  activePlan.training = activePlan.training || {};
  activePlan.training.workouts = workouts;
  activePlan.training.activitiesNormalized = normalizedActs;

  return activePlan;
}
