import { calculateREEAuto } from "@/services/nutrition/energyEquations";

export type Gender = "male" | "female" | "other";

export type MetabolicInput = {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  gender: Gender;
  bodyFatPercent?: number;
  fatFreeMassKg?: number;
  activityLevel?: "sedentary" | "light" | "moderate" | "high" | "athlete";
  isAthlete?: boolean;
  activityFactor: number; // ex.: 1.2, 1.375, 1.55, 1.725
  goal: "cut" | "maintain" | "bulk";
};

export type MetabolicOutput = {
  bmrKcal: number;
  tdeeKcal: number;
  targetKcal: number;
  activityFactor: number;
  equationUsed?: string;
  reeKcalAuto?: number;
  method: "mifflin" | "auto";
};

function round(n: number) {
  return Math.round(n);
}

/**
 * Determin stico: Mifflin-St Jeor (padr o)
 * male: 10W + 6.25H - 5A + 5
 * female: 10W + 6.25H - 5A - 161
 * other: usa m dia conservadora (0) sem +5/-161
 */
export function computeMetabolic(input: MetabolicInput): MetabolicOutput {
  /* MF_AUTO_REE_V1 */
// MindsetFit Scientific REE (auto-equation)
const sex: "male" | "female" = input.gender === "female" ? "female" : "male";

const auto = calculateREEAuto({
  sex,
  age: input.ageYears,
  weightKg: input.weightKg,
  heightCm: input.heightCm,
  bodyFatPercent: (input as any).bodyFatPercent,
  fatFreeMassKg: (input as any).fatFreeMassKg,
  activityLevel: (input as any).activityLevel,
  isAthlete: Boolean((input as any).isAthlete),
});

const bmr = auto.reeKcal;
  const tdee = bmr * input.activityFactor;

  let target = tdee;
  if (input.goal === "cut") target = tdee - 400;
  if (input.goal === "bulk") target = tdee + 250;

  // clamp m nimo seguro (n o m dico, s  evita absurdo)
  if (target < 1200) target = 1200;

  return {
    bmrKcal: round(bmr),
    tdeeKcal: round(tdee),
    targetKcal: round(target),
    activityFactor: input.activityFactor,
    method: "mifflin",
  };
}
