export type RunFix = {
  ts: number; // epoch ms
  lat: number;
  lon: number;
  accuracyM: number;
  speedMps?: number | null;
  headingDeg?: number | null;
  altitudeM?: number | null;
};

export type RunFixQuality = {
  ok: boolean;
  reason?: "accuracy" | "speed" | "stale" | "jump";
};

export type RunStats = {
  startedAt: number;
  endedAt?: number;
  elapsedMs: number;

  distanceM: number;
  paceSecPerKm?: number; // pace médio (s/km)
  speedMps?: number;

  lastFix?: RunFix;
  acceptedFixes: number;
  droppedFixes: number;

  // split simples por km
  splitsSecPerKm: number[]; // cada km concluído => pace daquele km (s/km)
};
