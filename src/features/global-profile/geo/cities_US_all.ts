// src/features/global-profile/geo/cities_US_all.ts

import { REGIONS_US } from "./regions_US";

export type USCity = {
  name: string;
  stateCode: string;   // ex: "CA"
  stateName: string;   // ex: "California"
  timeZone: string;    // IANA, ex: "America/Los_Angeles"
  weight?: number;
};

type StateCode = string;

const usCitiesByState: Record<StateCode, USCity[]> = {};
const usLoadingByState: Record<StateCode, Promise<USCity[]>> = {};

// normaliza código de estado
function normalizeStateCode(code: string): StateCode {
  return (code || "").toUpperCase().trim();
}

function getStateNameFromCode(code: string): string {
  const st = REGIONS_US.find((r) => r.code === code);
  return st?.name ?? code;
}

// chute decente de timezone por estado (não precisa ser perfeito, só pro preview)
function guessTimeZone(code: string): string {
  const west = ["CA", "WA", "OR", "NV", "AZ", "ID"];
  const mountain = ["CO", "UT", "NM", "WY", "MT"];
  const central = [
    "TX",
    "OK",
    "KS",
    "NE",
    "SD",
    "ND",
    "LA",
    "AR",
    "MO",
    "IA",
    "MN",
    "WI",
    "IL",
    "AL",
    "MS",
    "TN",
  ];
  const eastern = [
    "NY",
    "NJ",
    "PA",
    "VA",
    "NC",
    "SC",
    "GA",
    "FL",
    "OH",
    "MI",
    "IN",
    "KY",
    "WV",
    "MD",
    "DE",
    "MA",
    "CT",
    "RI",
    "NH",
    "VT",
    "ME",
    "DC",
  ];

  if (west.includes(code)) return "America/Los_Angeles";
  if (mountain.includes(code)) return "America/Denver";
  if (central.includes(code)) return "America/Chicago";
  if (eastern.includes(code)) return "America/New_York";

  return "America/New_York";
}

/**
 * Carrega (via API) e cacheia as cidades de um estado dos EUA.
 * Usa countriesnow.space (API pública) como fonte.
 */
export async function ensureCitiesUSLoaded(stateCode: string): Promise<USCity[]> {
  const code = normalizeStateCode(stateCode);
  if (!code) return [];

  // já carregado
  if (usCitiesByState[code]) return usCitiesByState[code];

  // já tem request em andamento
  if (usLoadingByState[code]) return usLoadingByState[code];

  const stateName = getStateNameFromCode(code);

  const promise = fetch(
    "https://countriesnow.space/api/v0.1/countries/state/cities",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        country: "United States",
        state: stateName,
      }),
    }
  )
    .then(async (res) => {
      if (!res.ok) {
        console.warn(
          "[cities_US_all] resposta ruim para",
          code,
          res.status
        );
        return [];
      }

      const json: any = await res.json();
      // a API costuma devolver em json.data, mas deixo um fallback
      const list: string[] = json?.data || json?.cities || [];
      const tz = guessTimeZone(code);

      const cities: USCity[] = (list || [])
        .filter((name) => typeof name === "string" && name.trim())
        .map((name) => ({
          name,
          stateCode: code,
          stateName,
          timeZone: tz,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, "en-US"));

      usCitiesByState[code] = cities;
      return cities;
    })
    .catch((err) => {
      console.error(
        "[cities_US_all] erro ao buscar cidades de",
        code,
        err
      );
      usCitiesByState[code] = [];
      return [];
    })
    .finally(() => {
      delete usLoadingByState[code];
    });

  usLoadingByState[code] = promise;
  return promise;
}

/**
 * Retorna do cache (sem disparar request nova).
 */
export function getCitiesByUSState(stateCode: string): USCity[] {
  const code = normalizeStateCode(stateCode);
  const cities = usCitiesByState[code];
  return cities ? [...cities] : [];
}

/**
 * Diz se já temos cidades carregadas para esse estado.
 */
export function isCitiesUSLoaded(stateCode: string): boolean {
  const code = normalizeStateCode(stateCode);
  return !!usCitiesByState[code];
}