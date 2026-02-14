import type { Profile } from "@/types/profile";

const LS_KEY = "drmindsetfit.profile.v1";

/**
 * MVP Premium (Phase 1.2):
 * - Fonte inicial: localStorage (mock determinístico)
 * - Pronto para ser trocado por Supabase/Firebase depois, sem refatorar o app.
 */

export function getDefaultProfile(userId: string): Profile {
  // timezone/locale: usa Intl quando possível (sem chamadas externas)
  const tz =
    (() => {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo";
      } catch {
        return "America/Sao_Paulo";
      }
    })();

  const locale =
    (() => {
      try {
        return Intl.DateTimeFormat().resolvedOptions().locale || "pt-BR";
      } catch {
        return "pt-BR";
      }
    })();

  return {
    id: userId,
    full_name: "",
    avatar_url: null,
    gender: null,
    birth_date: null,
    country: null,
    state: null,
    city: null,
    timezone: tz,
    locale,
    units: { weight: "kg", distance: "km" },
    updated_at: new Date().toISOString(),
  };
}

export async function loadProfile(userId: string): Promise<Profile> {
  // Simula I/O sem aleatoriedade (determinístico).
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return getDefaultProfile(userId);
    const parsed = JSON.parse(raw) as Profile;
    if (!parsed?.id) return getDefaultProfile(userId);
    // Se trocar de usuário, reseta pro default do novo userId
    if (parsed.id !== userId) return getDefaultProfile(userId);
    return parsed;
  } catch {
    return getDefaultProfile(userId);
  }
}

export async function saveProfile(next: Profile): Promise<Profile> {
  const withMeta: Profile = { ...next, updated_at: new Date().toISOString() };
  localStorage.setItem(LS_KEY, JSON.stringify(withMeta));
  return withMeta;
}

export function clearProfileCache(): void {
  localStorage.removeItem(LS_KEY);
}
