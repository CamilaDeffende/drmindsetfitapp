import { MetabolicInputV1, REEFormula, REEOutputV1 } from "./types";

const round = (n: number) => Math.round(n);

function mifflin(input: MetabolicInputV1): number {
  const { sex, weightKg, heightCm, ageYears } = input;
  const base = (10 * weightKg) + (6.25 * heightCm) - (5 * ageYears);
  return sex === "male" ? base + 5 : base - 161;
}

function harrisBenedict1984(input: MetabolicInputV1): number {
  const { sex, weightKg, heightCm, ageYears } = input;
  if (sex === "male") {
    return (13.397 * weightKg) + (4.799 * heightCm) - (5.677 * ageYears) + 88.362;
  }
  return (9.247 * weightKg) + (3.098 * heightCm) - (4.330 * ageYears) + 447.593;
}

function cunningham(input: MetabolicInputV1): number {
  if (typeof input.ffmKg !== "number") throw new Error("FFM required for Cunningham");
  return 500 + (22 * input.ffmKg);
}

function faoWhoUnu(input: MetabolicInputV1): number {
  const h = input.heightCm / 100; // metros
  const w = input.weightKg;
  const age = input.ageYears;
  const sex = input.sex;

  if (sex === "male") {
    if (age >= 10 && age < 18) return (16.6 * w) + (77 * h) + 572;
    if (age >= 18 && age < 30) return (15.4 * w) - (27 * h) + 717;
    if (age >= 30 && age < 60) return (11.3 * w) + (16 * h) + 901;
    return (8.8 * w) + (1128 * h) - 1071;
  } else {
    if (age >= 10 && age < 18) return (7.4 * w) + (482 * h) + 217;
    if (age >= 18 && age < 30) return (13.3 * w) + (334 * h) + 35;
    if (age >= 30 && age < 60) return (8.7 * w) - (25 * h) + 865;
    return (9.2 * w) + (637 * h) - 302;
  }
}

export function selectREEFormula(input: MetabolicInputV1): { formula: REEFormula; rationale: string } {
  if (input.preferredREEFormula) {
    if (input.preferredREEFormula === "cunningham_1980" && typeof input.ffmKg !== "number") {
      return {
        formula: "mifflin_st_jeor_1990",
        rationale: "Cunningham solicitado, mas FFM ausente; usando Mifflin como padrão seguro.",
      };
    }
    return { formula: input.preferredREEFormula, rationale: "Equação escolhida via modo profissional (preferredREEFormula)." };
  }

  if (typeof input.ffmKg === "number" && input.ffmKg > 0) {
    return { formula: "cunningham_1980", rationale: "FFM informado; Cunningham tende a ser superior quando composição corporal é confiável." };
  }
  return { formula: "mifflin_st_jeor_1990", rationale: "Sem FFM confiável; Mifflin é o padrão geral mais robusto." };
}

export function calcREE(input: MetabolicInputV1): REEOutputV1 {
  const { formula, rationale } = selectREEFormula(input);
  let ree: number;

  switch (formula) {
    case "mifflin_st_jeor_1990":
      ree = mifflin(input);
      break;
    case "harris_benedict_1984":
      ree = harrisBenedict1984(input);
      break;
    case "cunningham_1980":
      ree = cunningham(input);
      break;
    case "fao_who_unu":
      ree = faoWhoUnu(input);
      break;
    default:
      ree = mifflin(input);
  }

  return { formulaUsed: formula, reeKcalPerDay: round(ree), rationale };
}
