// cities_BR_all.ts
// Carregamento completo de TODAS as cidades brasileiras usando IBGE
// https://servicodados.ibge.gov.br/api/v1/localidades/municipios

export type BRCity = {
  name: string;
  regionCode: string;  // UF
  timeZone: string;
  weight?: number;
};

export type CitiesBRAll = Record<string, readonly BRCity[]>;

const STORAGE_KEY = "drmindsetfit.cities_br_all.v1";

let _CITIES_BR_ALL: CitiesBRAll = {};
let _loaded = false;

/**
 * Tenta carregar do localStorage
 */
function loadFromCache(): CitiesBRAll | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) {
      return parsed as CitiesBRAll;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Salva no localStorage
 */
function saveToCache(data: CitiesBRAll) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

/**
 * Converte payload do IBGE → CitiesBRAll
 */
function transformIBGECities(raw: any[]): CitiesBRAll {
  const map: CitiesBRAll = {};

  for (const c of raw) {
    const nome = c.nome;
    const uf = c.microrregiao.mesorregiao.UF.sigla.toUpperCase();

    if (!map[uf]) map[uf] = [];

    map[uf] = [
      ...map[uf],
      {
        name: nome,
        regionCode: uf,
        timeZone: "America/Sao_Paulo", // default leve
        weight: 1,
      }
    ];
  }

  // Ordena alfabeticamente por UF
  for (const uf of Object.keys(map)) {
    map[uf] = map[uf].sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR")
    );
  }

  return map;
}

/**
 * Carrega todas as cidades do Brasil (API IBGE)
 */
export async function loadAllCitiesBR(): Promise<CitiesBRAll> {
  if (_loaded) return _CITIES_BR_ALL;

  // 1) tenta pegar do cache
  const cached = loadFromCache();
  if (cached) {
    _CITIES_BR_ALL = cached;
    _loaded = true;
    return cached;
  }

  // 2) buscar do IBGE
  try {
    const resp = await fetch(
      "https://servicodados.ibge.gov.br/api/v1/localidades/municipios"
    );
    const json = await resp.json();

    const mapped = transformIBGECities(json);

    _CITIES_BR_ALL = mapped;
    _loaded = true;
    saveToCache(mapped);

    return mapped;
  } catch (e) {
    console.error("[IBGE] Erro ao carregar cidades:", e);
    return {};
  }
}

/**
 * Obtém cidades de uma UF específica
 */
export function getCitiesByUF(uf: string): readonly BRCity[] {
  const key = (uf || "").toUpperCase();
  return _CITIES_BR_ALL[key] || [];
}

/**
 * Saber se o carregamento já ocorreu
 */
export function isCitiesBRLoaded() {
  return _loaded;
}

/**
 * Export default (compat)
 */
export const CITIES_BR_ALL = _CITIES_BR_ALL;