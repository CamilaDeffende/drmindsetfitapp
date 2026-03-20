type AnyObj = Record<string, any>;

export type MuscleFatigueSnapshot = {
  muscleGroup: string;
  sessions: number;
  sets: number;
  load: number;
  fatigueScore: number;
  status: "low" | "moderate" | "high";
};

export type MicrocycleDeloadSnapshot = {
  microcycleLengthDays: number;
  completedSessions: number;
  avgAdherencePct: number;
  avgReadinessScore: number;
  deloadRecommended: boolean;
  deloadReason: string;
  suggestedVolumeReductionPct: number;
};

function safeArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function isObject(value: unknown): value is AnyObj {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function readActivePlan(): AnyObj | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("mf:activePlan:v1");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getExecutionStore(): AnyObj {
  const ap = readActivePlan();
  const execution = ap?.training?.execution;
  return isObject(execution) ? execution : {};
}

function getPerformedSessions(): AnyObj[] {
  const store = getExecutionStore();
  const items = safeArray<AnyObj>(store.sessionsHistory ?? store.completedSessions ?? []);
  return items.filter(isObject);
}

function normalizeGroupName(value: unknown): string {
  const s = String(value ?? "").trim();
  return s || "geral";
}

function classifyFatigue(score: number): "low" | "moderate" | "high" {
  if (score >= 75) return "high";
  if (score >= 40) return "moderate";
  return "low";
}

export function getMuscleFatigueSnapshots(windowDays = 10): MuscleFatigueSnapshot[] {
  const sessions = getPerformedSessions();
  const now = Date.now();
  const cutoff = now - windowDays * 24 * 60 * 60 * 1000;

  const grouped = new Map<string, { sessions: number; sets: number; load: number }>();

  for (const s of sessions) {
    const endedAt = new Date(String(s?.endedAt ?? s?.completedAt ?? s?.date ?? 0)).getTime();
    if (Number.isFinite(endedAt) && endedAt < cutoff) continue;

    const exercises = safeArray<AnyObj>(s?.exercises);
    const touched = new Set<string>();

    for (const ex of exercises) {
      const muscleGroup = normalizeGroupName(ex?.muscleGroup ?? ex?.group ?? ex?.target);
      const sets = safeArray<AnyObj>(ex?.performedSets).length || Number(ex?.completedSets ?? 0) || 0;
      const load = safeArray<AnyObj>(ex?.performedSets).reduce((acc, set) => {
        const kg = Number(set?.loadKg ?? set?.carga ?? 0) || 0;
        const reps = Number(set?.reps ?? set?.repeticoes ?? 0) || 0;
        return acc + kg * Math.max(reps, 1);
      }, 0);

      const prev = grouped.get(muscleGroup) ?? { sessions: 0, sets: 0, load: 0 };
      prev.sets += sets;
      prev.load += load;
      grouped.set(muscleGroup, prev);
      touched.add(muscleGroup);
    }

    for (const mg of touched) {
      const prev = grouped.get(mg)!;
      prev.sessions += 1;
      grouped.set(mg, prev);
    }
  }

  return Array.from(grouped.entries())
    .map(([muscleGroup, data]) => {
      const fatigueScore = Math.min(
        100,
        Math.round(data.sessions * 18 + data.sets * 2.5 + Math.min(data.load / 120, 35))
      );

      return {
        muscleGroup,
        sessions: data.sessions,
        sets: data.sets,
        load: Math.round(data.load),
        fatigueScore,
        status: classifyFatigue(fatigueScore),
      };
    })
    .sort((a, b) => b.fatigueScore - a.fatigueScore);
}

export function getMicrocycleDeloadSnapshot(): MicrocycleDeloadSnapshot {
  const sessions = getPerformedSessions().slice(-8);
  const readinessHistory = safeArray<AnyObj>(getExecutionStore()?.readinessHistory ?? []);

  const completedSessions = sessions.length;
  const adherenceValues = sessions
    .map((s) => Number(s?.adherencePct ?? 0))
    .filter((n) => Number.isFinite(n));
  const readinessValues = readinessHistory
    .slice(-8)
    .map((r) => Number(r?.score ?? r?.readinessScore ?? 0))
    .filter((n) => Number.isFinite(n));

  const avgAdherencePct = adherenceValues.length
    ? Math.round(adherenceValues.reduce((a, b) => a + b, 0) / adherenceValues.length)
    : 0;

  const avgReadinessScore = readinessValues.length
    ? Math.round(readinessValues.reduce((a, b) => a + b, 0) / readinessValues.length)
    : 0;

  const highFatigueGroups = getMuscleFatigueSnapshots(10).filter((x) => x.status === "high").length;

  let deloadRecommended = false;
  let deloadReason = "Microciclo estável.";
  let suggestedVolumeReductionPct = 0;

  if (completedSessions >= 6 && avgReadinessScore <= 52) {
    deloadRecommended = true;
    deloadReason = "Queda sustentada de prontidão nas últimas sessões.";
    suggestedVolumeReductionPct = 30;
  } else if (completedSessions >= 6 && avgAdherencePct <= 72) {
    deloadRecommended = true;
    deloadReason = "Aderência caiu no fim do microciclo.";
    suggestedVolumeReductionPct = 25;
  } else if (highFatigueGroups >= 2) {
    deloadRecommended = true;
    deloadReason = "Acúmulo alto de fadiga por grupamento muscular.";
    suggestedVolumeReductionPct = 35;
  }

  return {
    microcycleLengthDays: 7,
    completedSessions,
    avgAdherencePct,
    avgReadinessScore,
    deloadRecommended,
    deloadReason,
    suggestedVolumeReductionPct,
  };
}
