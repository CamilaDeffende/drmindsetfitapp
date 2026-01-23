export type MuscleGroup =
  | "peito"
  | "costas"
  | "ombros"
  | "biceps"
  | "triceps"
  | "quadriceps"
  | "posterior"
  | "gluteos"
  | "panturrilhas"
  | "core";

export type ExecutionType = "peso_livre" | "maquina" | "guiado";

export type BiomechLevel = "basico" | "intermediario" | "avancado";

export type StrengthEquipment =
  | "barra"
  | "halter"
  | "kettlebell"
  | "peso_corporal"
  | "maquina"
  | "cabo"
  | "smith"
  | "banco"
  | "rack"
  | "leg_press"
  | "bola_suica"
  | "anilhas";

export type StrengthExercise = {
  id: string; // slug estável
  name: string;
  group: MuscleGroup;
  executionType: ExecutionType;
  biomechLevel: BiomechLevel;

  // contexto técnico (para UI/engine)
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  equipment: StrengthEquipment[];

  // dicas (curtas e úteis)
  cues?: string[];
  commonMistakes?: string[];
  notes?: string[];

  // flags de segurança simples (não é "contexto de saúde", é técnico do exercício)
  requiresSpotter?: boolean;
  unilateral?: boolean;
  compound?: boolean;
};
