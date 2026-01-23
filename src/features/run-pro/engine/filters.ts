import type { GeoPoint, RunConfig } from "./types";

export function haversineM(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const h = s1 * s1 + Math.cos(lat1) * Math.cos(lat2) * s2 * s2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

export function isAccuracyOk(p: GeoPoint, cfg: RunConfig): boolean {
  if (typeof p.accuracy !== "number") return true; // não bloqueia se device não informa
  return p.accuracy <= cfg.maxAccuracyM;
}

export function isDeltaTOk(prev: GeoPoint | null, next: GeoPoint, cfg: RunConfig): boolean {
  if (!prev) return true;
  return next.ts - prev.ts >= cfg.minDeltaTms;
}

export function isSpeedOk(distM: number, deltaTms: number, cfg: RunConfig): boolean {
  if (deltaTms <= 0) return false;
  const speed = distM / (deltaTms / 1000);
  return speed <= cfg.maxSpeedMps;
}

export function isJumpOk(distM: number, cfg: RunConfig): boolean {
  return distM <= cfg.maxJumpM;
}
