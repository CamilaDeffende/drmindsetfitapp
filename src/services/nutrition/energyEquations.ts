/**
 * MindsetFit Scientific Energy Engine (v2)
 * Seleção automática fidedigna de equações metabólicas.
 *
 * Equações:
 * - Mifflin-St Jeor (1990)   -> clínica padrão ouro
 * - Cunningham (1980)       -> atleta + massa magra alta
 * - Katch-McArdle (1996)    -> composição corporal (% gordura)
 * - FAO/WHO/UNU (2004)      -> fallback populacional
 */

export type Sex = "male" | "female";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "high"
  | "athlete";

export type EnergyEquationId =
  | "CUNNINGHAM_1980"
  | "KATCH_MCARDLE_1996"
  | "MIFFLIN_ST_JEOR_1990"
  | "FAO_WHO_UNU_2004";

export type UserEnergyInputs = {
  sex: Sex;
  age: number;
  weightKg: number;
  heightCm: number;

  bodyFatPercent?: number;
  fatFreeMassKg?: number;

  activityLevel?: ActivityLevel;
  isAthlete?: boolean;
};

export function computeIMC(weightKg: number, heightCm: number) {
  const h = heightCm / 100;
  return weightKg / (h * h);
}

export function deriveFFM(weightKg: number, bodyFatPercent: number) {
  return weightKg * (1 - bodyFatPercent / 100);
}

/**
 * ✅ Seleção MindsetFit:
 * 1) Atleta + FFM → Cunningham
 * 2) Tem composição corporal → Katch
 * 3) Sobrepeso/obesidade → Mifflin
 * 4) Sem dados → FAO fallback
 */
export function selectBestEquation(input: UserEnergyInputs): EnergyEquationId {
  const imc = computeIMC(input.weightKg, input.heightCm);

  const athlete =
    input.isAthlete === true || input.activityLevel === "athlete";

  const hasFFM = typeof input.fatFreeMassKg === "number";
  const hasBF = typeof input.bodyFatPercent === "number";

  if (athlete && hasFFM) return "CUNNINGHAM_1980";
  if (hasFFM || hasBF) return "KATCH_MCARDLE_1996";
  if (imc >= 25) return "MIFFLIN_ST_JEOR_1990";

  return "FAO_WHO_UNU_2004";
}

export function calculateREEAuto(input: UserEnergyInputs) {
  const eq = selectBestEquation(input);

  const ffm = input.fatFreeMassKg ??
    (input.bodyFatPercent != null
      ? deriveFFM(input.weightKg, input.bodyFatPercent)
      : null);

  let ree = 0;

  switch (eq) {
    case "CUNNINGHAM_1980":
      ree = 500 + 22 * (ffm || 0);
      break;

    case "KATCH_MCARDLE_1996":
      ree = 370 + 21.6 * (ffm || 0);
      break;

    case "MIFFLIN_ST_JEOR_1990": {
      const s = input.sex === "male" ? 5 : -161;
      ree =
        10 * input.weightKg +
        6.25 * input.heightCm -
        5 * input.age +
        s;
      break;
}
    case "FAO_WHO_UNU_2004":
      ree = 24 * input.weightKg;
      break;
  }

  return {
    reeKcal: Math.round(ree),
    equation: eq,
  };
}
