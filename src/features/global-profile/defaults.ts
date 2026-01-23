import type { GlobalProfile } from "./types";

export const PROFILE_SCHEMA_VERSION = 1;

export const DEFAULT_PROFILE_BR: GlobalProfile = {
  version: PROFILE_SCHEMA_VERSION,
  countryCode: "BR",
  regionCode: "RJ",
  city: "Rio de Janeiro",
  locale: "pt-BR",
  timeZone: "America/Sao_Paulo",
  units: "metric",
  updatedAt: Date.now(),
};

export function getDefaultProfileByCountry(countryCode?: string): GlobalProfile {
  // por enquanto: BR como fallback seguro e premium (expansão incremental nos próximos blocos)
  if ((countryCode || "").toUpperCase() === "BR") return DEFAULT_PROFILE_BR;
  return {
    ...DEFAULT_PROFILE_BR,
    countryCode: (countryCode || "BR").toUpperCase(),
    updatedAt: Date.now(),
  };
}
