import { CITIES_BR_MAJOR, type BRCity } from "./cities_BR_major";
import {
  getCitiesByUF,
  isCitiesBRLoaded,
} from "./cities_BR_all";

type CityHit = BRCity & { score: number };

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/**
 * Retorna a lista base de cidades para a busca:
 * - se IBGE já carregou, usa TODAS as cidades da UF
 * - se ainda não, usa fallback com as capitais/principais cidades
 */
function getSourceCities(regionCode?: string): BRCity[] {
  const uf = (regionCode || "").toUpperCase().trim();

  // 1) tenta IBGE
  if (uf && isCitiesBRLoaded()) {
    const all = getCitiesByUF(uf);
    if (all && all.length > 0) {
      return [...all];
    }
  }

  // 2) fallback: cidades principais
  return CITIES_BR_MAJOR.filter((c) =>
    uf ? c.regionCode === uf : true
  );
}

export function searchCitiesBR(
  query: string,
  regionCode?: string,
  limit = 10
): BRCity[] {
  const q = norm(query || "");
  const uf = (regionCode || "").toUpperCase().trim();

  const base = getSourceCities(uf);
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

  const hits: CityHit[] = [];
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

// debounce zero-deps
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