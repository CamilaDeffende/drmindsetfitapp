import type { FeatureFlags, MapProvider } from "./types";

function envBool(v: unknown, fallback: boolean): boolean {
  if (typeof v !== "string") return fallback;
  const s = v.trim().toLowerCase();
  if (s === "1" || s === "true" || s === "yes" || s === "on") return true;
  if (s === "0" || s === "false" || s === "no" || s === "off") return false;
  return fallback;
}

function envMapProvider(v: unknown, fallback: MapProvider): MapProvider {
  if (typeof v !== "string") return fallback;
  const s = v.trim().toLowerCase();
  return (s === "google" || s === "leaflet") ? (s as MapProvider) : fallback;
}

export const flags: FeatureFlags = {
  GLOBAL_PROFILE_ENABLED: envBool((import.meta as any).env?.VITE_GLOBAL_PROFILE_ENABLED, true),
  I18N_ENABLED: envBool((import.meta as any).env?.VITE_I18N_ENABLED, true),
  MAP_PROVIDER: envMapProvider((import.meta as any).env?.VITE_MAP_PROVIDER, "leaflet"),
};
