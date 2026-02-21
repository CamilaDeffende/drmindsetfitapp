import { CITIES_BR_MAJOR, type BRCity } from "./cities_BR_major";

type CityHit = BRCity & { score: number };

function norm(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

export function searchCitiesBR(
  query: string,
  regionCode?: string,
  limit = 10
): BRCity[] {
  const q = norm(query || "");
  const hasQuery = q.length > 0;

  const uf = (regionCode || "").toUpperCase().trim();

  const hits: CityHit[] = [];
  for (const c of CITIES_BR_MAJOR) {
    // filtra pela UF se tiver sido informada
    if (uf && c.regionCode !== uf) continue;

    const name = norm(c.name);

    // se tem texto de busca, exige match; se não tem, mostra as cidades da UF
    if (hasQuery) {
      const idx = name.indexOf(q);
      if (idx === -1) continue;

      const weight = c.weight || 0;
      const score = (idx === 0 ? 1000 : 500) + weight - idx;
      hits.push({ ...c, score });
    } else {
      // sem texto: usa só o peso como ranking
      const weight = c.weight || 0;
      const score = 100 + weight;
      hits.push({ ...c, score });
    }
  }

  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit);
}

// debounce zero-deps
export function debounce<T extends (...args: any[]) => void>(fn: T, waitMs: number) {
  let t: any;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), waitMs);
  };
}