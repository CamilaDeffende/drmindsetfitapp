export type LatLng = { lat: number; lng: number; t: number; acc?: number; alt?: number | null };

export type RunStats = {
  startedAt: number;
  endedAt?: number;
  durationSec: number;        // tempo em movimento (pausa bloqueia pontos)
  totalSec: number;           // tempo total
  distanceM: number;
  paceSecPerKm?: number;
  avgSpeedMps?: number;
  splits: Array<{ km: number; splitSec: number; paceSecPerKm: number }>;
};

export type RunSession = {
  id: string;
  name?: string;
  points: LatLng[];
  stats: RunStats;
};
