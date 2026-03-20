import { OnboardingTrainingInput } from "../core/types";

export function inferConstraintsProfile(input: OnboardingTrainingInput): string[] {
  const out = [...(input.constraints ?? []), ...(input.limitations ?? []), ...(input.painFlags ?? [])];
  if ((input.sessionDurationMin ?? 60) <= 35) out.push("janela de tempo curta");
  if ((input.monthsDetrained ?? 0) >= 6) out.push("retorno após pausa longa");
  return Array.from(new Set(out.filter(Boolean)));
}
