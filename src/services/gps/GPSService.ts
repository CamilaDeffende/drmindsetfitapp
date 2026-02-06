
/**
 * Serviço de GPS e geolocalização para treinos ao ar livre
 * Rastreia: distância, pace, elevação, rota
 */
export type GPSCoordinate = {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number;
  timestamp: number;
};

export type GPSStats = {
  distanceMeters: number;
  currentPaceMinPerKm: number;
  averagePaceMinPerKm: number;
  elevationGainMeters: number;
  elevationLossMeters: number;
  currentSpeedKmh: number;
  route: GPSCoordinate[];
};

export class GPSService {
  private watchId: number | null = null;
  private coordinates: GPSCoordinate[] = [];
  private isTracking = false;
  private callbacks: Map<string, (stats: GPSStats) => void> = new Map();

  async startTracking(): Promise<void> {
    if (this.isTracking) {
      console.warn("GPS já está rastreando");
      return;
    }
    if (!navigator.geolocation) {
      throw new Error("Geolocalização não suportada neste navegador");
    }

    return new Promise((resolve, reject) => {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          const coord: GPSCoordinate = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };

          this.coordinates.push(coord);
          this.isTracking = true;

          const stats = this.calculateStats();
          this.callbacks.forEach((cb) => cb(stats));

          if (this.coordinates.length === 1) resolve();
        },
        (error) => {
          console.error("Erro GPS:", error);
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
  }

  stopTracking(): GPSStats {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isTracking = false;
    return this.calculateStats();
  }

  private calculateDistance(c1: GPSCoordinate, c2: GPSCoordinate): number {
    const R = 6371e3;
    const φ1 = (c1.latitude * Math.PI) / 180;
    const φ2 = (c2.latitude * Math.PI) / 180;
    const Δφ = ((c2.latitude - c1.latitude) * Math.PI) / 180;
    const Δλ = ((c2.longitude - c1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private calculateStats(): GPSStats {
    if (this.coordinates.length === 0) {
      return {
        distanceMeters: 0,
        currentPaceMinPerKm: 0,
        averagePaceMinPerKm: 0,
        elevationGainMeters: 0,
        elevationLossMeters: 0,
        currentSpeedKmh: 0,
        route: [],
      };
    }

    let totalDistance = 0;
    let elevationGain = 0;
    let elevationLoss = 0;

    for (let i = 1; i < this.coordinates.length; i++) {
      const dist = this.calculateDistance(this.coordinates[i - 1], this.coordinates[i]);
      totalDistance += dist;

      const alt1 = this.coordinates[i - 1].altitude ?? 0;
      const alt2 = this.coordinates[i].altitude ?? 0;
      const diff = alt2 - alt1;
      if (diff > 0) elevationGain += diff;
      else elevationLoss += Math.abs(diff);
    }

    const durationSeconds =
      (this.coordinates[this.coordinates.length - 1].timestamp - this.coordinates[0].timestamp) /
      1000;

    const durationMinutes = durationSeconds / 60;
    const distanceKm = totalDistance / 1000;
    const averagePaceMinPerKm = distanceKm > 0 ? durationMinutes / distanceKm : 0;

    let currentPaceMinPerKm = averagePaceMinPerKm;
    if (this.coordinates.length >= 10) {
      const recent = this.coordinates.slice(-10);
      let recentDist = 0;
      for (let i = 1; i < recent.length; i++) {
        recentDist += this.calculateDistance(recent[i - 1], recent[i]);
      }
      const recentSeconds = (recent[recent.length - 1].timestamp - recent[0].timestamp) / 1000;
      const recentMinutes = recentSeconds / 60;
      const recentKm = recentDist / 1000;
      currentPaceMinPerKm = recentKm > 0 ? recentMinutes / recentKm : 0;
    }

    const currentSpeedKmh = currentPaceMinPerKm > 0 ? 60 / currentPaceMinPerKm : 0;

    return {
      distanceMeters: Math.round(totalDistance),
      currentPaceMinPerKm: Math.round(currentPaceMinPerKm * 100) / 100,
      averagePaceMinPerKm: Math.round(averagePaceMinPerKm * 100) / 100,
      elevationGainMeters: Math.round(elevationGain),
      elevationLossMeters: Math.round(elevationLoss),
      currentSpeedKmh: Math.round(currentSpeedKmh * 10) / 10,
      route: [...this.coordinates],
    };
  }

  onUpdate(id: string, cb: (stats: GPSStats) => void): void {
    this.callbacks.set(id, cb);
  }

  offUpdate(id: string): void {
    this.callbacks.delete(id);
  }

  reset(): void {
    this.coordinates = [];
  }

  exportToGPX(workoutName: string): string {
    const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="DrMindSetFit">
  <metadata>
    <name>${workoutName}</name>
    <time>${new Date().toISOString()}</time>
  </metadata>
  <trk>
    <name>${workoutName}</name>
    <trkseg>
${this.coordinates
  .map(
    (c) => `      <trkpt lat="${c.latitude}" lon="${c.longitude}">
        ${c.altitude !== null ? `<ele>${c.altitude}</ele>` : ""}
        <time>${new Date(c.timestamp).toISOString()}</time>
      </trkpt>`
  )
  .join("\n")}
    </trkseg>
  </trk>
</gpx>`;
    return gpx;
  }
}

export const gpsService = new GPSService();
