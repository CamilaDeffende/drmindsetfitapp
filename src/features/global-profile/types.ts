export type UnitSystem = "metric" | "imperial";

export type GlobalProfile = {
  version: number;            // schema version (migração simples)
  locale: string;             // ex: "pt-BR"
  timeZone: string;           // IANA ex: "America/Sao_Paulo"
  units: UnitSystem;          // metric/imperial
  countryCode: string;        // ISO-3166-1 alpha-2 ex: "BR"
  regionCode?: string;        // ex: "RJ"
  city?: string;              // ex: "Rio de Janeiro"
  updatedAt: number;          // epoch ms
};

export type GlobalProfileState = {
  profile: GlobalProfile;
  setProfile: (next: Partial<GlobalProfile>) => void;
  resetProfile: () => void;
};
