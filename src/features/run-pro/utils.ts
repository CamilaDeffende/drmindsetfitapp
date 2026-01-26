import type { TrackPoint, Split, Session } from "./types";

const R = 6371000; // meters

export function haversineM(a: TrackPoint, b: TrackPoint): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const s =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Compat legado: alguns arquivos antigos esperam distM */
export const distM = haversineM;

export function paceSecPerKm(distanceM: number, durationS: number): number | null {
  if (distanceM <= 0 || durationS <= 0) return null;
  const km = distanceM / 1000;
  if (km <= 0) return null;
  return durationS / km;
}

export function formatPace(paceSecKm: number | null): string {
  if (!paceSecKm || !Number.isFinite(paceSecKm)) return "--:--";
  const total = Math.max(0, Math.round(paceSecKm));
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export function formatDuration(totalS: number): string {
  const s = Math.max(0, Math.floor(totalS));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return hh > 0
    ? `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`
    : `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

/** Compat legado: fmtPace/fmtTime */
export const fmtPace = formatPace;
export const fmtTime = formatDuration;

export function shouldAcceptPoint(
  prev: TrackPoint | null,
  next: TrackPoint,
  cfg: { maxAccuracyM: number; maxSpeedMS: number; minDeltaTMs: number }
): { ok: boolean; reason?: string; segmentM?: number; deltaT?: number; speedMS?: number } {
  if (!Number.isFinite(next.lat) || !Number.isFinite(next.lng)) return { ok: false, reason: "coords_invalid" };
  if (!Number.isFinite(next.accuracy) || next.accuracy <= 0) return { ok: false, reason: "accuracy_invalid" };
  if (next.accuracy > cfg.maxAccuracyM) return { ok: false, reason: "accuracy_high" };

  if (!prev) return { ok: true, segmentM: 0, deltaT: 0, speedMS: 0 };

  const dt = next.t - prev.t;
  if (dt < cfg.minDeltaTMs) return { ok: false, reason: "dt_small", deltaT: dt };

  const d = haversineM(prev, next);
  const speed = d / Math.max(0.001, dt / 1000);
  const reportedSpeed = typeof next.speed === "number" && Number.isFinite(next.speed) ? next.speed : null;
  const candidateSpeed = reportedSpeed ?? speed;

  if (candidateSpeed > cfg.maxSpeedMS) return { ok: false, reason: "speed_unreal", segmentM: d, deltaT: dt, speedMS: candidateSpeed };
  if (d > cfg.maxSpeedMS * (dt / 1000) * 1.5) return { ok: false, reason: "jump_absurd", segmentM: d, deltaT: dt, speedMS: speed };

  return { ok: true, segmentM: d, deltaT: dt, speedMS: candidateSpeed };
}

export function smoothPace(points: TrackPoint[], windowSize: number, distanceM: number, elapsedS: number): number | null {
  if (points.length < Math.max(3, windowSize)) return paceSecPerKm(distanceM, elapsedS);
  const n = points.length;
  const w = Math.max(3, Math.min(windowSize, n));
  const a = points[n - w];
  const b = points[n - 1];
  const dtS = (b.t - a.t) / 1000;
  if (dtS <= 0) return null;
  const d = haversineM(a, b);
  return paceSecPerKm(d, dtS);
}

export function buildSplits(points: TrackPoint[], splitEveryM: number): Split[] {
  if (points.length < 2) return [];
  const splits: Split[] = [];
  let acc = 0;
  let splitStartT = points[0].t;

  for (let i = 1; i < points.length; i++) {
    const d = haversineM(points[i - 1], points[i]);
    acc += d;

    while (acc >= splitEveryM) {
      const endT = points[i].t;
      const durationS = Math.max(1, Math.round((endT - splitStartT) / 1000));
      const p = paceSecPerKm(splitEveryM, durationS);
      splits.push({
        idx: splits.length + 1,
        startT: splitStartT,
        endT,
        distanceM: splitEveryM,
        durationS,
        paceSecPerKm: p,
      });

      acc -= splitEveryM;
      splitStartT = points[i].t;
    }
  }
  return splits;
}

/**
 * Compat legado: algumas versões antigas chamavam toGPX no utils.
 * Aqui só mantemos o stub para evitar build quebrar se alguém importar por engano.
 * A implementação real está em gpx.ts.
 */
export function toGPX(_session: Session): string {
  return "" as any;
}
