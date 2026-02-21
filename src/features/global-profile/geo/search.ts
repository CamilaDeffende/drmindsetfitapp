import type { BRCity } from "./cities_BR_major"; // reaproveita o tipo
import { CITIES_BR_ALL } from "./cities_BR_all";

type CityHit = BRCity & { score: number };

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/**
 * Busca cidades brasileiras, filtrando por UF (regionCode).
 *
 * - Se tiver UF e NÃO tiver texto de busca → devolve todas as cidades da UF (limitadas).
 * - Se tiver UF e texto → busca só dentro da UF.
 * - Se NÃO tiver UF, mas tiver texto → busca no Brasil todo (fallback).
 */
export function searchCitiesBR(
  query: string,
  regionCode?: string,
  limit = 200
): BRCity[] {
  const uf = (regionCode || "").toUpperCase().trim();

  // base de cidades:
  let base: BRCity[] = [];

  if (uf) {
    // cidades da UF selecionada
    base = (CITIES_BR_ALL[uf] || []) as BRCity[];
  } else {
    // sem UF → fallback: todas as cidades (pode ser pesado, mas é só fallback)
    base = Object.values(CITIES_BR_ALL).flat() as BRCity[];
  }

  const q = norm(query || "");

  // Sem texto digitado:
  // - Se tiver UF → lista ordenada da UF
  // - Se não tiver UF → nada (espera usuário digitar algo)
  if (!q) {
    if (!uf) return [];
    const sorted = [...base].sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR")
    );
    return sorted.slice(0, limit);
  }

  // Com texto digitado → ranqueia por melhor match no nome
  const hits: CityHit[] = [];
  for (const c of base) {
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

// debounce zero-deps, pra evitar flood de busca enquanto digita
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