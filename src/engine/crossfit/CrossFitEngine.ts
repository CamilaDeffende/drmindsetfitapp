/**
 * Motor de CrossFit WODs
 * Gera WODs (Workout of the Day) estruturados
 */

export type CrossFitLevel = "iniciante" | "intermediario" | "avancado";
export type WODType = "amrap" | "emom" | "for-time" | "chipper" | "strength-metcon";

export type CrossFitInput = {
  level: CrossFitLevel;
  daysPerWeek: number; // 3-6
};

export type WOD = {
  day: string;
  type: WODType;
  title: string;
  description: string;
  skill?: string; // Skill work antes do metcon
  metcon: string; // Descrição do metcon
  strength?: string; // Força antes do metcon (se strength-metcon)
  timecap?: string; // Limite de tempo
  scale: {
    rx: string; // Prescrição padrão
    scaled: string; // Versão escalonada
    beginner: string; // Versão iniciante
  };
  pse: number; // Perceived exertion 6-10
};

export type CrossFitWeek = {
  wods: WOD[];
  focus: string;
};

const DAYS_ORDER = ["seg", "ter", "qua", "qui", "sex", "sab"];

/**
 * Gera semana de CrossFit
 */
export function generateCrossFitWeek(input: CrossFitInput): CrossFitWeek {
  const wods: WOD[] = [];
  const days = DAYS_ORDER.slice(0, input.daysPerWeek);

  // Distribuir tipos de WOD ao longo da semana
  const wodTemplates: Array<{ type: WODType; title: string; pse: number }> = [
    { type: "strength-metcon", title: "Força + Metcon", pse: 9 },
    { type: "amrap", title: "AMRAP 20min", pse: 8 },
    { type: "emom", title: "EMOM Intervalado", pse: 9 },
    { type: "for-time", title: "For Time", pse: 8 },
    { type: "chipper", title: "Chipper Longo", pse: 7 },
    { type: "amrap", title: "AMRAP Curto", pse: 8 },
  ];

  days.forEach((day, idx) => {
    const template = wodTemplates[idx % wodTemplates.length];

    wods.push(createWOD(day, template.type, template.title, template.pse, input.level));
  });

  return {
    wods,
    focus: "Força, condicionamento metabólico e habilidades funcionais",
  };
}

/**
 * Cria um WOD específico
 */
function createWOD(day: string, type: WODType, title: string, pse: number, level: CrossFitLevel): WOD {
  const wod: WOD = {
    day,
    type,
    title,
    description: "",
    metcon: "",
    timecap: "20min",
    scale: {
      rx: "",
      scaled: "",
      beginner: "",
    },
    pse,
  };

  switch (type) {
    case "amrap":
      wod.description = "AMRAP (As Many Rounds As Possible) - completar o máximo de rounds no tempo";
      wod.metcon = `AMRAP 20min:
- 10 Pull-ups
- 15 Push-ups
- 20 Air Squats
- 25 Sit-ups`;
      wod.scale.rx = "Pull-ups padrão, push-ups padrão";
      wod.scale.scaled = "Pull-ups com banda, push-ups inclinados";
      wod.scale.beginner = "Remadas invertidas, push-ups joelhos, 15 air squats";
      break;

    case "emom":
      wod.description = "EMOM (Every Minute On the Minute) - completar reps a cada minuto";
      wod.metcon = `EMOM 16min (4 rounds):
Min 1: 12 Box Jumps (60cm)
Min 2: 10 Dumbbell Thrusters (15kg cada)
Min 3: 12 Toes-to-Bar
Min 4: 200m Run`;
      wod.scale.rx = "Altura box 60cm, 15kg DBs";
      wod.scale.scaled = "Box 45cm, 10kg DBs, Knees-to-Elbow";
      wod.scale.beginner = "Step-ups, 7kg DBs, Hanging Knee Raises, 150m caminhada rápida";
      break;

    case "for-time":
      wod.description = "For Time - completar o workout o mais rápido possível";
      wod.metcon = `For Time (cap 15min):
21-15-9 de:
- Thrusters (42.5kg)
- Pull-ups
- Burpees`;
      wod.timecap = "15min";
      wod.scale.rx = "42.5kg thrusters, pull-ups padrão";
      wod.scale.scaled = "30kg thrusters, pull-ups com banda";
      wod.scale.beginner = "20kg thrusters, remadas invertidas, burpees sem salto";
      break;

    case "chipper":
      wod.description = "Chipper - lista longa de exercícios, completar uma única vez";
      wod.metcon = `For Time:
100 Double-Unders
50 Wall Balls (9kg)
40 Kettlebell Swings (24kg)
30 Box Jump-Overs (60cm)
20 Dumbbell Snatches (22.5kg)
10 Burpee Muscle-ups`;
      wod.timecap = "25min";
      wod.scale.rx = "Double-unders, 9kg WB, 24kg KB, 60cm box, 22.5kg DB";
      wod.scale.scaled = "Single-unders, 6kg WB, 16kg KB, 45cm box, 15kg DB, Burpee Pull-ups";
      wod.scale.beginner = "200 single-unders, 4kg WB, 12kg KB, step-ups, 10kg DB, Burpees";
      break;

    case "strength-metcon":
      wod.description = "Força + Metcon - trabalho de força seguido de condicionamento";
      wod.strength = `Força:
Back Squat 5x5 @ 75% 1RM
(progressão: semana 1: 70%, semana 2: 75%, semana 3: 80%, semana 4: deload 60%)`;
      wod.metcon = `Metcon (10min):
AMRAP 10min:
- 8 Front Squats (60kg)
- 8 Chest-to-Bar Pull-ups
- 200m Run`;
      wod.scale.rx = "60kg front squat, C2B pull-ups";
      wod.scale.scaled = "40kg front squat, chin-over-bar pull-ups";
      wod.scale.beginner = "30kg front squat, jumping pull-ups, 150m caminhada rápida";
      break;
  }

  // Ajustar intensidade por nível
  if (level === "iniciante") {
    wod.description += " (Foco em técnica e movimento seguro)";
    wod.pse = Math.max(6, wod.pse - 1);
  } else if (level === "avancado") {
    wod.description += " (Volume e intensidade elevados)";
    wod.pse = Math.min(10, wod.pse + 1);
  }

  return wod;
}
