import type { UnitSystem } from "./types";

// distâncias em metros
export function metersToKm(m: number): number {
  return m / 1000;
}
export function metersToMiles(m: number): number {
  return m / 1609.344;
}
export function kmToMeters(km: number): number {
  return km * 1000;
}
export function milesToMeters(mi: number): number {
  return mi * 1609.344;
}

export function formatDistanceValue(meters: number, units: UnitSystem): { value: number; unit: "km" | "mi" } {
  if (units === "imperial") return { value: metersToMiles(meters), unit: "mi" };
  return { value: metersToKm(meters), unit: "km" };
}

// pace: segundos por km (base). Para imperial, converter para segundos por milha.
export function paceSecPerKmToSecPerMile(secPerKm: number): number {
  return secPerKm * 1.609344;
}

export function speedMpsToKph(mps: number): number {
  return mps * 3.6;
}
export function speedMpsToMph(mps: number): number {
  return mps * 2.2369362920544;
}
