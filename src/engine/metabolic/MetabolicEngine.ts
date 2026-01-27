export type Gender = "male" | "female" | "other";

export type MetabolicInput = {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  gender: Gender;
  activityFactor: number; // ex.: 1.2, 1.375, 1.55, 1.725
  goal: "cut" | "maintain" | "bulk";
};

export type MetabolicOutput = {
  bmrKcal: number;
  tdeeKcal: number;
  targetKcal: number;
  activityFactor: number;
  method: "mifflin";
};

function round(n: number) {
  return Math.round(n);
}

/**
 * Determinístico: Mifflin-St Jeor (padrão)
 * male: 10W + 6.25H - 5A + 5
 * female: 10W + 6.25H - 5A - 161
 * other: usa média conservadora (0) sem +5/-161
 */
export function computeMetabolic(input: MetabolicInput): MetabolicOutput {
  const W = input.weightKg;
  const H = input.heightCm;
  const A = input.ageYears;

  let sexConst = 0;
  if (input.gender === "male") sexConst = 5;
  if (input.gender === "female") sexConst = -161;

  const bmr = (10 * W) + (6.25 * H) - (5 * A) + sexConst;
  const tdee = bmr * input.activityFactor;

  let target = tdee;
  if (input.goal === "cut") target = tdee - 400;
  if (input.goal === "bulk") target = tdee + 250;

  // clamp mínimo seguro (não médico, só evita absurdo)
  if (target < 1200) target = 1200;

  return {
    bmrKcal: round(bmr),
    tdeeKcal: round(tdee),
    targetKcal: round(target),
    activityFactor: input.activityFactor,
    method: "mifflin",
  };
}
