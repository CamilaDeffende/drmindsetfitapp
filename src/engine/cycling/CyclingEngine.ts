/**
 * Motor de Ciclismo Indoor
 * Integra biblioteca existente de workouts (cycling_bike_indoor.v1.json)
 */

import cyclingData from "@/engine/training_library/cycling/cycling_bike_indoor.v1.json";

export type CyclingLevel = "iniciante" | "intermediario" | "avancado";
export type CyclingGoal = "endurance" | "hiit" | "performance" | "condicionamento";

export type CyclingInput = {
  level: CyclingLevel;
  goal: CyclingGoal;
  daysPerWeek: number; // 2-6
};

export type CyclingWorkout = {
  id: string;
  level: string;
  name: string;
  goal: string;
  duration_minutes: number;
  intensity: {
    perceived_exertion: number | string; // Pode vir como "8-9" ou 8
    cadence_rpm: string;
    zones?: string; // Opcional
  };
  execution: string[] | {
    warmup: string;
    main_set: string[];
    cooldown: string;
  };
  focus: string;
  cues: string[];
  common_errors: string[];
  variations: string[];
};

export type CyclingSession = {
  day: string; // seg, ter, qua, qui, sex, sab
  workout: CyclingWorkout;
  tag: string; // endurance, hiit, torque, regenerativo, etc
};

export type CyclingWeek = {
  sessions: CyclingSession[];
  totalMinutes: number;
  avgPSE: number;
};

const DAYS_ORDER = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];

/**
 * Extrai PSE (perceived exertion) do range
 * Ex: "8-9" → 9, "7" → 7
 */
function parsePSE(pse: number | string): number {
  if (typeof pse === "number") return pse;

  const str = String(pse);
  if (str.includes("-")) {
    const parts = str.split("-").map((s) => parseInt(s.trim(), 10));
    return Math.max(...parts); // Pegar o maior valor do range
  }

  return parseInt(str, 10) || 7;
}

/**
 * Inferir tag do workout baseado em nome, cadência e PSE
 */
function inferTag(workout: CyclingWorkout): string {
  const name = workout.name.toLowerCase();
  const pse = parsePSE(workout.intensity.perceived_exertion);
  const cadence = workout.intensity.cadence_rpm.toLowerCase();

  if (name.includes("hiit") || name.includes("intervalado") || pse >= 9) {
    return "hiit";
  }

  if (name.includes("torque") || cadence.includes("baixa") || cadence.includes("60-70")) {
    return "torque";
  }

  if (name.includes("endurance") || name.includes("base") || pse <= 6) {
    return "endurance";
  }

  if (name.includes("sweet spot") || name.includes("tempo") || pse === 7 || pse === 8) {
    return "sweet-spot";
  }

  if (name.includes("recupera") || name.includes("regenera") || pse <= 5) {
    return "regenerativo";
  }

  return "intervalado";
}

/**
 * Filtra workouts por level e goal
 */
function filterWorkouts(level: CyclingLevel, goal: CyclingGoal): CyclingWorkout[] {
  const workouts = cyclingData.workouts as CyclingWorkout[];

  return workouts.filter((w) => {
    // Filtro por nível
    const levelMatch = w.level.toLowerCase().includes(level);

    // Filtro por goal
    let goalMatch = false;
    const wGoal = w.goal.toLowerCase();

    if (goal === "endurance") {
      goalMatch = wGoal.includes("endurance") || wGoal.includes("resistência");
    } else if (goal === "hiit") {
      goalMatch = wGoal.includes("hiit") || wGoal.includes("intervalado");
    } else if (goal === "performance") {
      goalMatch = wGoal.includes("performance") || wGoal.includes("competição");
    } else {
      goalMatch = wGoal.includes("condicionamento");
    }

    return levelMatch && goalMatch;
  });
}

/**
 * Gera semana de ciclismo
 */
export function generateCyclingPlan(input: CyclingInput): CyclingWeek {
  const sessions: CyclingSession[] = [];
  const availableWorkouts = filterWorkouts(input.level, input.goal);

  if (availableWorkouts.length === 0) {
    throw new Error(`Nenhum workout encontrado para level=${input.level} goal=${input.goal}`);
  }

  // Regras de distribuição de treinos
  const maxHardSessions = Math.min(2, input.daysPerWeek); // Máximo 2 treinos hard por semana
  const days = DAYS_ORDER.slice(0, input.daysPerWeek);

  // Separar workouts por intensidade
  const hardWorkouts = availableWorkouts.filter((w) => parsePSE(w.intensity.perceived_exertion) >= 8);
  const moderateWorkouts = availableWorkouts.filter(
    (w) => parsePSE(w.intensity.perceived_exertion) >= 6 && parsePSE(w.intensity.perceived_exertion) < 8
  );
  const easyWorkouts = availableWorkouts.filter((w) => parsePSE(w.intensity.perceived_exertion) < 6);

  let hardCount = 0;

  days.forEach((day, idx) => {
    let workout: CyclingWorkout;

    // Primeiro e último dia da semana: preferir workouts fáceis/moderados
    if (idx === 0 || idx === days.length - 1) {
      workout = (easyWorkouts.length > 0 ? easyWorkouts : moderateWorkouts)[idx % moderateWorkouts.length];
    }
    // Dias do meio: intercalar hard e moderate
    else if (hardCount < maxHardSessions && hardWorkouts.length > 0) {
      workout = hardWorkouts[hardCount % hardWorkouts.length];
      hardCount++;
    } else {
      workout = moderateWorkouts[idx % moderateWorkouts.length];
    }

    sessions.push({
      day,
      workout,
      tag: inferTag(workout),
    });
  });

  // Calcular totais
  const totalMinutes = sessions.reduce((sum, s) => sum + s.workout.duration_minutes, 0);
  const avgPSE = Math.round(
    sessions.reduce((sum, s) => sum + parsePSE(s.workout.intensity.perceived_exertion), 0) / sessions.length
  );

  return {
    sessions,
    totalMinutes,
    avgPSE,
  };
}

/**
 * Busca workout específico por ID
 */
export function getWorkoutById(id: string): CyclingWorkout | undefined {
  const workouts = cyclingData.workouts as CyclingWorkout[];
  return workouts.find((w) => w.id === id);
}

/**
 * Lista todos os workouts disponíveis
 */
export function listAllWorkouts(): CyclingWorkout[] {
  return cyclingData.workouts as CyclingWorkout[];
}
