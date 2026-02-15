/**
 * Motor de Treinamento Funcional
 * Combina força, cardio e mobilidade
 */

export type FunctionalLevel = "iniciante" | "intermediario" | "avancado";
export type FunctionalEmphasis = "strength" | "cardio" | "mobility" | "balanced";

export type FunctionalInput = {
  level: FunctionalLevel;
  daysPerWeek: number; // 2-6
  emphasis: FunctionalEmphasis;
};

export type FunctionalSession = {
  day: string;
  title: string;
  pillar: "strength" | "cardio" | "mobility";
  duration: number; // minutos
  exercises: {
    name: string;
    sets?: string;
    reps?: string;
    time?: string;
    notes: string;
  }[];
  pse: number; // 5-9
};

export type FunctionalWeek = {
  sessions: FunctionalSession[];
  focus: string;
};

const DAYS_ORDER = ["seg", "ter", "qua", "qui", "sex", "sab"];

/**
 * Gera semana de treinamento funcional
 */
export function generateFunctionalWeek(input: FunctionalInput): FunctionalWeek {
  const sessions: FunctionalSession[] = [];
  const days = DAYS_ORDER.slice(0, input.daysPerWeek);

  // Distribuir pilares ao longo da semana baseado em emphasis
  let distribution: Array<"strength" | "cardio" | "mobility">;

  if (input.emphasis === "strength") {
    distribution = ["strength", "strength", "cardio", "strength", "mobility", "cardio"];
  } else if (input.emphasis === "cardio") {
    distribution = ["cardio", "strength", "cardio", "cardio", "mobility", "strength"];
  } else if (input.emphasis === "mobility") {
    distribution = ["mobility", "strength", "cardio", "mobility", "strength", "mobility"];
  } else {
    // balanced
    distribution = ["strength", "cardio", "mobility", "strength", "cardio", "mobility"];
  }

  days.forEach((day, idx) => {
    const pillar = distribution[idx % distribution.length];
    sessions.push(createFunctionalSession(day, pillar, input.level));
  });

  return {
    sessions,
    focus: `Ênfase em ${input.emphasis === "balanced" ? "equilíbrio" : input.emphasis}`,
  };
}

/**
 * Cria uma sessão funcional
 */
function createFunctionalSession(day: string, pillar: "strength" | "cardio" | "mobility", level: FunctionalLevel): FunctionalSession {
  const session: FunctionalSession = {
    day,
    title: "",
    pillar,
    duration: 45,
    exercises: [],
    pse: 7,
  };

  if (pillar === "strength") {
    session.title = "Força Funcional";
    session.duration = 50;
    session.pse = 8;
    session.exercises = [
      {
        name: "Agachamento livre",
        sets: "4",
        reps: level === "iniciante" ? "10-12" : level === "intermediario" ? "8-10" : "6-8",
        notes: "Padrão fundamental de movimento - pés largura dos ombros",
      },
      {
        name: "Remada invertida ou Pull-up",
        sets: "4",
        reps: level === "iniciante" ? "8-10" : level === "intermediario" ? "6-8" : "5-7",
        notes: "Padrão de puxar - escápulas retraídas",
      },
      {
        name: "Push-up ou Flexão",
        sets: "4",
        reps: level === "iniciante" ? "10-15" : level === "intermediario" ? "15-20" : "20-25",
        notes: "Padrão de empurrar - core ativo",
      },
      {
        name: "Afundo alternado",
        sets: "3",
        reps: "10 cada perna",
        notes: "Unilateral - controle e estabilidade",
      },
      {
        name: "Prancha",
        sets: "3",
        time: level === "iniciante" ? "30s" : level === "intermediario" ? "45s" : "60s",
        notes: "Core - alinhamento neutro da coluna",
      },
    ];
  } else if (pillar === "cardio") {
    session.title = "Condicionamento Metabólico";
    session.duration = 40;
    session.pse = 9;
    session.exercises = [
      {
        name: "Aquecimento dinâmico",
        time: "5min",
        notes: "Jumping jacks, high knees, butt kicks",
      },
      {
        name: "HIIT Circuit (4 rounds)",
        time: "20min",
        notes: `
• 40s Burpees / 20s rest
• 40s Mountain Climbers / 20s rest
• 40s Jump Squats / 20s rest
• 40s Bike ou Row / 20s rest
Rest 1min entre rounds`,
      },
      {
        name: "Finisher: Bike ou Row",
        time: level === "iniciante" ? "5min steady" : level === "intermediario" ? "8min steady" : "10min intervalado",
        notes: "Esforço moderado/alto",
      },
      {
        name: "Cooldown",
        time: "5min",
        notes: "Caminhada + alongamento dinâmico",
      },
    ];
  } else {
    // mobility
    session.title = "Mobilidade e Recuperação";
    session.duration = 40;
    session.pse = 5;
    session.exercises = [
      {
        name: "Foam rolling",
        time: "10min",
        notes: "Posterior, glúteos, TI band, panturrilhas, costas",
      },
      {
        name: "Alongamento dinâmico",
        time: "10min",
        notes: "World's greatest stretch, spiderman lunge, cat-cow, quadrupede rotação torácica",
      },
      {
        name: "Mobilidade de quadril",
        time: "5min",
        notes: "90/90 stretch, cossack squats, fire hydrants",
      },
      {
        name: "Mobilidade de ombros",
        time: "5min",
        notes: "Band pull-aparts, wall slides, thoracic extensions",
      },
      {
        name: "Core estabilidade",
        time: "10min",
        notes: "Dead bug, bird dog, hollow hold, arch hold",
      },
    ];
  }

  return session;
}
