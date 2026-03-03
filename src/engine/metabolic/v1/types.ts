export type Sex = "male" | "female";

export type REEFormula =
  | "mifflin_st_jeor_1990"
  | "harris_benedict_1984"
  | "cunningham_1980"
  | "fao_who_unu";

export type ActivityIntensity = "leve" | "moderada" | "alta";

export type TrainingModality =
  | "funcional"
  | "musculacao"
  | "crossfit"
  | "bike_indoor"
  | "ciclismo_outdoor"
  | "corrida";

export type Goal = "cutting" | "maintenance" | "bulking";

export type SessionInputV1 = {
  modality: TrainingModality;
  intensity: ActivityIntensity;
  minutes: number;
};

export type MetabolicInputV1 = {
  sex: Sex;
  ageYears: number;
  weightKg: number;
  heightCm: number;

  ffmKg?: number;
  preferredREEFormula?: REEFormula;

  trainingFrequencyPerWeek: number; // 0..7
  trainingOverallIntensity: ActivityIntensity;

  weeklySessions?: SessionInputV1[];

  goal: Goal;

  reportedIntakeKcalPerDay?: number;
};

export type AthleteAlertV1 = {
  code:
    | "EA_LOW_POSSIBLE"
    | "DEFICIT_TOO_AGGRESSIVE"
    | "SURPLUS_TOO_HIGH"
    | "MISSING_FFM_FOR_EA"
    | "GENERAL_SAFETY_NOTE";
  severity: "info" | "warning" | "high";
  message: string;
  action: string;
};

export type REEOutputV1 = {
  formulaUsed: REEFormula;
  reeKcalPerDay: number;
  rationale: string;
};

export type TDEEOutputV1 = {
  pal: number;
  tdeeBaseKcalPerDay: number;
  eatAvgKcalPerDay: number;
  tdeeFinalKcalPerDay: number;
};

export type MacroTargetsV1 = {
  caloriesTargetKcalPerDay: number;
  proteinGPerDay: number;
  fatGPerDay: number;
  carbsGPerDay: number;
};

export type MetabolicPlanResultV1 = {
  version: "v1";
  ree: REEOutputV1;
  tdee: TDEEOutputV1;
  goal: Goal;
  goalRange: {
    deficitOrSurplusPercent: number;
    rangeLabel: string;
  };
  macros: MacroTargetsV1;
  athleteAlerts: AthleteAlertV1[];
  limitations: string[];
};
