export type RunningGoal = "5K" | "10K" | "21K" | "42K" | "SAUDE";

export type RunningLevel = "INICIANTE" | "INTERMEDIARIO" | "AVANCADO";

export type IntensityModel = "HR" | "PACE" | "RPE" | "HYBRID";

export type Zone = "Z1" | "Z2" | "Z3" | "Z4" | "Z5";

export type WorkoutType =
  | "CORRIDA_LEVE_Z1Z2"
  | "CONTINUA_MODERADA"
  | "TEMPO_RUN"
  | "INTERVALADO_CURTO"
  | "INTERVALADO_MEDIO"
  | "INTERVALADO_LONGO"
  | "FARTLEK_ESTRUTURADO"
  | "LONGAO"
  | "LONGAO_PROGRESSIVO"
  | "REGENERATIVO"
  | "FORCA_ESPECIFICA";

export type WorkoutFocus =
  | "BASE_AEROBIA"
  | "LIMIAR"
  | "VO2MAX"
  | "ECONOMIA"
  | "ENDURANCE"
  | "RECUPERACAO"
  | "FORCA";

export type WorkoutPrescription = {
  type: WorkoutType;
  focus: WorkoutFocus;
  title: string;
  description: string;
  durationMin?: number;
  distanceKm?: number;
  blocks?: Array<{
    label: string;
    durationMin?: number;
    distanceKm?: number;
    zone?: Zone;
    rpe?: number; // 1..10
    note?: string;
  }>;
  intensity: {
    model: IntensityModel;
    hrPercentMax?: [number, number];  // ex: [60,75]
    hrPercentReserve?: [number, number];
    paceHint?: string; // ex: "conversável", "ritmo de 10K", "forte controlado"
    rpe?: [number, number];
    zoneHint?: string; // ex: "Z2"
    timeInZoneMin?: number;
  };
  techniqueNotes?: string[];
};

export type WeekPlan = {
  meta: {
    level: RunningLevel;
    goal: RunningGoal;
    daysPerWeek: number;
    weekIndex: number; // 1..N
    volumeHintKm?: number;
    distributionHint?: { easyPct: number; qualityPct: number };
  };
  sessions: Array<{
    dayLabel: string;
    workout: WorkoutPrescription;
  }>;
};

export type RunnerInputs = {
  level: RunningLevel;
  goal: RunningGoal;
  daysPerWeek: 3 | 4 | 5 | 6;
  weekIndex?: number;
  hasStrength?: boolean; // integrar força
};
