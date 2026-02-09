import { historyService, WorkoutRecord, WorkoutType } from "@/services/history/HistoryService";

export type WorkoutPrediction = {
  type: WorkoutType;
  suggestedDurationMin: number;
  suggestedCaloriesKcal: number;
  suggestedDistanceKm?: number;
  confidence01: number;
};

export type WeightPrediction = {
  slopeKgPerDay: number;
  r2: number;
  projectedKg7d?: number;
  projectedKg30d?: number;
};

function getAllWorkouts(): WorkoutRecord[] {
  const ws = (historyService as any).getWorkouts?.(9999) ?? [];
  return Array.isArray(ws) ? (ws as WorkoutRecord[]) : [];
}

function durationMin(w: any): number {
  const v =
    w.durationMinutes ??
    w.durationMin ??
    (typeof w.durationSec === "number" ? Math.round(w.durationSec / 60) : undefined);
  return typeof v === "number" ? v : 0;
}

function caloriesKcal(w: any): number {
  const v = w.caloriesBurned ?? w.caloriesKcal;
  return typeof v === "number" ? v : 0;
}

function distanceKm(w: any): number | undefined {
  const m = w.distanceMeters;
  if (typeof m === "number" && m > 0) return Math.round((m / 1000) * 100) / 100;
  const km = w.distanceKm;
  if (typeof km === "number" && km > 0) return Math.round(km * 100) / 100;
  return undefined;
}

export class PredictionEngine {
  private getDefaultDuration(type: any): number {
    switch (type) {
      case "corrida": return 40;
      case "ciclismo": return 50;
      case "musculacao": return 55;
      default: return 45;
    }
  }

  private getDefaultCalories(type: any): number {
    switch (type) {
      case "corrida": return 380;
      case "ciclismo": return 420;
      case "musculacao": return 360;
      default: return 350;
    }
  }

  predictWorkout(type: WorkoutType, targetDistanceKm?: number): WorkoutPrediction {
    const all = getAllWorkouts();
    const hist = all.filter((w: any) => (w.type ?? w.modality) === type);

    const n = hist.length;
    const conf = Math.min(0.9, Math.max(0.25, n / 20));

    const avgDur = n ? hist.reduce((s, w) => s + durationMin(w), 0) / n : this.getDefaultDuration(type);
    const avgCal = n ? hist.reduce((s, w) => s + caloriesKcal(w), 0) / n : this.getDefaultCalories(type);

    let suggestedDistanceKm: number | undefined = undefined;
    if (type === "corrida" || type === "ciclismo") {
      if (typeof targetDistanceKm === "number" && targetDistanceKm > 0) suggestedDistanceKm = targetDistanceKm;
      else {
        const d = hist.map(distanceKm).filter((x): x is number => typeof x === "number");
        if (d.length) suggestedDistanceKm = d.sort((a, b) => a - b)[Math.floor(d.length * 0.6)];
      }
    }

    let suggestedDurationMin = Math.round(avgDur);
    if (suggestedDistanceKm && (type === "corrida" || type === "ciclismo")) {
      const d = hist.map(distanceKm).filter((x): x is number => typeof x === "number");
      const med = d.length ? d.sort((a, b) => a - b)[Math.floor(d.length / 2)] : undefined;
      if (med && med > 0 && suggestedDistanceKm > med) suggestedDurationMin = Math.round(avgDur * (suggestedDistanceKm / med));
    }

    return { type, suggestedDurationMin, suggestedCaloriesKcal: Math.round(avgCal), suggestedDistanceKm, confidence01: Math.round(conf * 100) / 100 };
  }

  predictWeight(): WeightPrediction {
    const data = (historyService as any).getWeightProgress?.() ?? [];
    if (!Array.isArray(data) || data.length < 2) return { slopeKgPerDay: 0, r2: 0 };

    const pts = data
      .map((d: any) => ({ dateIso: d.dateIso ?? d.date, weightKg: d.weightKg ?? d.weight }))
      .filter((d: any) => d.dateIso && typeof d.weightKg === "number");

    if (pts.length < 2) return { slopeKgPerDay: 0, r2: 0 };

    const t0 = new Date(pts[0].dateIso).getTime();
    const xs = pts.map((d: any) => (new Date(d.dateIso).getTime() - t0) / (1000 * 60 * 60 * 24));
    const ys = pts.map((d: any) => d.weightKg);

    const n = xs.length;
    const meanX = xs.reduce((s: number, v: number) => s + v, 0) / n;
    const meanY = ys.reduce((s: number, v: number) => s + v, 0) / n;

    let num = 0.0, den = 0.0;
    for (let i = 0; i < n; i++) { num += (xs[i] - meanX) * (ys[i] - meanY); den += (xs[i] - meanX) * (xs[i] - meanX); }
    const m = den === 0 ? 0 : num / den;
    const b = meanY - m * meanX;

    const yhat = (x: number) => m * x + b;
    const ssTot = ys.reduce((s: number, y: number) => s + Math.pow(y - meanY, 2), 0);
    const ssRes = ys.reduce((s: number, y: number, i: number) => s + Math.pow(y - yhat(xs[i]), 2), 0);
    const r2 = ssTot == 0 ? 0 : Math.max(0, Math.min(1, 1 - ssRes / ssTot));

    const proj7 = yhat(xs[xs.length - 1] + 7);
    const proj30 = yhat(xs[xs.length - 1] + 30);

    return { slopeKgPerDay: Math.round(m * 1000) / 1000, r2: Math.round(r2 * 100) / 100, projectedKg7d: Math.round(proj7 * 10) / 10, projectedKg30d: Math.round(proj30 * 10) / 10 };
  }
}

export const predictionEngine = new PredictionEngine();
