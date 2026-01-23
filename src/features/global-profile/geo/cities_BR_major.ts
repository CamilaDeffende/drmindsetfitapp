export type BRCity = {
  name: string;
  regionCode: string;     // UF
  timeZone: string;       // IANA (MVP: usar TZ padrão do país com exceções leves)
  weight?: number;        // ranking simples (maior = aparece antes)
};

// MVP leve: principais cidades (expansão incremental depois)
// Observação: Brasil tem múltiplos fusos. MVP usa America/Sao_Paulo na maioria,
// e algumas exceções comuns (AM/AC/RO/RR/MT/MS/PA) para melhorar precisão.
export const CITIES_BR_MAJOR: readonly BRCity[] = [
  { name: "São Paulo", regionCode: "SP", timeZone: "America/Sao_Paulo", weight: 100 },
  { name: "Rio de Janeiro", regionCode: "RJ", timeZone: "America/Sao_Paulo", weight: 95 },
  { name: "Belo Horizonte", regionCode: "MG", timeZone: "America/Sao_Paulo", weight: 85 },
  { name: "Brasília", regionCode: "DF", timeZone: "America/Sao_Paulo", weight: 90 },
  { name: "Curitiba", regionCode: "PR", timeZone: "America/Sao_Paulo", weight: 80 },
  { name: "Porto Alegre", regionCode: "RS", timeZone: "America/Sao_Paulo", weight: 78 },
  { name: "Salvador", regionCode: "BA", timeZone: "America/Bahia", weight: 76 },
  { name: "Fortaleza", regionCode: "CE", timeZone: "America/Fortaleza", weight: 74 },
  { name: "Recife", regionCode: "PE", timeZone: "America/Recife", weight: 72 },
  { name: "Manaus", regionCode: "AM", timeZone: "America/Manaus", weight: 70 },
  { name: "Belém", regionCode: "PA", timeZone: "America/Belem", weight: 68 },
  { name: "Goiânia", regionCode: "GO", timeZone: "America/Sao_Paulo", weight: 66 },
  { name: "Florianópolis", regionCode: "SC", timeZone: "America/Sao_Paulo", weight: 64 },
  { name: "Vitória", regionCode: "ES", timeZone: "America/Sao_Paulo", weight: 62 },
  { name: "Natal", regionCode: "RN", timeZone: "America/Fortaleza", weight: 60 },
  { name: "João Pessoa", regionCode: "PB", timeZone: "America/Fortaleza", weight: 58 },
  { name: "Maceió", regionCode: "AL", timeZone: "America/Maceio", weight: 56 },
  { name: "Aracaju", regionCode: "SE", timeZone: "America/Maceio", weight: 54 },
  { name: "Cuiabá", regionCode: "MT", timeZone: "America/Cuiaba", weight: 52 },
  { name: "Campo Grande", regionCode: "MS", timeZone: "America/Campo_Grande", weight: 50 },
  { name: "Porto Velho", regionCode: "RO", timeZone: "America/Porto_Velho", weight: 48 },
  { name: "Rio Branco", regionCode: "AC", timeZone: "America/Rio_Branco", weight: 46 },
  { name: "Boa Vista", regionCode: "RR", timeZone: "America/Boa_Vista", weight: 44 },
  { name: "Palmas", regionCode: "TO", timeZone: "America/Araguaina", weight: 42 },
];
