import { OnboardingTrainingInput } from "../core/types";

export function inferConstraintsProfile(input: OnboardingTrainingInput): string[] {
  const out = [...input.limitations, ...input.painFlags];
  if (input.sessionDurationMin <= 35) out.push("janela de tempo curta");
  if (input.monthsDetrained >= 6) out.push("retorno após pausa longa");
  return Array.from(new Set(out));
}
