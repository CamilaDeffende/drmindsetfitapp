/**
 * Motor de Planos de Corrida
 * Planos progressivos para 5k, 10k, 21k (meia maratona), 42k (maratona)
 * Baseado em metodologia científica (Daniels' Running Formula)
 */

export type RunningLevel = "iniciante" | "intermediario" | "avancado";
export type TargetDistance = "5k" | "10k" | "21k" | "42k";

export type RunningInput = {
  level: RunningLevel;
  targetDistance: TargetDistance;
  weeksAvailable: number; // 8-24 semanas
  currentWeeklyKm?: number; // volume atual (usado para progressão)
};

export type RunningSession = {
  day: string; // seg, ter, qua, qui, sex, sab, dom
  type: "rodagem-leve" | "tempo-run" | "intervalado" | "longao" | "recuperacao" | "rest";
  title: string;
  distanceKm?: number; // distância alvo
  timeMinutes?: number; // ou tempo alvo
  pace?: string; // pace sugerido (min/km) ex: "5:30-6:00"
  zone?: string; // zona de FC ex: "Z2 (60-70% FCM)"
  rpe?: number; // RPE (6-10 escala Borg)
  description: string;
  warmup?: string;
  cooldown?: string;
};

export type RunningWeek = {
  weekNumber: number;
  sessions: RunningSession[];
  totalKm: number;
  focus: string;
};

export type RunningPlan = {
  targetDistance: TargetDistance;
  level: RunningLevel;
  weeks: RunningWeek[];
  totalWeeks: number;
};

const DAYS_ORDER = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];

/**
 * Gera plano de corrida progressivo
 */
export function generateRunningPlan(input: RunningInput): RunningPlan {
  const weeks: RunningWeek[] = [];
  const totalWeeks = Math.min(Math.max(input.weeksAvailable, 8), 24);

  // Determinar volume base e progressão
  const { baseKm, longRunKm } = getBaseVolumes(input.targetDistance, input.level);

  for (let weekNum = 1; weekNum <= totalWeeks; weekNum++) {
    const week = generateWeek(weekNum, totalWeeks, input, baseKm, longRunKm);
    weeks.push(week);
  }

  return {
    targetDistance: input.targetDistance,
    level: input.level,
    weeks,
    totalWeeks,
  };
}

/**
 * Determina volumes base por distância e nível
 */
function getBaseVolumes(distance: TargetDistance, level: RunningLevel): { baseKm: number; longRunKm: number } {
  const volumes: Record<TargetDistance, Record<RunningLevel, { base: number; long: number }>> = {
    "5k": {
      iniciante: { base: 15, long: 6 },
      intermediario: { base: 25, long: 8 },
      avancado: { base: 35, long: 10 },
    },
    "10k": {
      iniciante: { base: 25, long: 10 },
      intermediario: { base: 40, long: 14 },
      avancado: { base: 55, long: 18 },
    },
    "21k": {
      iniciante: { base: 40, long: 15 },
      intermediario: { base: 60, long: 18 },
      avancado: { base: 80, long: 22 },
    },
    "42k": {
      iniciante: { base: 55, long: 25 },
      intermediario: { base: 75, long: 30 },
      avancado: { base: 95, long: 35 },
    },
  };

  const vol = volumes[distance][level];
  return { baseKm: vol.base, longRunKm: vol.long };
}

/**
 * Gera uma semana de treino
 */
function generateWeek(
  weekNum: number,
  totalWeeks: number,
  input: RunningInput,
  baseKm: number,
  longRunKm: number
): RunningWeek {
  const sessions: RunningSession[] = [];

  // Progressão: 10% por semana até pico, depois taper
  const isDeloadWeek = weekNum % 4 === 0; // Semana 4, 8, 12... = deload
  const isTaperWeek = weekNum > totalWeeks - 3; // Últimas 3 semanas = taper
  const progressionFactor = isTaperWeek ? 0.7 - (totalWeeks - weekNum) * 0.1 : isDeloadWeek ? 0.8 : 1.0 + (weekNum * 0.05);

  const weeklyKm = Math.round(baseKm * progressionFactor);
  const longRun = Math.round(longRunKm * progressionFactor);

  // Distribuir sessões na semana
  if (input.level === "iniciante") {
    // 3-4x por semana
    sessions.push(
      {
        day: "ter",
        type: "rodagem-leve",
        title: "Rodagem Leve",
        distanceKm: Math.round(weeklyKm * 0.25),
        pace: "6:00-6:30",
        zone: "Z2 (60-70% FCM)",
        rpe: 6,
        description: "Ritmo confortável, deve conseguir conversar",
        warmup: "5min caminhada",
        cooldown: "5min caminhada",
      },
      {
        day: "qui",
        type: "recuperacao",
        title: "Recuperação Ativa",
        distanceKm: Math.round(weeklyKm * 0.2),
        pace: "6:30-7:00",
        zone: "Z1 (50-60% FCM)",
        rpe: 5,
        description: "Muito leve, foco em recuperação",
      },
      {
        day: "sab",
        type: "longao",
        title: "Longão",
        distanceKm: longRun,
        pace: "6:00-6:30",
        zone: "Z2 (60-70% FCM)",
        rpe: 6,
        description: "Treino mais longo da semana, ritmo fácil",
        warmup: "10min trote leve",
        cooldown: "5min caminhada + alongamento",
      }
    );
  } else if (input.level === "intermediario") {
    // 4-5x por semana
    sessions.push(
      {
        day: "ter",
        type: "tempo-run",
        title: "Tempo Run",
        distanceKm: Math.round(weeklyKm * 0.25),
        pace: "5:00-5:20",
        zone: "Z4 (80-85% FCM)",
        rpe: 8,
        description: "Ritmo forte mas sustentável (limiar anaeróbico)",
        warmup: "15min trote + educativos",
        cooldown: "10min trote leve",
      },
      {
        day: "qui",
        type: "rodagem-leve",
        title: "Rodagem Moderada",
        distanceKm: Math.round(weeklyKm * 0.2),
        pace: "5:40-6:10",
        zone: "Z2 (60-70% FCM)",
        rpe: 6,
        description: "Ritmo confortável de base",
      },
      {
        day: "sex",
        type: "recuperacao",
        title: "Recuperação",
        distanceKm: Math.round(weeklyKm * 0.15),
        pace: "6:20-6:50",
        zone: "Z1 (50-60% FCM)",
        rpe: 5,
        description: "Leve para recuperar",
      },
      {
        day: "sab",
        type: "longao",
        title: "Longão Progressivo",
        distanceKm: longRun,
        pace: "5:50-6:20 → 5:30-5:50",
        zone: "Z2 → Z3",
        rpe: 7,
        description: "Começa fácil, acelera nos últimos 30%",
        warmup: "10min trote",
        cooldown: "10min trote leve + alongamento",
      }
    );
  } else {
    // Avançado: 5-6x por semana
    sessions.push(
      {
        day: "seg",
        type: "recuperacao",
        title: "Recuperação",
        distanceKm: Math.round(weeklyKm * 0.15),
        pace: "6:00-6:30",
        zone: "Z1 (50-60% FCM)",
        rpe: 5,
        description: "Leve pós-longão",
      },
      {
        day: "ter",
        type: "intervalado",
        title: "Intervalado Curto",
        distanceKm: 10,
        pace: "4:00-4:20 (tiros) + recuperação",
        zone: "Z5 (90-95% FCM)",
        rpe: 9,
        description: "6-10 x 800m em ritmo de prova 5k com 2min recuperação",
        warmup: "20min trote + educativos + 2x100m progressivo",
        cooldown: "15min trote leve",
      },
      {
        day: "qui",
        type: "tempo-run",
        title: "Tempo Run Longo",
        distanceKm: Math.round(weeklyKm * 0.25),
        pace: "4:40-5:00",
        zone: "Z4 (80-85% FCM)",
        rpe: 8,
        description: "Ritmo de limiar sustentado",
        warmup: "15min trote + educativos",
        cooldown: "10min trote",
      },
      {
        day: "sex",
        type: "rodagem-leve",
        title: "Rodagem Base",
        distanceKm: Math.round(weeklyKm * 0.2),
        pace: "5:30-6:00",
        zone: "Z2 (60-70% FCM)",
        rpe: 6,
        description: "Aeróbico fácil",
      },
      {
        day: "sab",
        type: "longao",
        title: "Longão com Simulação",
        distanceKm: longRun,
        pace: "5:30-6:00 → 4:50-5:10 (final)",
        zone: "Z2 → Z4",
        rpe: 8,
        description: "Final em ritmo de prova alvo",
        warmup: "10min trote",
        cooldown: "10min trote + alongamento",
      }
    );
  }

  // Adicionar dias de descanso
  const usedDays = new Set(sessions.map((s) => s.day));
  DAYS_ORDER.forEach((day) => {
    if (!usedDays.has(day)) {
      sessions.push({
        day,
        type: "rest",
        title: "Descanso",
        description: "Recuperação ativa: alongamento, mobilidade, caminhada leve",
      });
    }
  });

  // Ordenar por dia da semana
  sessions.sort((a, b) => DAYS_ORDER.indexOf(a.day) - DAYS_ORDER.indexOf(b.day));

  // Calcular km total da semana
  const totalKm = sessions.reduce((sum, s) => sum + (s.distanceKm ?? 0), 0);

  // Focus da semana
  let focus = "Base aeróbica";
  if (isDeloadWeek) focus = "Recuperação (deload)";
  if (isTaperWeek) focus = "Taper - redução de volume";
  if (weekNum === totalWeeks) focus = "Semana da prova!";

  return {
    weekNumber: weekNum,
    sessions,
    totalKm: Math.round(totalKm),
    focus,
  };
}
