export type ESCity = {
  name: string;
  regionCode: string;
  timeZone: string;
  weight?: number;
};

const ES_CACHE: Record<string, ESCity[]> = {};

export function isCitiesESLoaded(): boolean {
  return Object.keys(ES_CACHE).length > 0;
}

export async function loadCitiesES(regionCode: string): Promise<ESCity[]> {
  const uf = regionCode.toUpperCase().trim();
  if (!uf) return [];

  if (ES_CACHE[uf]) return ES_CACHE[uf];

  // GeoNames: busca cidades da região
  const url = `https://secure.geonames.org/searchJSON?username=demo&country=ES&adminCode1=${uf}&featureClass=P&maxRows=2000`;

  const resp = await fetch(url);
  if (!resp.ok) return [];

  const data: any = await resp.json();
  const list: ESCity[] = (data.geonames || []).map((g: any) => ({
    name: g.name,
    regionCode: uf,
    timeZone: g.timezone || "Europe/Madrid",
    weight: g.population || 0,
  }));

  ES_CACHE[uf] = list;
  return list;
}

export function getCitiesByESRegion(regionCode: string): ESCity[] {
  return ES_CACHE[regionCode.toUpperCase()] || [];
}