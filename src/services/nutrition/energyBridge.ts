import { calculateREEAuto } from "@/services/nutrition/energyEquations";

type AnyObj = Record<string, any>;

/**
 * MF Bridge
 * - Converte o formato do onboarding (que pode variar) em UserEnergyInputs.
 * - Mantém o app resiliente a renomes de campos.
 */
export function mfGetREEFromOnboarding(profile: AnyObj) {
  const sexRaw =
    profile?.sexo ?? profile?.sex ?? profile?.genero ?? profile?.gender ?? "male";
  const sex = String(sexRaw).toLowerCase().startsWith("f") ? "female" : "male";

  const age = Number(profile?.idade ?? profile?.age ?? 0);
  const weightKg = Number(profile?.peso ?? profile?.weightKg ?? profile?.weight ?? 0);
  const heightCm = Number(profile?.altura ?? profile?.heightCm ?? profile?.height ?? 0);

  // composição corporal
  const bodyFatPercent =
    profile?.percentualGordura ??
    profile?.bodyFatPercent ??
    profile?.bfPercent ??
    undefined;

  const fatFreeMassKg =
    profile?.massaMagra ??
    profile?.fatFreeMassKg ??
    profile?.ffmKg ??
    undefined;

  // atividade/atleta
  const activityLevel =
    profile?.nivelAtividade ??
    profile?.activityLevel ??
    profile?.activity ??
    undefined;

    const isAthlete = Boolean(profile?.isAthlete === true || String(activityLevel || "").toLowerCase() === "athlete");

  // Hard guard: se faltam dados básicos, não deixa quebrar
  if (!age || !weightKg || !heightCm) {
    // Retorna null seguro — o chamador decide fallback
    return null;
  }

  const out = calculateREEAuto({
    sex,
    age,
    weightKg,
    heightCm,
    bodyFatPercent: bodyFatPercent != null ? Number(bodyFatPercent) : undefined,
    fatFreeMassKg: fatFreeMassKg != null ? Number(fatFreeMassKg) : undefined,
    activityLevel: activityLevel || undefined,
    isAthlete: Boolean(isAthlete),
  });

  return out; // { reeKcal, equation }
}
