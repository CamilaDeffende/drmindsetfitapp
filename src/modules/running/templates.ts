import { RunnerInputs, WeekPlan, WorkoutPrescription } from "./types";
import { WORKOUT_CATALOG } from "./catalog";

function w(baseKey: keyof typeof WORKOUT_CATALOG, patch: Partial<WorkoutPrescription>): WorkoutPrescription {
  const base = WORKOUT_CATALOG[baseKey];
  return { ...base, ...patch } as WorkoutPrescription;
}

const DAYS_3 = ["SEG", "QUA", "SAB"] as const;
const DAYS_4 = ["SEG", "QUA", "SEX", "DOM"] as const;
const DAYS_5 = ["SEG", "TER", "QUI", "SAB", "DOM"] as const;
const DAYS_6 = ["SEG", "TER", "QUA", "QUI", "SAB", "DOM"] as const;

function pickDays(n: RunnerInputs["daysPerWeek"]) {
  if (n === 3) return [...DAYS_3];
  if (n === 4) return [...DAYS_4];
  if (n === 5) return [...DAYS_5];
  return [...DAYS_6];
}

export function buildWeekTemplate(inputs: RunnerInputs): WeekPlan {
  const weekIndex = inputs.weekIndex ?? 1;

  const days = pickDays(inputs.daysPerWeek);
  const sessions: WeekPlan["sessions"] = [];

  const easyPct = 0.8;
  const qualityPct = 0.2;

  // Heurística segura e conservadora por nível (plugável com ritmos reais depois)
  // Sem “achismo”: intensidades em FC/RPE, pace apenas como dica descritiva.
  if (inputs.level === "INICIANTE") {
    // 3-4 sessões: leve + intervalado leve/estruturado + longão leve
    const A = w("CORRIDA_LEVE_Z1Z2", { durationMin: 30, intensity: { ...WORKOUT_CATALOG.CORRIDA_LEVE_Z1Z2.intensity, paceHint: "conversável" }});
    const B = w("FARTLEK_ESTRUTURADO", {
      title: "Intervalado Leve (Iniciante)",
      description: "Introdução a estímulos moderados com controle total.",
      blocks: [
        { label: "Aquecimento", durationMin: 10, zone: "Z2", rpe: 3 },
        { label: "6× (1 min moderado + 2 min leve)", durationMin: 18, rpe: 5, note: "moderado controlado, sem sprint" },
        { label: "Desaquecimento", durationMin: 7, zone: "Z1", rpe: 2 },
      ],
      intensity: { model: "HYBRID", hrPercentMax: [70, 85], rpe: [4, 6], paceHint: "moderado controlado" },
    });
    const C = w("LONGAO", { durationMin: inputs.daysPerWeek >= 4 ? 55 : 45 });

    sessions.push({ dayLabel: days[0], workout: A });
    sessions.push({ dayLabel: days[1], workout: B });
    sessions.push({ dayLabel: days[2], workout: C });

    if (inputs.daysPerWeek >= 4) {
      const D = w("REGENERATIVO", { durationMin: 20 });
      sessions.push({ dayLabel: days[3], workout: D });
    }
  }

  if (inputs.level === "INTERMEDIARIO") {
    const A = w("CORRIDA_LEVE_Z1Z2", { durationMin: 40 });
    const B = w("INTERVALADO_MEDIO", {
      blocks: [
        { label: "Aquecimento", durationMin: 12, zone: "Z2", rpe: 3 },
        { label: "4×800m forte", note: "rec 2–3 min leve", rpe: 8 },
        { label: "Desaquecimento", durationMin: 10, zone: "Z1", rpe: 2 },
      ],
      intensity: { ...WORKOUT_CATALOG.INTERVALADO_MEDIO.intensity, paceHint: "ritmo de 5K/10K (forte)" },
    });
    const C = w("TEMPO_RUN", { durationMin: 25, intensity: { ...WORKOUT_CATALOG.TEMPO_RUN.intensity, paceHint: "ritmo sustentável forte controlado" } });
    const D = w("LONGAO", { durationMin: 80 });

    sessions.push({ dayLabel: days[0], workout: A });
    sessions.push({ dayLabel: days[1], workout: B });
    sessions.push({ dayLabel: days[2], workout: C });
    sessions.push({ dayLabel: days[3], workout: D });

    if (inputs.daysPerWeek >= 5) {
      sessions.push({ dayLabel: days[4], workout: w("REGENERATIVO", { durationMin: 25 }) });
    }
  }

  if (inputs.level === "AVANCADO") {
    const A = w("CORRIDA_LEVE_Z1Z2", { durationMin: 45 });
    const B = w("INTERVALADO_MEDIO", {
      blocks: [
        { label: "Aquecimento", durationMin: 15, zone: "Z2", rpe: 3 },
        { label: "6×1000m forte", note: "rec 2–3 min leve", rpe: 8 },
        { label: "Desaquecimento", durationMin: 10, zone: "Z1", rpe: 2 },
      ],
      intensity: { ...WORKOUT_CATALOG.INTERVALADO_MEDIO.intensity, paceHint: "forte (próximo de 10K)" },
    });
    const C = w("TEMPO_RUN", { durationMin: 35, intensity: { ...WORKOUT_CATALOG.TEMPO_RUN.intensity, paceHint: "forte controlado (Z4)" } });
    const D = w("FARTLEK_ESTRUTURADO", {
      blocks: [
        { label: "Aquecimento", durationMin: 12, zone: "Z2", rpe: 3 },
        { label: "8× (2 min forte + 1 min leve)", durationMin: 24, rpe: 8, note: "controle, sem sprint" },
        { label: "Desaquecimento", durationMin: 8, zone: "Z1", rpe: 2 },
      ],
      intensity: { model: "HYBRID", hrPercentMax: [78, 92], rpe: [6, 8], paceHint: "variações controladas" },
    });
    const E = w("LONGAO_PROGRESSIVO", {
      durationMin: 110,
      blocks: [
        { label: "Inicial leve", durationMin: 60, zone: "Z2", rpe: 4 },
        { label: "Progressão", durationMin: 35, zone: "Z3", rpe: 6 },
        { label: "Final controlado", durationMin: 15, zone: "Z4", rpe: 7 },
      ],
      intensity: { model: "HYBRID", hrPercentMax: [65, 88], rpe: [4, 7], paceHint: "fecha moderado/ritmo" },
    });

    sessions.push({ dayLabel: days[0], workout: A });
    sessions.push({ dayLabel: days[1], workout: B });
    sessions.push({ dayLabel: days[2], workout: C });
    sessions.push({ dayLabel: days[3], workout: D });
    sessions.push({ dayLabel: days[4], workout: E });

    if (inputs.daysPerWeek >= 6) {
      sessions.push({ dayLabel: days[5], workout: w("REGENERATIVO", { durationMin: 30 }) });
    }
  }

  // Integração de força (opcional): sem interferir na corrida; exportável no mesmo plano
  if (inputs.hasStrength) {
    sessions.push({
      dayLabel: "FORCA",
      workout: {
        ...WORKOUT_CATALOG.FORCA_ESPECIFICA,
        blocks: [
          { label: "Agachamento / Variante", note: "3–5 séries | 4–8 reps | RPE 7–8" },
          { label: "Levantamento terra romeno", note: "3–4 séries | 6–10 reps | RPE 7–8" },
          { label: "Passada / Split squat", note: "3 séries | 8–12 reps | RPE 7" },
          { label: "Panturrilha", note: "3–5 séries | 10–15 reps | RPE 7" },
          { label: "Core (anti-rotação)", note: "3–4 blocos | 30–45s" },
        ],
        intensity: { model: "RPE", rpe: [6, 8] },
      },
    });
  }

  return {
    meta: {
      level: inputs.level,
      goal: inputs.goal,
      daysPerWeek: inputs.daysPerWeek,
      weekIndex,
      distributionHint: { easyPct, qualityPct },
    },
    sessions,
  };
}
