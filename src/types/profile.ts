export type Units = {
  weight: "kg" | "lb";
  distance: "km" | "mi";
};

export type Gender = "male" | "female" | "other" | "prefer_not_to_say";

export type Profile = {
  id: string; // normalmente igual ao user.id do Auth
  full_name: string;
  avatar_url?: string | null;
  gender?: Gender | null;
  birth_date?: string | null; // ISO yyyy-mm-dd

  country?: string | null;
  state?: string | null;
  city?: string | null;

  timezone?: string | null; // IANA ex: "America/Sao_Paulo"
  locale?: string | null;   // ex: "pt-BR"

  units: Units;

  updated_at?: string | null; // ISO datetime
};
