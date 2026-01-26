import { haversineM, ema } from "@/features/run-pro/utils/geo";
import type { RunFix, RunFixQuality, RunStats } from "@/features/run-pro/types/runTypes";

export type HardeningConfig = {
  // qualidade
  maxAccuracyM: number;     // ex: 25m (corrida)
  maxSpeedMps: number;      // sanity: ex 9 m/s (≈ 32 km/h)
  maxJumpM: number;         // salto máximo entre fixes (anti-teleport)
  maxStaleMs: number;       // se ficar muito tempo sem fix, drop
  // smoothing
  smoothAlpha: number;      // 0.15–0.35
};

export const defaultHardening: HardeningConfig = {
  maxAccuracyM: 25,
  maxSpeedMps: 9,
  maxJumpM: 120,
  maxStaleMs: 12_000,
  smoothAlpha: 0.22,
};

export type HardeningState = {
  // coords suavizadas
  sLat?: number;
  sLon?: number;
  // para splits
  kmBucketStartAt: number;
  kmBucketDistanceM: number;
  kmBucketElapsedMs: number;
  // stats
  stats: RunStats;
};

export function initHardening(startedAt = Date.now()): HardeningState {
  return {
    kmBucketStartAt: startedAt,
    kmBucketDistanceM: 0,
    kmBucketElapsedMs: 0,
    stats: {
      startedAt,
      elapsedMs: 0,
      distanceM: 0,
      acceptedFixes: 0,
      droppedFixes: 0,
      splitsSecPerKm: [],
    },
  };
}

export function assessFix(prev: RunFix | undefined, next: RunFix, cfg: HardeningConfig): RunFixQuality {
  if (next.accuracyM > cfg.maxAccuracyM) return { ok: false, reason: "accuracy" };
  if (prev) {
    const dt = next.ts - prev.ts;
    if (dt <= 0) return { ok: false, reason: "stale" };
    if (dt > cfg.maxStaleMs) return { ok: false, reason: "stale" };

    const d = haversineM(prev.lat, prev.lon, next.lat, next.lon);
    if (d > cfg.maxJumpM) return { ok: false, reason: "jump" };

    const speed = d / (dt / 1000);
    const declaredSpeed = next.speedMps ?? null;
    const maxSpeed = Math.max(speed, declaredSpeed ?? 0);
    if (maxSpeed > cfg.maxSpeedMps) return { ok: false, reason: "speed" };
  }
  return { ok: true };
}

export function applyFix(state: HardeningState, raw: RunFix, cfg: HardeningConfig): HardeningState {
  const prev = state.stats.lastFix;
  const q = assessFix(prev, raw, cfg);

  if (!q.ok) {
    state.stats.droppedFixes += 1;
    return state;
  }

  // smoothing coords
  if (state.sLat == null || state.sLon == null) {
    state.sLat = raw.lat;
    state.sLon = raw.lon;
  } else {
    state.sLat = ema(state.sLat, raw.lat, cfg.smoothAlpha);
    state.sLon = ema(state.sLon, raw.lon, cfg.smoothAlpha);
  }

  const fix: RunFix = { ...raw, lat: state.sLat!, lon: state.sLon! };

  // metrics
  const now = fix.ts;
  state.stats.elapsedMs = now - state.stats.startedAt;
  state.stats.lastFix = fix;

  if (prev) {
    const d = haversineM(prev.lat, prev.lon, fix.lat, fix.lon);
    if (Number.isFinite(d) && d > 0) {
      state.stats.distanceM += d;

      // pace médio (s/km)
      const sec = state.stats.elapsedMs / 1000;
      const km = state.stats.distanceM / 1000;
      if (km > 0.01) {
        state.stats.paceSecPerKm = sec / km;
        state.stats.speedMps = state.stats.distanceM / sec;
      }

      // splits por km (bucket)
      const dtMs = fix.ts - prev.ts;
      state.kmBucketDistanceM += d;
      state.kmBucketElapsedMs += dtMs;

      while (state.kmBucketDistanceM >= 1000) {
        // calcula pace do km fechado (aprox)
        const kmSec = (state.kmBucketElapsedMs / 1000) * (1000 / state.kmBucketDistanceM);
        state.stats.splitsSecPerKm.push(kmSec);

        // “consome” 1km do bucket mantendo sobra proporcional
        state.kmBucketDistanceM -= 1000;
        // mantém tempo proporcional da sobra
        state.kmBucketElapsedMs = Math.max(0, state.kmBucketElapsedMs * (state.kmBucketDistanceM / (state.kmBucketDistanceM + 1000)));
        state.kmBucketStartAt = fix.ts;
      }
    }
  }

  state.stats.acceptedFixes += 1;
  return state;
}
