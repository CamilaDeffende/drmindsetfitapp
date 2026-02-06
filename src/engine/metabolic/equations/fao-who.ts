/**
 * FAO/WHO Equations (2001)
 * Baseadas em faixas etárias específicas
 * Recomendadas pela OMS para populações diversas
 */

export type Gender = "male" | "female" | "other";

export type FAOWHOInput = {
  weightKg: number;
  ageYears: number;
  gender: Gender;
};

export type FAOWHOOutput = {
  bmrKcal: number;
  method: "fao-who";
  ageGroup: string;
};

function round(n: number): number {
  return Math.round(n);
}

/**
 * Calcula BMR usando equações FAO/WHO por faixa etária
 */
export function computeFAOWHO(input: FAOWHOInput): FAOWHOOutput {
  const W = input.weightKg;
  const A = input.ageYears;

  let bmr: number;
  let ageGroup: string;

  if (input.gender === "male") {
    if (A >= 18 && A <= 30) {
      // 18-30 anos (homens)
      bmr = (15.057 * W) + 692.2;
      ageGroup = "18-30 anos";
    } else if (A > 30 && A <= 60) {
      // 31-60 anos (homens)
      bmr = (11.472 * W) + 873.1;
      ageGroup = "31-60 anos";
    } else if (A > 60) {
      // >60 anos (homens)
      bmr = (11.711 * W) + 587.7;
      ageGroup = ">60 anos";
    } else {
      // <18 anos - fallback para 18-30
      bmr = (15.057 * W) + 692.2;
      ageGroup = "18-30 anos (fallback)";
    }
  } else if (input.gender === "female") {
    if (A >= 18 && A <= 30) {
      // 18-30 anos (mulheres)
      bmr = (14.818 * W) + 486.6;
      ageGroup = "18-30 anos";
    } else if (A > 30 && A <= 60) {
      // 31-60 anos (mulheres)
      bmr = (8.126 * W) + 845.6;
      ageGroup = "31-60 anos";
    } else if (A > 60) {
      // >60 anos (mulheres)
      bmr = (9.082 * W) + 658.5;
      ageGroup = ">60 anos";
    } else {
      // <18 anos - fallback para 18-30
      bmr = (14.818 * W) + 486.6;
      ageGroup = "18-30 anos (fallback)";
    }
  } else {
    // Para "other", usa média das equações male e female
    const maleValue = A <= 30 ? (15.057 * W) + 692.2 :
                      A <= 60 ? (11.472 * W) + 873.1 :
                                (11.711 * W) + 587.7;
    const femaleValue = A <= 30 ? (14.818 * W) + 486.6 :
                        A <= 60 ? (8.126 * W) + 845.6 :
                                  (9.082 * W) + 658.5;
    bmr = (maleValue + femaleValue) / 2;
    ageGroup = A <= 30 ? "18-30 anos" : A <= 60 ? "31-60 anos" : ">60 anos";
  }

  return {
    bmrKcal: round(bmr),
    method: "fao-who",
    ageGroup,
  };
}
