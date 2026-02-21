// src/features/global-profile/geo/search.ts

import { fetchCitiesByUF, type BRCity } from "./cities_BR_all";

type CityHit = BRCity & { score: number };

function norm(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

/**
 * Lista todas as cidades de uma UF (sem filtro por nome).
 * Ex.: usar para popular o select de cidade depois que o usuário escolhe o estado.
 */
export async function getCitiesByRegionCode(
  regionCode: string
): Promise<BRCity[]> {
  const uf = (regionCode || "").toUpperCase().trim();
  if (!uf) return [];
  return fetchCitiesByUF(uf);
}

/**
 * Busca cidades por nome dentro de uma UF, usando os dados do IBGE.
 * - `query` = texto digitado (ex.: "petro", "camp", etc.)
 * - `regionCode` = UF (ex.: "RJ", "SP")
 * - `limit` = máximo de resultados
 */
export async function searchCitiesBR(
  query: string,
  regionCode?: string,
  limit = 10
): Promise<BRCity[]> {
  const q = norm(query || "");
  const uf = (regionCode || "").toUpperCase().trim();

  // Sem UF definida, não buscamos (evita chamar IBGE pra todos os estados)
  if (!uf) return [];
  const allCities = await fetchCitiesByUF(uf);
  if (!q) {
    // Sem texto de busca → devolve as primeiras (ordenadas por peso)
    return allCities.slice(0, limit);
  }

  const hits: CityHit[] = [];
  for (const c of allCities) {
    const name = norm(c.name);
    const idx = name.indexOf(q);
    if (idx === -1) continue;

    const weight = c.weight || 0;
    const score = (idx === 0 ? 1000 : 500) + weight - idx;
    hits.push({ ...c, score });
  }

  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit);
}

/**
 * debounce zero-deps (pode ser usado no input de busca, se precisar)
 */
export function debounce<T extends (...args: any[]) => void | Promise<void>>(
  fn: T,
  waitMs: number
) {
  let t: any;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), waitMs);
  };
}