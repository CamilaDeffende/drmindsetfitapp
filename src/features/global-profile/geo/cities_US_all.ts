// src/features/global-profile/geo/cities_US_all.ts

export type USCity = {
  name: string;
  stateCode: string;   // ex: "CA", "NY"
  timeZone: string;    // IANA
  weight?: number;     // ranking simples (para ordenar sugestões)
};

// MVP: algumas cidades principais dos EUA.
// Depois dá pra expandir essa lista ou trocar por uma fonte externa.
const CITIES_US_MAJOR: readonly USCity[] = [
  { name: "New York", stateCode: "NY", timeZone: "America/New_York", weight: 100 },
  { name: "Los Angeles", stateCode: "CA", timeZone: "America/Los_Angeles", weight: 95 },
  { name: "Chicago", stateCode: "IL", timeZone: "America/Chicago", weight: 90 },
  { name: "Houston", stateCode: "TX", timeZone: "America/Chicago", weight: 85 },
  { name: "Phoenix", stateCode: "AZ", timeZone: "America/Phoenix", weight: 80 },
  { name: "Philadelphia", stateCode: "PA", timeZone: "America/New_York", weight: 78 },
  { name: "San Antonio", stateCode: "TX", timeZone: "America/Chicago", weight: 76 },
  { name: "San Diego", stateCode: "CA", timeZone: "America/Los_Angeles", weight: 74 },
  { name: "Dallas", stateCode: "TX", timeZone: "America/Chicago", weight: 72 },
  { name: "San Jose", stateCode: "CA", timeZone: "America/Los_Angeles", weight: 70 },
];

// 🔹 No futuro isso aqui pode receber dados de uma API.
// Por enquanto ele só usa a lista interna acima.
export function getCitiesByUSState(stateCode: string): USCity[] {
  const uf = (stateCode || "").toUpperCase().trim();
  if (!uf) return [];
  return CITIES_US_MAJOR.filter((c) => c.stateCode === uf);
}

// Indica se temos dados de cidades dos EUA carregados.
// Como é tudo local, sempre que o módulo existe consideramos "true".
export function isCitiesUSLoaded(): boolean {
  return CITIES_US_MAJOR.length > 0;
}