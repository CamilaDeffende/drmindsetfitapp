import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { GlobalProfile, GlobalProfileState } from "./types";
import { DEFAULT_PROFILE_BR, PROFILE_SCHEMA_VERSION, getDefaultProfileByCountry } from "./defaults";
import { safeTimeZoneOrDefault } from "./tz";

const STORAGE_KEY = "drmindsetfit.globalProfile.v1";

function migrateProfile(persisted: any): GlobalProfile {
  const base = getDefaultProfileByCountry(persisted?.countryCode || "BR");
  const version = Number(persisted?.version || 0);

  // migração simples por versão
  if (version !== PROFILE_SCHEMA_VERSION) {
    return {
      ...base,
      ...persisted,
      version: PROFILE_SCHEMA_VERSION,
      timeZone: safeTimeZoneOrDefault(persisted?.timeZone),
      updatedAt: Date.now(),
    };
  }

  return {
    ...base,
    ...persisted,
    timeZone: safeTimeZoneOrDefault(persisted?.timeZone),
    updatedAt: Number(persisted?.updatedAt || Date.now()),
  };
}

const storage = createJSONStorage(() => {
  // guard: Vite SPA, mas evita quebrar em ambientes sem window
  if (typeof window === "undefined") return undefined as any;
  return window.localStorage;
});

export const useGlobalProfileStore = create<GlobalProfileState>()(
  persist(
    (set, get) => ({
      profile: DEFAULT_PROFILE_BR,
      setProfile: (next) => {
        const current = get().profile;
        const merged: GlobalProfile = migrateProfile({ ...current, ...next, updatedAt: Date.now() });
        set({ profile: merged });
      },
      resetProfile: () => set({ profile: DEFAULT_PROFILE_BR }),
    }),
    {
      name: STORAGE_KEY,
      storage,
      version: PROFILE_SCHEMA_VERSION,
      partialize: (s) => ({ profile: s.profile }),
      migrate: (persisted: any) => {
        const p = persisted?.profile ? migrateProfile(persisted.profile) : DEFAULT_PROFILE_BR;
        return { profile: p } as any;
      },
    }
  )
);
