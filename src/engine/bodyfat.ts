import type { BodyfatOutput, EngineUserInput } from "./types";

/**
 * Referências:
 * - Jackson & Pollock (1978, 1980) — Equações 7 dobras (densidade corporal)
 * - Siri (1961): %BF = (495 / D) - 450
 * - US Navy Body Fat (DoD / procedimentos amplamente difundidos)
 *
 * Regras do engine:
 * - Sem chute: se faltar dado ou cair em domínio inválido (log10), retorna undefined + notes.
 * - Funções puras/determinísticas.
 */

function siri(density: number): number {
  return 495 / density - 450;
}

/**
 * Pollock 7 dobras (mm)
 * Requer: sexo, idade, soma7(mm)
 */
function pollock7Density(sex: "male" | "female", age: number, sum7mm: number): number {
  if (sex === "male") {
    return (
      1.112 -
      0.00043499 * sum7mm +
      0.00000055 * Math.pow(sum7mm, 2) -
      0.00028826 * age
    );
  }
  return (
    1.097 -
    0.00046971 * sum7mm +
    0.00000056 * Math.pow(sum7mm, 2) -
    0.00012828 * age
  );
}

/**
 * US Navy (% gordura) — medidas em cm
 * Masculino:
 *  %BF = 86.010 * log10(cintura - pescoço) - 70.041 * log10(altura) + 36.76
 *
 * Feminino:
 *  %BF = 163.205 * log10(cintura + quadril - pescoço)
 *       - 97.684 * log10(altura) - 78.387
 */
function usNavyBodyfat(
  sex: "male" | "female",
  heightCm: number,
  waistCm: number,
  neckCm: number,
  hipCm?: number
): number {
  if (heightCm <= 0) return NaN;

  if (sex === "male") {
    const x = waistCm - neckCm;
    if (x <= 0) return NaN;
    return 86.010 * Math.log10(x) - 70.041 * Math.log10(heightCm) + 36.76;
  }

  if (typeof hipCm !== "number") return NaN;
  const y = waistCm + hipCm - neckCm;
  if (y <= 0) return NaN;

  return 163.205 * Math.log10(y) - 97.684 * Math.log10(heightCm) - 78.387;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function calcBodyfat(input: EngineUserInput): BodyfatOutput {
  const notes: string[] = [];

  // 1) Bioimpedância (direto)
  const bfBio = input.bioimpedance?.bfPercent;
  if (typeof bfBio === "number" && bfBio > 0 && bfBio < 80) {
    return {
      bfPercent: round1(bfBio),
      source: "bioimpedance",
      notes: ["Fonte: bioimpedância informada pelo usuário."]
    };
  }

  // 2) Pollock 7
  const sum7 = input.pollock7?.sum7mm;
  const sex = input.sex;
  const age = input.ageYears;

  if (typeof sum7 === "number" && sum7 > 0) {
    if (!sex) notes.push("Pollock 7: falta sexo (male/female).");
    if (age == null) notes.push("Pollock 7: falta idade (anos).");

    if (sex && age != null) {
      const density = pollock7Density(sex, age, sum7);
      const bf = siri(density);

      if (Number.isFinite(bf) && bf > 0 && bf < 80) {
        return {
          bfPercent: round1(bf),
          source: "pollock_7",
          notes: [
            "Método: Jackson & Pollock (7 dobras) → densidade corporal",
            "Conversão: Siri (1961)",
            "Requer dobras bem coletadas (padronização/anatomia)"
          ]
        };
      }
      notes.push("Pollock 7: cálculo inválido (verificar medidas/idade).");
    }

    return { bfPercent: undefined, source: "pollock_7", notes };
  }

  // 3) Circunferências (US Navy)
  const c = input.circumferences;
  if (c?.waistCm || c?.neckCm || c?.hipCm) {
    if (!sex) notes.push("US Navy: falta sexo (male/female).");
    if (!input.heightCm) notes.push("US Navy: falta altura (cm).");
    if (!c?.waistCm) notes.push("US Navy: falta cintura (cm).");
    if (!c?.neckCm) notes.push("US Navy: falta pescoço (cm).");
    if (sex === "female" && !c?.hipCm) notes.push("US Navy: para mulheres falta quadril (cm).");

    if (sex && input.heightCm && c?.waistCm && c?.neckCm) {
      const bf = usNavyBodyfat(sex, input.heightCm, c.waistCm, c.neckCm, c.hipCm);
      if (Number.isFinite(bf) && bf > 0 && bf < 80) {
        return {
          bfPercent: round1(bf),
          source: "circumferences",
          notes: [
            "Método: US Navy (circunferências)",
            "Bom quando dobras não estão disponíveis",
            "Sensível a erro de medida (fita/ponto anatômico)"
          ]
        };
      }
      notes.push("US Navy: domínio inválido (log10) — verifique medidas (cintura/pescoço/quadril/altura).");
      return { bfPercent: undefined, source: "circumferences", notes };
    }

    return { bfPercent: undefined, source: "circumferences", notes };
  }

  // 4) Sem dados suficientes
  return {
    bfPercent: undefined,
    source: "none",
    notes: ["Dados insuficientes para estimar % gordura sem chute."]
  };
}
