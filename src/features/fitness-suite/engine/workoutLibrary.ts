export type ActivityLevel = "iniciante" | "intermediario" | "avancado";
export type IntensityKey = "leve" | "moderada" | "alta";
export type ModalityKey = "musculacao" | "funcional" | "corrida" | "bike_indoor" | "crossfit";

export type Exercise = {
  id: string;
  nome: string;
  grupamento?: string;
  tags?: string[]; // ex: ["push","pull","quad","glute","core","conditioning"]
};

export type SessionPrescription = {
  series?: number;
  reps?: string;      // "8-12" | "AMRAP" | "30s"
  descanso?: string;  // "60-90s"
  rpe?: string;       // "RPE 6-7"
  observacoes?: string;
};

export type SessionExercise = Exercise & SessionPrescription;

export type DayWorkout = {
  dia: string;
  modalidade: ModalityKey;
  titulo: string;
  grupamentos: string[];
  exercicios: SessionExercise[];
};

export type WorkoutPlan = {
  divisaoSemanal: string;
  frequencia: number;
  treinos: DayWorkout[];
};

// Biblioteca base (MVP) — expandimos forte no próximo bloco
// A variação vem de: pool + shuffle + seed + regras por nível/intensidade
export const LIB: Record<ModalityKey, Exercise[]> = {
  musculacao: [
    { id: "supino_reto", nome: "Supino reto (barra/halter)", grupamento: "Peito", tags: ["push"] },
    { id: "supino_inclinado", nome: "Supino inclinado", grupamento: "Peito", tags: ["push"] },
    { id: "remada_curvada", nome: "Remada curvada", grupamento: "Costas", tags: ["pull"] },
    { id: "puxada_frontal", nome: "Puxada frontal (pulley)", grupamento: "Costas", tags: ["pull"] },
    { id: "agachamento", nome: "Agachamento livre / guiado", grupamento: "Pernas", tags: ["quad","glute"] },
    { id: "leg_press", nome: "Leg press", grupamento: "Pernas", tags: ["quad","glute"] },
    { id: "terra_romeno", nome: "Levantamento terra romeno", grupamento: "Posterior", tags: ["hinge","hamstring"] },
    { id: "elev_lateral", nome: "Elevação lateral", grupamento: "Ombros", tags: ["delts"] },
    { id: "desenvolvimento", nome: "Desenvolvimento (halter/barra)", grupamento: "Ombros", tags: ["push","delts"] },
    { id: "rosca_direta", nome: "Rosca direta", grupamento: "Bíceps", tags: ["arms"] },
    { id: "triceps_pulley", nome: "Tríceps no pulley", grupamento: "Tríceps", tags: ["arms"] },
    { id: "prancha", nome: "Prancha", grupamento: "Core", tags: ["core"] },
  ],
  funcional: [
    { id: "burpee", nome: "Burpee", tags: ["conditioning"] },
    { id: "kettlebell_swing", nome: "Kettlebell swing", tags: ["hinge","conditioning"] },
    { id: "agachamento_goblet", nome: "Agachamento goblet", tags: ["quad","glute"] },
    { id: "afundo", nome: "Afundo alternado", tags: ["legs"] },
    { id: "flexao", nome: "Flexão de braço", tags: ["push"] },
    { id: "remada_elastico", nome: "Remada com elástico", tags: ["pull"] },
    { id: "mountain_climber", nome: "Mountain climber", tags: ["core","conditioning"] },
    { id: "abdominal_deadbug", nome: "Dead bug", tags: ["core"] },
    { id: "corrida_estacionaria", nome: "Corrida estacionária (skipping)", tags: ["conditioning"] },
    { id: "agilidade_cones", nome: "Agilidade (cones/escada)", tags: ["agility"] },
  ],
  corrida: [
    { id: "easy_run", nome: "Corrida leve (Z2)", tags: ["aerobic"] },
    { id: "tempo_run", nome: "Tempo run (limiar)", tags: ["threshold"] },
    { id: "intervals", nome: "Intervalado (tiros)", tags: ["vo2"] },
    { id: "hill_repeats", nome: "Subidas (hill repeats)", tags: ["strength"] },
    { id: "long_run", nome: "Longão progressivo", tags: ["endurance"] },
  ],
  bike_indoor: [
    { id: "z2_ride", nome: "Bike Z2 (cadência controlada)", tags: ["aerobic"] },
    { id: "threshold_ride", nome: "Limiar (blocos)", tags: ["threshold"] },
    { id: "hiit_ride", nome: "HIIT (sprints)", tags: ["vo2"] },
    { id: "climb_ride", nome: "Subida simulada (resistência)", tags: ["strength"] },
    { id: "endurance_ride", nome: "Endurance contínuo", tags: ["endurance"] },
  ],
  crossfit: [
    { id: "amrap", nome: "AMRAP (12–20min)", tags: ["metcon"] },
    { id: "emom", nome: "EMOM (10–18min)", tags: ["metcon"] },
    { id: "for_time", nome: "For Time (rounds)", tags: ["metcon"] },
    { id: "strength_olympic", nome: "Técnica + força (levantamentos)", tags: ["strength"] },
    { id: "gymnastics", nome: "Ginástica (progressões)", tags: ["skills"] },
  ],
};

export function normalizeModality(raw: unknown): ModalityKey | null {
  const s = String(raw ?? "").toLowerCase();
  if (s.includes("muscu")) return "musculacao";
  if (s.includes("func")) return "funcional";
  if (s.includes("corr")) return "corrida";
  if (s.includes("bike") || s.includes("spinning") || s.includes("indoor")) return "bike_indoor";
  if (s.includes("cross")) return "crossfit";
  return null;
}
