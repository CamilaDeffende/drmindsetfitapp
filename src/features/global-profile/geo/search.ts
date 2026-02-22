// src/features/global-profile/geo/search.ts

import { CITIES_BR_MAJOR, type BRCity } from "./cities_BR_major";
import { getCitiesByUF, isCitiesBRLoaded } from "./cities_BR_all";
import {
  getCitiesByUSState,
  isCitiesUSLoaded,
  type USCity,
} from "./cities_US_all";

type CityHit<T extends { name: string; regionCode: string; timeZone: string }> = T & {
  score: number;
};

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

  // 2) fallback: principais cidades
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

  // se não digitou nada, devolve as primeiras ordenadas
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

  if (uf && isCitiesUSLoaded()) {
    const all = getCitiesByUSState(uf);
    if (all && all.length > 0) {
      return [...all];
    }
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
   GENÉRICO POR PAÍS (usado no GlobalProfilePicker)
   ======================================================================= */

export function searchCitiesByCountry(
  countryCode: string,
  query: string,
  regionCode?: string,
  limit = 10
) {
  const cc = (countryCode || "").toUpperCase().trim();

  if (cc === "BR") {
    return searchCitiesBR(query, regionCode, limit);
  }

  if (cc === "US") {
    return searchCitiesUS(query, regionCode, limit);
  }

  // Espanha / outros: ainda não implementado
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