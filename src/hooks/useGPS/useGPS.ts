import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GPSPoint, GPSService, GPSStats } from "@/services/gps/GPSService";

export type GPSStatus = "idle" | "requesting" | "running" | "error" | "unsupported";

export type UseGPSState = {
  status: GPSStatus;
  error?: string | null;
  points: GPSPoint[];
  startedAtMs: number | null;
  stats: GPSStats;
  lastPoint?: GPSPoint | null;
};

export const useGPS = () => {
  const [status, setStatus] = useState<GPSStatus>(() => {
    if (typeof window === "undefined") return "idle";
    return navigator.geolocation ? "idle" : "unsupported";
  });
  const [error, setError] = useState<string | null>(null);
  const [points, setPoints] = useState<GPSPoint[]>([]);
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const nowRef = useRef<number>(Date.now());
  useEffect(() => {
    const t = setInterval(() => { nowRef.current = Date.now(); }, 1000);
    return () => clearInterval(t);
  }, []);

  const lastPoint = useMemo(() => (points.length ? points[points.length - 1] : null), [points]);

  const stats = useMemo(() => {
    return GPSService.stats(points, startedAtMs, nowRef.current);
  }, [points, startedAtMs]);

  const stop = useCallback(() => {
    try {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    } catch {}
    watchIdRef.current = null;
    setStatus((s) => (s === "unsupported" ? s : "idle"));
  }, []);

  const reset = useCallback(() => {
    stop();
    setPoints([]);
    setStartedAtMs(null);
    setError(null);
  }, [stop]);

  const start = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!navigator.geolocation) {
      setStatus("unsupported");
      return;
    }

    setError(null);
    setStatus("requesting");

    const options: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 15000,
    };

    const onPos = (pos: GeolocationPosition) => {
      const c = pos.coords;
      const p: GPSPoint = {
        lat: c.latitude,
        lon: c.longitude,
        accuracy: typeof c.accuracy === "number" ? c.accuracy : null,
        altitude: typeof c.altitude === "number" ? c.altitude : null,
        heading: typeof c.heading === "number" ? c.heading : null,
        speed: typeof c.speed === "number" ? c.speed : null,
        ts: pos.timestamp || Date.now(),
      };

      setPoints((prev) => {
        // filtro premium: evita spam se posição não mudou e timestamp muito próximo
        const last = prev.length ? prev[prev.length - 1] : null;
        if (last) {
          const dt = Math.abs(p.ts - last.ts);
          const dd = GPSService.haversineMeters(last, p);
          if (dt < 700 && dd < 1) return prev;
        }
        return [...prev, p];
      });

      setStatus("running");
      setStartedAtMs((v) => (v ? v : Date.now()));
    };

    const onErr = (e: GeolocationPositionError) => {
      setStatus("error");
      setError(e?.message || "Falha ao acessar GPS");
    };

    try {
      const id = navigator.geolocation.watchPosition(onPos, onErr, options);
      watchIdRef.current = id;
    } catch (e: any) {
      setStatus("error");
      setError(String(e?.message || e));
    }
  }, []);

  // cleanup
  useEffect(() => () => stop(), [stop]);

  const state: UseGPSState = {
    status,
    error,
    points,
    startedAtMs,
    stats,
    lastPoint,
  };

  const exportGPX = useCallback((name?: string) => {
    return GPSService.toGPX(points, name || "MindsetFit Activity");
  }, [points]);

  return { ...state, start, stop, reset, exportGPX };
};
