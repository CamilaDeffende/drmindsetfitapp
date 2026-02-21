export type IBGEUf = {
  id: number;
  sigla: string;
  nome: string;
};

export type IBGECity = {
  id: number;
  nome: string;
};

export type BRCity = {
  name: string;
  regionCode: string; // UF
  timeZone: string;   // IANA
  weight?: number;
};

// Cache interno por UF
const CITY_CACHE: Record<string, BRCity[]> = {};

// Mapeamento real dos fusos brasileiros
function inferTimeZoneFromUF(uf: string): string {
  switch (uf.toUpperCase()) {
    case "AC":
      return "America/Rio_Branco";
    case "AM":
    case "RR":
      return "America/Manaus";
    case "RO":
      return "America/Porto_Velho";
    case "MT":
      return "America/Cuiaba";
    case "MS":
      return "America/Campo_Grande";
    case "PA":
    case "AP":
      return "America/Belem";
    case "BA":
      return "America/Bahia";
    case "AL":
    case "SE":
    case "PE":
    case "PB":
    case "RN":
      return "America/Fortaleza";
    case "TO":
      return "America/Araguaina";
    default:
      return "America/Sao_Paulo";
  }
}

/**
 * Busca TODAS as cidades de uma UF via API oficial do IBGE.
 * Exemplo:
 * https://servicodados.ibge.gov.br/api/v1/localidades/estados/RJ/municipios
 */
export async function fetchCitiesByUF(uf: string): Promise<BRCity[]> {
  const code = uf.toUpperCase().trim();
  if (!code) return [];

  // 1 — Cache
  if (CITY_CACHE[code]) {
    return CITY_CACHE[code];
  }

  const url = `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${code}/municipios`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error("[IBGE] Erro ao buscar cidades:", res.status, res.statusText);
      return [];
    }

    const data: IBGECity[] = await res.json();
    const tz = inferTimeZoneFromUF(code);

    const cities: BRCity[] = data.map((c, index) => ({
      name: c.nome,
      regionCode: code,
      timeZone: tz,
      weight: 10000 - index, // ajuda no ranking
    }));

    // Boost para capitais + grandes centros
    const capitalsBoost = [
      "São Paulo",
      "Rio de Janeiro",
      "Belo Horizonte",
      "Brasília",
      "Curitiba",
      "Salvador",
      "Porto Alegre",
      "Recife",
      "Fortaleza",
      "Manaus",
    ];

    for (const city of cities) {
      if (capitalsBoost.includes(city.name)) {
        city.weight = (city.weight || 0) + 20000;
      }
    }

    CITY_CACHE[code] = cities;
    return cities;
  } catch (err) {
    console.error("[IBGE] Falha de rede:", err);
    return [];
  }
}