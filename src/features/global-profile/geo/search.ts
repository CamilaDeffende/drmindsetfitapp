import { CITIES_BR_MAJOR, type BRCity } from "./cities_BR_major";

type CityHit = BRCity & { score: number };

// Normaliza texto (remove acentos etc.)
function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/**
 * Busca de cidades com 3 comportamentos:
 *
 * 1) Sem query e sem UF → []
 * 2) Sem query e com UF → lista todas as cidades daquela UF
 * 3) Com query → busca normal filtrando pelo texto digitado
 */
export function searchCitiesBR(
  query: string,
  regionCode?: string,
  limit = 10
): BRCity[] {
  const q = norm(query || "");
  const uf = (regionCode || "").toUpperCase().trim();

  // 1) Sem query e sem UF → nenhum contexto para sugerir
  if (!q && !uf) {
    return [];
  }

  // 2) Sem query e com UF → retorna todas as cidades da UF ordenadas por peso
  if (!q && uf) {
    return CITIES_BR_MAJOR
      .filter((c) => c.regionCode === uf)
      .sort((a, b) => (b.weight || 0) - (a.weight || 0))
      .slice(0, limit);
  }

  // 3) Query preenchida → busca normal
  const hits: CityHit[] = [];

  for (const c of CITIES_BR_MAJOR) {
    // Se UF está selecionada, filtra por ela
    if (uf && c.regionCode !== uf) continue;

    const name = norm(c.name);
    const idx = name.indexOf(q);
    if (idx === -1) continue;

    // Score: início do nome > peso > posição no nome
    const weight = c.weight || 0;
    const score = (idx === 0 ? 1000 : 500) + weight - idx;

    hits.push({ ...c, score });
  }

  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit);
}

// Debounce nativo leve
export function debounce<T extends (...args: any[]) => void>(fn: T, waitMs: number) {
  let t: any;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), waitMs);
  };
}