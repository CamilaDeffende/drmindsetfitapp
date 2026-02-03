// sanity-anchor: src/modules/running
export * from "./types";
export * from "./catalog";
export * from "./templates";
export * from "./engine";


/**
 * ============================================================
 * COMPAT LAYER (scripts/running_demo.ts + scripts/running_export.ts)
 * Mantém contrato:
 *   - generateRunningWeek({ level, goal, daysPerWeek, hasStrength, weekIndex })
 *   - toPrettyJSON(value)
 * Não remove nem altera exports existentes.
 * ============================================================
 */

// Aceita entradas "any" vindas do CLI sem quebrar build
type _RunningLevel = "INICIANTE" | "INTERMEDIARIO" | "AVANCADO";
type _RunningGoal  = "5K" | "10K" | "21K" | "42K";

type _GenerateWeekReq = {
  level: _RunningLevel;
  goal: _RunningGoal;
  daysPerWeek: number;
  hasStrength: boolean;
  weekIndex: number;
};

type _RunningSessionType = "EASY" | "INTERVAL" | "TEMPO" | "LONG" | "RECOVERY" | "STRENGTH";
type _RunningSession = {
  day: number;
  label: string;
  type: _RunningSessionType;
  durationMin?: number;
  distanceKm?: number;
  notes?: string;
};

type _RunningWeekPlan = {
  weekIndex: number;
  level: _RunningLevel;
  goal: _RunningGoal;
  daysPerWeek: number;
  hasStrength: boolean;
  sessions: _RunningSession[];
};

export function toPrettyJSON(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function _clampInt(v: any, min: number, max: number) {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function _baseByGoal(goal: _RunningGoal) {
  switch (goal) {
    case "5K":  return { longKm: 6,  tempoMin: 20, intervalMin: 18 };
    case "10K": return { longKm: 10, tempoMin: 25, intervalMin: 22 };
    case "21K": return { longKm: 16, tempoMin: 30, intervalMin: 24 };
    case "42K": return { longKm: 24, tempoMin: 35, intervalMin: 26 };
  }
}

function _factorByLevel(level: _RunningLevel) {
  switch (level) {
    case "INICIANTE": return 0.85;
    case "INTERMEDIARIO": return 1.0;
    case "AVANCADO": return 1.1;
  }
}

export function generateRunningWeek(req: _GenerateWeekReq): _RunningWeekPlan {
  const level = req.level;
  const goal = req.goal;
  const daysPerWeek = _clampInt(req.daysPerWeek, 3, 6);
  const hasStrength = !!req.hasStrength;
  const weekIndex = _clampInt(req.weekIndex, 1, 52);

  const base = _baseByGoal(goal);
  const factor = _factorByLevel(level);
  const prog = 1 + (weekIndex - 1) * 0.03;

  const sessions: _RunningSession[] = [];
  const daySlots = [1, 2, 3, 4, 6, 5];

  for (let i = 0; i < daysPerWeek; i++) {
    const day = daySlots[i] ?? (i + 1);

    if (i === 0) sessions.push({ day, label: "Rodagem leve", type: "EASY", durationMin: Math.max(15, Math.round(25 * factor * prog)), notes: "RPE 3-4" });
    else if (i === 1) sessions.push({ day, label: "Intervalado", type: "INTERVAL", durationMin: Math.round(base.intervalMin * factor * prog), notes: "Aquecimento + tiros curtos + desaquecimento" });
    else if (i === 2) sessions.push({ day, label: "Recuperação", type: "RECOVERY", durationMin: Math.max(12, Math.round(18 * factor * prog)), notes: "Leve, foco em técnica" });
    else if (i === 3) sessions.push({ day, label: "Tempo run", type: "TEMPO", durationMin: Math.round(base.tempoMin * factor * prog), notes: "Sustentado, RPE 6-7" });
    else if (i === 4) sessions.push(
      hasStrength
        ? { day, label: "Fortalecimento", type: "STRENGTH", durationMin: 30, notes: "Lower body + core + mobilidade" }
        : { day, label: "Recuperação", type: "RECOVERY", durationMin: 20, notes: "Muito leve" }
    );
    else sessions.push({ day, label: "Longão", type: "LONG", distanceKm: Math.round(Math.max(4, base.longKm * factor * prog) * 10) / 10, notes: "Leve a moderado, hidratação" });
  }

  return { weekIndex, level, goal, daysPerWeek, hasStrength, sessions };
}
