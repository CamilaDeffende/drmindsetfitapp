export type Sex = "male" | "female" | "other" | "unknown";
export type Goal = "cut" | "maintain" | "bulk";
export type Biotype = "ecto" | "meso" | "endo" | "unknown";

export type ActivityMeta = {
  palKey?: string;
  frequencyPerWeek?: number;
  activityFactor?: number;
};

export type BodyProfile = {
  weightKg?: number;
  heightCm?: number;
  age?: number;
  sex?: Sex;
  athlete?: boolean;
};

export type BodyComp = {
  ffmKg?: number;
  bfPercent?: number;
};

export type MetabolismInput = {
  selectedEquation?:
    | "cunningham"
    | "fao-who"
    | "harris-benedict"
    | "mifflin"
    | "tinsley"
    | "auto";
};

export type NutritionInput = {
  goal?: Goal;
  strategyPercent?: number;
};

export type SSOTInputs = {
  profile: BodyProfile;
  bodyComp?: BodyComp;
  activity?: ActivityMeta;
  biotype?: Biotype;
  metabolism?: MetabolismInput;
  nutrition?: NutritionInput;
};

export type SSOTWarnings =
  | { code: "missing_profile"; message: string }
  | { code: "missing_activity"; message: string }
  | { code: "missing_freq"; message: string }
  | { code: "clamp_applied"; message: string }
  | { code: "ffm_missing_for_selected"; message: string }
  | { code: "fallback_used"; message: string }
  | { code: "extreme_values"; message: string };

export type SSOTAuditTrace = {
  timestamp: string;
  storageKey: string;
  reeMethod: string;
  reeKcal: number;
  activityFactorRaw?: number;
  activityFactorFinal: number;
  tdeeKcal: number;
  goal?: Goal;
  targetKcal: number;
  clamp?: { min: number; max: number; applied: boolean };
};

export type SSOTOutputs = {
  metabolic: {
    reeKcal: number;
    activityFactor: number;
    tdeeKcal: number;
  };
  nutrition: {
    targetKcal: number;
  };
  safeRange: {
    min: number;
    ideal: number;
    max: number;
  };
  audit: {
    trace: SSOTAuditTrace;
    warnings: SSOTWarnings[];
  };
};
