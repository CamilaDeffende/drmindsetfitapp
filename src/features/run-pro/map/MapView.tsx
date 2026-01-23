import { flags } from "@/features/flags/flags";
import { MapLeaflet } from "./MapLeaflet";
import { MapGoogle } from "./MapGoogle";

type Props = {
  center: { lat: number; lng: number };
  path?: Array<{ lat: number; lng: number }>;
  heightClassName?: string;
};

function hasGoogleKey(): boolean {
  const k = (import.meta as any).env?.VITE_GOOGLE_MAPS_KEY;
  return typeof k === "string" && k.trim().length > 0;
}

export function MapView(props: Props) {
  const provider = flags.MAP_PROVIDER;
  const googleOk = hasGoogleKey();

  if (provider === "google" && googleOk) {
    return <MapGoogle {...props} />;
  }

  // fallback premium: se google sem key ou qualquer caso -> Leaflet
  return <MapLeaflet {...props} />;
}
