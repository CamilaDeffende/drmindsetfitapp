export type RunStatus = "ready" | "acquiring" | "recording" | "paused" | "finished" | "error";

/**
 * Compat: versões antigas podem ter usado RunStats.
 * Mantemos alias para não quebrar imports legados.
 */
export type RunStats = RunStatus;

export type TrackPoint = {
  t: number; // epoch ms
  lat: number;
  lng: number;
  accuracy: number; // meters
  altitude?: number | null;
  speed?: number | null; // m/s (if available)
};

export type Split = {
  idx: number; // 1..N
  startT: number;
  endT: number;
  distanceM: number;
  durationS: number;
  paceSecPerKm: number | null;
};

export type Session = {
  id: string;
  status: RunStatus;
  startedAt: number | null;
  endedAt: number | null;

  points: TrackPoint[];
  distanceM: number;
  elapsedS: number;
  movingS: number;
  avgPaceSecPerKm: number | null;
  currentPaceSecPerKm: number | null;

  splits: Split[];

  config: {
    splitEveryM: number;      // default 1000
    maxAccuracyM: number;     // default 25
    maxSpeedMS: number;       // default 7 (≈25 km/h)
    minDeltaTMs: number;      // default 800
    smoothWindow: number;     // default 5 points
  };

  error?: string | null;
};
