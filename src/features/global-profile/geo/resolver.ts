import type { UnitSystem } from "../types";
import { getCountry } from "./countries";
import { CITIES_BR_MAJOR } from "./cities_BR_major";

export type ResolvedGlobal = {
  locale: string;
  timeZone: string;
  units: UnitSystem;
};

export function resolveByCountry(countryCode?: string): ResolvedGlobal {
  const c = getCountry(countryCode);
  return {
    locale: c?.defaultLocale || "pt-BR",
    timeZone: c?.defaultTimeZone || "America/Sao_Paulo",
    units: c?.defaultUnits || "metric",
  };
}

export function resolveByCityBR(cityName?: string, regionCode?: string): Pick<ResolvedGlobal, "timeZone"> {
  const qCity = (cityName || "").trim().toLowerCase();
  const qUF = (regionCode || "").trim().toUpperCase();
  if (!qCity) return { timeZone: "America/Sao_Paulo" };

  const found = CITIES_BR_MAJOR.find((c) => {
    if (qUF && c.regionCode !== qUF) return false;
    return c.name.toLowerCase() === qCity;
  });

  return { timeZone: found?.timeZone || "America/Sao_Paulo" };
}
