export type MapProvider = "leaflet" | "google";

export type FeatureFlags = {
  GLOBAL_PROFILE_ENABLED: boolean;
  I18N_ENABLED: boolean;
  MAP_PROVIDER: MapProvider;
};
