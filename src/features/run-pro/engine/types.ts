export type RunStatus = "idle" | "acquiring" | "ready" | "recording" | "paused" | "finished" | "error";

export type GeoPoint = {
  lat: number;
  lng: number;
  ts: number;          // epoch ms
  accuracy?: number;   // meters
  speed?: number | null; // m/s from device (optional)
};

export type RunSample = GeoPoint & {
  distFromPrevM: number;
  distTotalM: number;
  deltaTms: number;
  paceSecPerKm?: number; // derived
  rejected?: boolean;
  rejectReason?: string;
};

export type RunMetrics = {
  distTotalM: number;
  movingTimeMs: number;
  elapsedMs: number;
  avgPaceSecPerKm?: number;
  lastPaceSecPerKm?: number;
  gpsRejects: number;
  gpsAccepts: number;
  lastAccuracyM?: number;
};

export type RunConfig = {
  maxAccuracyM: number;      // ex: 25
  minDeltaTms: number;       // ex: 700
  maxSpeedMps: number;       // ex: 7.0 (~25.2 km/h)
  maxJumpM: number;          // ex: 60m entre amostras
  smoothingWindow: number;   // ex: 5 amostras
};

export const DEFAULT_RUN_CONFIG: RunConfig = {
  maxAccuracyM: 25,
  minDeltaTms: 700,
  maxSpeedMps: 7.0,
  maxJumpM: 60,
  smoothingWindow: 5,
};
