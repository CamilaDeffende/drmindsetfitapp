/**
 * Harris-Benedict Equation (Revised, 1984)
 * Equação clássica amplamente validada
 *
 * Male:   BMR = 88.362 + (13.397 × W) + (4.799 × H) - (5.677 × A)
 * Female: BMR = 447.593 + (9.247 × W) + (3.098 × H) - (4.330 × A)
 *
 * W = peso (kg), H = altura (cm), A = idade (anos)
 */

export type Gender = "male" | "female" | "other";

export type HarrisBenedictInput = {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  gender: Gender;
};

export type HarrisBenedictOutput = {
  bmrKcal: number;
  method: "harris-benedict";
};

function round(n: number): number {
  return Math.round(n);
}

/**
 * Calcula BMR usando equação de Harris-Benedict revisada (1984)
 */
export function computeHarrisBenedict(input: HarrisBenedictInput): HarrisBenedictOutput {
  const W = input.weightKg;
  const H = input.heightCm;
  const A = input.ageYears;

  let bmr: number;

  if (input.gender === "male") {
    bmr = 88.362 + (13.397 * W) + (4.799 * H) - (5.677 * A);
  } else if (input.gender === "female") {
    bmr = 447.593 + (9.247 * W) + (3.098 * H) - (4.330 * A);
  } else {
    // Para "other", usa média das duas equações
    const maleValue = 88.362 + (13.397 * W) + (4.799 * H) - (5.677 * A);
    const femaleValue = 447.593 + (9.247 * W) + (3.098 * H) - (4.330 * A);
    bmr = (maleValue + femaleValue) / 2;
  }

  return {
    bmrKcal: round(bmr),
    method: "harris-benedict",
  };
}
