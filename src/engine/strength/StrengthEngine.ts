/**
 * Motor de Musculação Completo
 * Gera planos de treino baseados em:
 * - Nível (iniciante, intermediário, avançado)
 * - Dias por semana (2-6)
 * - Objetivo (hipertrofia, força, resistência)
 * - Equipamento disponível
 */

import muscData from "@/data/training/musculacao/musculacao.full.json";

export type StrengthLevel = "iniciante" | "intermediario" | "avancado";
export type StrengthGoal = "hipertrofia" | "forca" | "resistencia" | "condicionamento";
export type Equipment = "completo" | "halteres" | "peso-corporal";

export type StrengthInput = {
  level: StrengthLevel;
  daysPerWeek: number; // 2-6
  goal: StrengthGoal;
  equipment?: Equipment;
};

export type Exercise = {
  name: string;
  goal: string;
  execution: string[];
  focus: string;
  cues: string[];
  common_errors: string[];
  variations: string[];
};

export type StrengthSession = {
  day: string; // seg, ter, qua, qui, sex, sab
  title: string; // ex: "Treino A - Upper Body"
  focus: string; // ex: "Peito, Ombros, Tríceps"
  exercises: Exercise[];
  sets: number; // séries recomendadas
  reps: string; // range de repetições ex: "8-12"
  rest: string; // descanso entre séries ex: "60-90s"
};

export type StrengthWeek = {
  sessions: StrengthSession[];
  split: string; // ex: "Full Body", "Upper/Lower", "PPL"
};

const DAYS_ORDER = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];

/**
 * Seleciona divisão de treino baseada em dias por semana
 */
function selectSplit(daysPerWeek: number, level: StrengthLevel): string {
  if (daysPerWeek <= 3) {
    return level === "iniciante" ? "Full Body" : "Full Body Avançado";
  } else if (daysPerWeek === 4) {
    return "Upper/Lower";
  } else if (daysPerWeek === 5) {
    return "Push/Pull/Legs";
  } else {
    return "ABCDEF (Específico por grupo)";
  }
}

/**
 * Extrai exercícios da biblioteca JSON
 */
function getExercisesFromLibrary(
  muscleGroup: string,
  equipment: Equipment,
  count: number = 4
): Exercise[] {
  const data = muscData as any;
  const exercises: Exercise[] = [];

  // Mapear grupo muscular para chave no JSON
  const groupKey = muscleGroup.toLowerCase();

  // Tentar acessar o grupo no JSON
  if (data.musculacao && data.musculacao[groupKey]) {
    const groupData = data.musculacao[groupKey];

    // Se tem equipamento específico, filtrar
    let exerciseList: any[] = [];

    if (equipment === "halteres" && groupData.halteres) {
      exerciseList = groupData.halteres;
    } else if (equipment === "peso-corporal" && groupData["peso-corporal"]) {
      exerciseList = groupData["peso-corporal"];
    } else {
      // Pegar todos os exercícios disponíveis
      Object.values(groupData).forEach((list: any) => {
        if (Array.isArray(list)) {
          exerciseList = exerciseList.concat(list);
        }
      });
    }

    // Selecionar até 'count' exercícios
    exercises.push(...exerciseList.slice(0, count));
  }

  return exercises;
}

/**
 * Gera plano de musculação completo
 */
export function generateStrengthPlan(input: StrengthInput): StrengthWeek {
  const split = selectSplit(input.daysPerWeek, input.level);
  const equipment = input.equipment ?? "completo";
  const sessions: StrengthSession[] = [];

  // Definir séries e reps baseado em objetivo e nível
  let sets: number;
  let reps: string;
  let rest: string;

  if (input.goal === "hipertrofia") {
    sets = input.level === "iniciante" ? 3 : input.level === "intermediario" ? 4 : 5;
    reps = "8-12";
    rest = "60-90s";
  } else if (input.goal === "forca") {
    sets = input.level === "iniciante" ? 3 : input.level === "intermediario" ? 4 : 5;
    reps = "4-6";
    rest = "2-3min";
  } else if (input.goal === "resistencia") {
    sets = 3;
    reps = "15-20";
    rest = "30-45s";
  } else {
    // condicionamento
    sets = 3;
    reps = "12-15";
    rest = "45-60s";
  }

  // Gerar sessões baseadas na divisão
  if (split === "Full Body" || split === "Full Body Avançado") {
    // 2-3x por semana: treino completo
    const days = DAYS_ORDER.slice(0, input.daysPerWeek);

    days.forEach((day, idx) => {
      sessions.push({
        day,
        title: `Treino ${String.fromCharCode(65 + idx)} - Full Body`,
        focus: "Corpo inteiro - padrões de movimento fundamentais",
        exercises: [
          ...getExercisesFromLibrary("costas", equipment, 2),
          ...getExercisesFromLibrary("peito", equipment, 2),
          ...getExercisesFromLibrary("quadriceps", equipment, 2),
          ...getExercisesFromLibrary("posterior", equipment, 1),
        ].slice(0, 6), // Máximo 6 exercícios por treino full body
        sets,
        reps,
        rest,
      });
    });
  } else if (split === "Upper/Lower") {
    // 4x por semana: 2 upper, 2 lower
    const schedule = [
      { day: "seg", type: "upper" },
      { day: "ter", type: "lower" },
      { day: "qui", type: "upper" },
      { day: "sex", type: "lower" },
    ];

    schedule.forEach(({ day, type }) => {
      if (type === "upper") {
        sessions.push({
          day,
          title: "Upper Body",
          focus: "Peito, Costas, Ombros, Braços",
          exercises: [
            ...getExercisesFromLibrary("peito", equipment, 2),
            ...getExercisesFromLibrary("costas", equipment, 2),
            ...getExercisesFromLibrary("ombros", equipment, 1),
            ...getExercisesFromLibrary("biceps", equipment, 1),
            ...getExercisesFromLibrary("triceps", equipment, 1),
          ].slice(0, 7),
          sets,
          reps,
          rest,
        });
      } else {
        sessions.push({
          day,
          title: "Lower Body",
          focus: "Quadríceps, Posterior, Glúteos, Panturrilhas",
          exercises: [
            ...getExercisesFromLibrary("quadriceps", equipment, 2),
            ...getExercisesFromLibrary("posterior", equipment, 2),
            ...getExercisesFromLibrary("gluteos", equipment, 1),
            ...getExercisesFromLibrary("panturrilhas", equipment, 1),
          ].slice(0, 6),
          sets,
          reps,
          rest,
        });
      }
    });
  } else if (split === "Push/Pull/Legs") {
    // 5x por semana: 2 push, 2 pull, 1 legs (ou rotar)
    const schedule = [
      { day: "seg", type: "push" },
      { day: "ter", type: "pull" },
      { day: "qua", type: "legs" },
      { day: "qui", type: "push" },
      { day: "sex", type: "pull" },
    ];

    schedule.forEach(({ day, type }) => {
      if (type === "push") {
        sessions.push({
          day,
          title: "Push (Empurrar)",
          focus: "Peito, Ombros, Tríceps",
          exercises: [
            ...getExercisesFromLibrary("peito", equipment, 3),
            ...getExercisesFromLibrary("ombros", equipment, 2),
            ...getExercisesFromLibrary("triceps", equipment, 2),
          ].slice(0, 6),
          sets,
          reps,
          rest,
        });
      } else if (type === "pull") {
        sessions.push({
          day,
          title: "Pull (Puxar)",
          focus: "Costas, Trapézio, Bíceps",
          exercises: [
            ...getExercisesFromLibrary("costas", equipment, 3),
            ...getExercisesFromLibrary("trapezio", equipment, 1),
            ...getExercisesFromLibrary("biceps", equipment, 2),
          ].slice(0, 6),
          sets,
          reps,
          rest,
        });
      } else {
        sessions.push({
          day,
          title: "Legs (Pernas)",
          focus: "Quadríceps, Posterior, Glúteos, Panturrilhas",
          exercises: [
            ...getExercisesFromLibrary("quadriceps", equipment, 2),
            ...getExercisesFromLibrary("posterior", equipment, 2),
            ...getExercisesFromLibrary("gluteos", equipment, 1),
            ...getExercisesFromLibrary("panturrilhas", equipment, 1),
          ].slice(0, 6),
          sets,
          reps,
          rest,
        });
      }
    });
  }

  return {
    sessions,
    split,
  };
}
