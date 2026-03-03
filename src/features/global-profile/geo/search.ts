import { CITIES_BR_MAJOR, type BRCity } from "./cities_BR_major";
import { getCitiesByUF, isCitiesBRLoaded } from "./cities_BR_all";

import {
  ensureCitiesUSLoaded,
  getCitiesByUSState,
  isCitiesUSLoaded,
  type USCity,
} from "./cities_US_all";

import {
  getCitiesByESRegion,
  // mantido só se quiser usar depois; não usamos agora
  type ESCity,
} from "./cities_ES_all";

type CityHit<
  T extends {
    name: string;
    regionCode?: string;
    stateCode?: string;
    timeZone: string;
    weight?: number;
  }
> = T & { score: number };

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/* =======================================================================
   BRASIL
   ======================================================================= */

function getSourceCitiesBR(regionCode?: string): BRCity[] {
  const uf = (regionCode || "").toUpperCase().trim();

  // 1) tenta IBGE
  if (uf && isCitiesBRLoaded()) {
    const all = getCitiesByUF(uf);
    if (all && all.length > 0) {
      return [...all];
    }
  }

  // 2) fallback: cidades principais
  return CITIES_BR_MAJOR.filter((c) => (uf ? c.regionCode === uf : true));
}

export function searchCitiesBR(
  query: string,
  regionCode?: string,
  limit = 10
): BRCity[] {
  const q = norm(query || "");
  const uf = (regionCode || "").toUpperCase().trim();

  const base = getSourceCitiesBR(uf);
  if (base.length === 0) return [];

  // Se não digitou nada, devolve as primeiras cidades ordenadas
  if (!q) {
    return base
      .slice()
      .sort((a, b) => {
        const wa = a.weight ?? 0;
        const wb = b.weight ?? 0;
        if (wa !== wb) return wb - wa;
        return a.name.localeCompare(b.name, "pt-BR");
      })
      .slice(0, limit);
  }

  const hits: CityHit<BRCity>[] = [];
  for (const c of base) {
    const name = norm(c.name);
    const idx = name.indexOf(q);
    if (idx === -1) continue;

    const weight = c.weight || 0;
    const score = (idx === 0 ? 1000 : 500) + weight - idx;
    hits.push({ ...c, score });
  }

  if (!hits.length) return [];
  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit);
}

/* =======================================================================
   EUA
   ======================================================================= */

function getSourceCitiesUS(regionCode?: string): USCity[] {
  const uf = (regionCode || "").toUpperCase().trim();
  if (!uf) return [];

  // se ainda não carregamos esse estado, dispara o carregamento em background
  if (!isCitiesUSLoaded(uf)) {
    void ensureCitiesUSLoaded(uf);
    return [];
  }

  const all = getCitiesByUSState(uf);
  if (all && all.length > 0) {
    return [...all];
  }

  return [];
}

export function searchCitiesUS(
  query: string,
  regionCode?: string,
  limit = 10
): USCity[] {
  const q = norm(query || "");
  const uf = (regionCode || "").toUpperCase().trim();

  const base = getSourceCitiesUS(uf);
  if (base.length === 0) return [];

  if (!q) {
    return base
      .slice()
      .sort((a, b) => {
        const wa = a.weight ?? 0;
        const wb = b.weight ?? 0;
        if (wa !== wb) return wb - wa;
        return a.name.localeCompare(b.name, "en-US");
      })
      .slice(0, limit);
  }

  const hits: CityHit<USCity>[] = [];
  for (const c of base) {
    const name = norm(c.name);
    const idx = name.indexOf(q);
    if (idx === -1) continue;

    const weight = c.weight || 0;
    const score = (idx === 0 ? 1000 : 500) + weight - idx;
    hits.push({ ...c, score });
  }

  if (!hits.length) return [];
  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit);
}

/* =======================================================================
   ESPANHA
   ======================================================================= */

function getSourceCitiesES(regionCode?: string): ESCity[] {
  const code = (regionCode || "").toUpperCase().trim();
  if (!code) return [];

  // Simples: pega direto do cities_ES_all.ts; sem lazy-load
  const all = getCitiesByESRegion(code);
  if (all && all.length > 0) {
    return [...all];
  }

  return [];
}

export function searchCitiesES(
  query: string,
  regionCode?: string,
  limit = 10
): ESCity[] {
  const q = norm(query || "");
  const code = (regionCode || "").toUpperCase().trim();

  const base = getSourceCitiesES(code);
  if (base.length === 0) return [];

  if (!q) {
    return base
      .slice()
      .sort((a, b) => {
        const wa = a.weight ?? 0;
        const wb = b.weight ?? 0;
        if (wa !== wb) return wb - wa;
        return a.name.localeCompare(b.name, "es-ES");
      })
      .slice(0, limit);
  }

  const hits: CityHit<ESCity>[] = [];
  for (const c of base) {
    const name = norm(c.name);
    const idx = name.indexOf(q);
    if (idx === -1) continue;

    const weight = c.weight || 0;
    const score = (idx === 0 ? 1000 : 500) + weight - idx;
    hits.push({ ...c, score });
  }

  if (!hits.length) return [];
  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit);
}

/* =======================================================================
   GENÉRICO POR PAÍS (usado pelo GlobalProfilePicker)
   ======================================================================= */

export function searchCitiesByCountry(
  countryCode: string,
  query: string,
  regionCode?: string,
  limit = 10
) {
  const cc = (countryCode || "").toUpperCase().trim();

  if (cc === "BR") return searchCitiesBR(query, regionCode, limit);
  if (cc === "US") return searchCitiesUS(query, regionCode, limit);
  if (cc === "ES") return searchCitiesES(query, regionCode, limit);

  // outros países ainda não implementados
  return [];
}

/* =======================================================================
   debounce zero-deps
   ======================================================================= */

export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  waitMs: number
) {
  let t: any;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), waitMs);
  };
}