export type MuscleGroup =
  | "Chest" | "Back" | "Shoulders" | "Biceps" | "Triceps"
  | "Legs" | "Glutes" | "Core" | "Full Body";

export type Equipment =
  | "Bodyweight" | "Dumbbell" | "Barbell" | "Machine" | "Bands";

export type Exercise = {
  id: string;
  name: string;
  primary: MuscleGroup;
  secondary?: MuscleGroup[];
  equipment: Equipment[];
  location: "Home" | "Gym" | "Both";
  level: "Beginner" | "Intermediate" | "Advanced";
  steps: string[];
  tips: string[];
};

export const exercises: Exercise[] = [
  {
    id: "pushup",
    name: "Push-up",
    primary: "Chest",
    secondary: ["Triceps","Core"],
    equipment: ["Bodyweight"],
    location: "Both",
    level: "Beginner",
    steps: ["Mãos abaixo do ombro, corpo em linha.", "Desça controlando e suba empurrando o chão."],
    tips: ["Cotovelo ~45°.", "Não colapse a lombar.", "Controle o tempo (2-0-2)."]
  },
  {
    id: "row_db",
    name: "One-arm Dumbbell Row",
    primary: "Back",
    secondary: ["Biceps"],
    equipment: ["Dumbbell"],
    location: "Gym",
    level: "Intermediate",
    steps: ["Apoie o tronco, coluna neutra.", "Puxe em direção ao quadril e desça controlando."],
    tips: ["Evite girar o tronco.", "Pense em 'cotovelo no bolso'."]
  },
  {
    id: "plank",
    name: "Plank",
    primary: "Core",
    equipment: ["Bodyweight"],
    location: "Both",
    level: "Beginner",
    steps: ["Alinhe ombro/cotovelo.", "Ative abdômen e glúteos.", "Respire e mantenha neutro."],
    tips: ["Quadril não pode cair.", "Pescoço neutro."]
  },
  {
    id: "squat",
    name: "Squat",
    primary: "Legs",
    secondary: ["Glutes","Core"],
    equipment: ["Barbell","Bodyweight"],
    location: "Both",
    level: "Intermediate",
    steps: ["Pés firmes e tronco estável.", "Desça mantendo joelhos alinhados.", "Suba empurrando o chão."],
    tips: ["Amplitude com controle.", "Sem colapsar joelho pra dentro."]
  }
];
