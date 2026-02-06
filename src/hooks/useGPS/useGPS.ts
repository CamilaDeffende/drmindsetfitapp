
import { useState, useEffect, useCallback } from "react";
import { gpsService, GPSStats } from "@/services/gps/GPSService";

export function useGPS() {
  const [isTracking, setIsTracking] = useState(false);
  const [stats, setStats] = useState<GPSStats>({
    distanceMeters: 0,
    currentPaceMinPerKm: 0,
    averagePaceMinPerKm: 0,
    elevationGainMeters: 0,
    elevationLossMeters: 0,
    currentSpeedKmh: 0,
    route: [],
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = `gps-hook-${Date.now()}`;
    gpsService.onUpdate(id, (s) => setStats(s));
    return () => gpsService.offUpdate(id);
  }, []);

  const startTracking = useCallback(async () => {
    try {
      setError(null);
      await gpsService.startTracking();
      setIsTracking(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao iniciar GPS");
      setIsTracking(false);
    }
  }, []);

  const stopTracking = useCallback(() => {
    const finalStats = gpsService.stopTracking();
    setStats(finalStats);
    setIsTracking(false);
    return finalStats;
  }, []);

  const reset = useCallback(() => {
    gpsService.reset();
    setStats({
      distanceMeters: 0,
      currentPaceMinPerKm: 0,
      averagePaceMinPerKm: 0,
      elevationGainMeters: 0,
      elevationLossMeters: 0,
      currentSpeedKmh: 0,
      route: [],
    });
  }, []);

  const exportGPX = useCallback((workoutName: string) => {
    return gpsService.exportToGPX(workoutName);
  }, []);

  return { isTracking, stats, error, startTracking, stopTracking, reset, exportGPX };
}
