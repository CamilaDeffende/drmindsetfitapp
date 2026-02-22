import { REGIONS_US } from "./regions_US";

export type USCity = {
  name: string;
  stateCode: string;   // ex: "CA"
  stateName: string;   // ex: "California"
  timeZone: string;    // IANA, ex: "America/Los_Angeles"
  weight?: number;     // ranking simples (maior = aparece antes)
};

// Para o MVP vamos usar um mapa básico por estado.
// Pode ir expandindo essa lista depois conforme a necessidade.
const US_CITIES_BY_STATE: Record<string, USCity[]> = {
  CA: [
    {
      name: "Los Angeles",
      stateCode: "CA",
      stateName: "California",
      timeZone: "America/Los_Angeles",
      weight: 100,
    },
    {
      name: "San Francisco",
      stateCode: "CA",
      stateName: "California",
      timeZone: "America/Los_Angeles",
      weight: 90,
    },
    {
      name: "San Diego",
      stateCode: "CA",
      stateName: "California",
      timeZone: "America/Los_Angeles",
      weight: 80,
    },
  ],
  NY: [
    {
      name: "New York",
      stateCode: "NY",
      stateName: "New York",
      timeZone: "America/New_York",
      weight: 100,
    },
    {
      name: "Buffalo",
      stateCode: "NY",
      stateName: "New York",
      timeZone: "America/New_York",
      weight: 70,
    },
  ],
  FL: [
    {
      name: "Miami",
      stateCode: "FL",
      stateName: "Florida",
      timeZone: "America/New_York",
      weight: 100,
    },
    {
      name: "Orlando",
      stateCode: "FL",
      stateName: "Florida",
      timeZone: "America/New_York",
      weight: 90,
    },
    {
      name: "Tampa",
      stateCode: "FL",
      stateName: "Florida",
      timeZone: "America/New_York",
      weight: 80,
    },
  ],
  TX: [
    {
      name: "Houston",
      stateCode: "TX",
      stateName: "Texas",
      timeZone: "America/Chicago",
      weight: 100,
    },
    {
      name: "Dallas",
      stateCode: "TX",
      stateName: "Texas",
      timeZone: "America/Chicago",
      weight: 90,
    },
    {
      name: "Austin",
      stateCode: "TX",
      stateName: "Texas",
      timeZone: "America/Chicago",
      weight: 85,
    },
  ],
  // Estados extras podem ser adicionados aqui depois
};

// Marca como "carregado" porque é tudo estático em memória.
export function isCitiesUSLoaded(): boolean {
  return true;
}

export function getCitiesByUSState(stateCode: string): USCity[] {
  const uf = (stateCode || "").toUpperCase().trim();
  return US_CITIES_BY_STATE[uf] || [];
}