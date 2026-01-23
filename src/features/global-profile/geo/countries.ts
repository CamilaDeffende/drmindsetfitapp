import type { UnitSystem } from "../types";

export type Country = {
  code: string;        // ISO-3166-1 alpha-2
  name: string;        // nome exibido (pt-BR por enquanto)
  defaultLocale: string;
  defaultTimeZone: string; // IANA
  defaultUnits: UnitSystem;
};

export const COUNTRIES: readonly Country[] = [
  {
    code: "BR",
    name: "Brasil",
    defaultLocale: "pt-BR",
    defaultTimeZone: "America/Sao_Paulo",
    defaultUnits: "metric",
  },
  {
    code: "US",
    name: "Estados Unidos",
    defaultLocale: "en-US",
    defaultTimeZone: "America/New_York",
    defaultUnits: "imperial",
  },
  {
    code: "ES",
    name: "Espanha",
    defaultLocale: "es-ES",
    defaultTimeZone: "Europe/Madrid",
    defaultUnits: "metric",
  },
];

export function getCountry(code?: string): Country | undefined {
  const c = (code || "").toUpperCase();
  return COUNTRIES.find((x) => x.code === c);
}
