export type RunSample = { lat: number; lng: number; ts: number; accuracy?: number };

export type RunStats = {
  points: number;
  durationMs: number;
  movingMs: number;
  pausedMs: number;
  distanceM: number;
  avgPaceSecPerKm: number | null;
  avgSpeedMps: number | null;
  avgAccuracyM: number | null;
  pausesCount: number;
  signalGrade: "A" | "B" | "C";
};

function toRad(d: number) { return (d * Math.PI) / 180; }

// Haversine distance (meters)
export function haversineM(a: {lat:number; lng:number}, b: {lat:number; lng:number}) {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sa = Math.sin(dLat/2), sb = Math.sin(dLng/2);
  const A = sa*sa + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*sb*sb;
  const c = 2 * Math.atan2(Math.sqrt(A), Math.sqrt(1-A));
  return R * c;
}

export function computeRunStats(samples: RunSample[]): RunStats {
  const pts = samples.length;
  if (pts < 2) {
    return {
      points: pts,
      durationMs: 0,
      movingMs: 0,
      pausedMs: 0,
      distanceM: 0,
      avgPaceSecPerKm: null,
      avgSpeedMps: null,
      avgAccuracyM: samples.length ? (samples[0].accuracy ?? null) : null,
      pausesCount: 0,
      signalGrade: "C",
    };
  }

  const sorted = [...samples].sort((x,y)=>x.ts - y.ts);
  const t0 = sorted[0].ts;
  const t1 = sorted[sorted.length - 1].ts;
  const durationMs = Math.max(0, t1 - t0);

  let distanceM = 0;
  let movingMs = 0;
  let pausedMs = 0;
  let pausesCount = 0;

  let accSum = 0;
  let accN = 0;

  // thresholds (premium defaults)
  const MAX_ACC = 30;          // <=30m considered good point
  const MIN_DT = 500;          // ignore ultra-fast noise
  const PAUSE_SPEED = 0.6;     // m/s (≈ 2.16 km/h) below = paused
  const MIN_PAUSE_MS = 12_000; // 12s pause window to count

  let currentPauseMs = 0;

  for (let i = 1; i < sorted.length; i++) {
    const a = sorted[i-1];
    const b = sorted[i];
    const dt = b.ts - a.ts;
    if (dt < MIN_DT) continue;

    if (typeof b.accuracy === "number") { accSum += b.accuracy; accN++; }

    // ignore crazy accuracy spikes
    const accOk = (typeof b.accuracy !== "number") ? true : (b.accuracy <= MAX_ACC);
    const d = accOk ? haversineM(a, b) : 0;

    // speed
    const speed = d / (dt/1000);

    // moving vs pause
    if (speed < PAUSE_SPEED) {
      pausedMs += dt;
      currentPauseMs += dt;
    } else {
      movingMs += dt;
      if (currentPauseMs >= MIN_PAUSE_MS) pausesCount++;
      currentPauseMs = 0;
      distanceM += d;
    }
  }

  if (currentPauseMs >= MIN_PAUSE_MS) pausesCount++;

  const avgSpeedMps = movingMs > 0 ? (distanceM / (movingMs/1000)) : null;
  const avgPaceSecPerKm = avgSpeedMps && avgSpeedMps > 0 ? (1000 / avgSpeedMps) : null;

  const avgAccuracyM = accN ? (accSum/accN) : null;

  // signal grade based on avg accuracy
  let signalGrade: "A"|"B"|"C" = "C";
  if (avgAccuracyM !== null) {
    if (avgAccuracyM <= 15) signalGrade = "A";
    else if (avgAccuracyM <= 30) signalGrade = "B";
    else signalGrade = "C";
  }

  return {
    points: pts,
    durationMs,
    movingMs,
    pausedMs,
    distanceM,
    avgPaceSecPerKm,
    avgSpeedMps,
    avgAccuracyM,
    pausesCount,
    signalGrade,
  };
}
