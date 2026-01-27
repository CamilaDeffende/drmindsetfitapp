export type Sex = "male" | "female";

export type Goal = "lose_fat" | "recomp" | "gain_muscle" | "performance";

export type ActivityFrequency =
  | "sedentary"
  | "moderately_active"   // 1–3x/sem
  | "active"              // 3–5x/sem
  | "very_active";        // 5x+/sem

export type AssessmentMethod =
  | "bioimpedance"
  | "pollock_7"
  | "circumferences"
  | "unknown";

export type EngineUserInput = {
  ageYears?: number;
  sex?: Sex;
  weightKg?: number;
  heightCm?: number;

  activityFrequency?: ActivityFrequency;
  goal?: Goal;

  assessmentMethod?: AssessmentMethod;

  // opcionais p/ métodos
  pollock7?: { sum7mm?: number };
  bioimpedance?: { bfPercent?: number };
  circumferences?: { waistCm?: number; hipCm?: number; neckCm?: number };
};

export type MetabolismOutput = {
  bmrKcal: number;
  tdeeKcal: number;
  targetKcal: number;
  activityFactor: number;
  goalDeltaKcal: number;
};

export type BodyfatOutput = {
  bfPercent?: number;
  source: "bioimpedance" | "pollock_7" | "circumferences" | "fallback" | "none";
  notes: string[];
};

export type EngineOutput = {
  metabolism?: MetabolismOutput;
  bodyfat?: BodyfatOutput;
};
