import type { GlobalProfile } from "./types";
import { formatDateTime } from "./format";

export function getProfileTimeZone(profile?: Pick<GlobalProfile, "timeZone">): string {
  return profile?.timeZone || "America/Sao_Paulo";
}

// “agora no fuso do perfil” (não muda Date internamente; retorna string formatada no TZ)
export function nowFormatted(profile?: Pick<GlobalProfile, "locale" | "timeZone">): string {
  return formatDateTime(Date.now(), profile);
}

// util de fallback seguro para Intl (se TZ inválido, cai no default)
export function safeTimeZoneOrDefault(tz?: string): string {
  const fallback = "America/Sao_Paulo";
  if (!tz) return fallback;
  try {
    // validação mínima: tenta instanciar formatter
    new Intl.DateTimeFormat("en-US", { timeZone: tz }).format(new Date());
    return tz;
  } catch {
    return fallback;
  }
}
