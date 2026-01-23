import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GeoPoint, RunConfig, RunMetrics, RunSample, RunStatus } from "./types";
import { DEFAULT_RUN_CONFIG } from "./types";
import { haversineM, isAccuracyOk, isDeltaTOk, isJumpOk, isSpeedOk } from "./filters";
import { movingAverage } from "./smoothing";
function devLog(...args: any[]) {
  if (import.meta.env.DEV) console.log("[run-pro]", ...args);
}

type ErrorState = { code: string; message: string };

function toGeoPoint(pos: GeolocationPosition): GeoPoint {
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    ts: pos.timestamp || Date.now(),
    accuracy: pos.coords.accuracy,
    speed: pos.coords.speed,
  };
}

export function useRunSession(config?: Partial<RunConfig>) {
  const cfg: RunConfig = useMemo(() => ({ ...DEFAULT_RUN_CONFIG, ...(config || {}) }), [config]);

  const [status, setStatus] = useState<RunStatus>("idle");
  const [error, setError] = useState<ErrorState | null>(null);
  const [samples, setSamples] = useState<RunSample[]>([]);
  const [metrics, setMetrics] = useState<RunMetrics>({
    distTotalM: 0,
    movingTimeMs: 0,
    elapsedMs: 0,
    gpsRejects: 0,
    gpsAccepts: 0,
  });

  const watchIdRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const pausedAtRef = useRef<number | null>(null);
  const pauseAccumRef = useRef<number>(0);

  const lastAcceptedRef = useRef<GeoPoint | null>(null);
  const paceHistoryRef = useRef<Array<number | undefined>>([]);

  const stopWatch = useCallback(() => {
    if (watchIdRef.current != null && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = null;
  }, []);

  const reset = useCallback(() => {
    stopWatch();
    setStatus("idle");
    setError(null);
    setSamples([]);
    setMetrics({ distTotalM: 0, movingTimeMs: 0, elapsedMs: 0, gpsRejects: 0, gpsAccepts: 0 });
    startedAtRef.current = null;
    pausedAtRef.current = null;
    pauseAccumRef.current = 0;
    lastAcceptedRef.current = null;
    paceHistoryRef.current = [];
  }, [stopWatch]);

  const start = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("error");
      setError({ code: "NO_GEOLOCATION", message: "Geolocalização não disponível neste dispositivo." });
      return;
    }

    reset();
    setStatus("acquiring");
    startedAtRef.current = Date.now();

    const id = navigator.geolocation.watchPosition((pos) => {
        const gp = toGeoPoint(pos);

        const prev = lastAcceptedRef.current;
        const deltaTms = prev ? gp.ts - prev.ts : 0;
        const distFromPrevM = prev ? haversineM(prev, gp) : 0;

        // filtros
        if (!isAccuracyOk(gp, cfg)) {
          setMetrics((m) => ({ ...m, gpsRejects: m.gpsRejects + 1, lastAccuracyM: gp.accuracy }));
          devLog("reject accuracy", gp.accuracy);
          return;
        }
        if (!isDeltaTOk(prev, gp, cfg)) {
          setMetrics((m) => ({ ...m, gpsRejects: m.gpsRejects + 1, lastAccuracyM: gp.accuracy }));
          devLog("reject deltaT", deltaTms);
          return;
        }
        if (prev && !isJumpOk(distFromPrevM, cfg)) {
          setMetrics((m) => ({ ...m, gpsRejects: m.gpsRejects + 1, lastAccuracyM: gp.accuracy }));
          devLog("reject jump", distFromPrevM);
          return;
        }
        if (prev && !isSpeedOk(distFromPrevM, deltaTms, cfg)) {
          setMetrics((m) => ({ ...m, gpsRejects: m.gpsRejects + 1, lastAccuracyM: gp.accuracy }));
          devLog("reject speed", distFromPrevM, deltaTms);
          return;
        }

        // aceito
        lastAcceptedRef.current = gp;

        setStatus((st) => (st === "acquiring" ? "ready" : st === "paused" ? "paused" : st));

        setSamples((arr) => {
          const distTotalM = (arr.length ? arr[arr.length - 1].distTotalM : 0) + distFromPrevM;
          const pace = distFromPrevM > 0 && deltaTms > 0 ? (deltaTms / 1000) / (distFromPrevM / 1000) : undefined; // sec/km
          paceHistoryRef.current.push(pace);
          const smoothed = movingAverage(paceHistoryRef.current, cfg.smoothingWindow);

          const sample: RunSample = {
            ...gp,
            distFromPrevM,
            distTotalM,
            deltaTms,
            paceSecPerKm: smoothed ?? pace,
          };
          return [...arr, sample];
        });

        setMetrics((m) => {
          const now = Date.now();
          const started = startedAtRef.current || now;
          const elapsed = now - started;
          const moving = status === "paused" ? m.movingTimeMs : m.movingTimeMs + (prev ? deltaTms : 0);
          return {
            ...m,
            distTotalM: (m.distTotalM || 0) + distFromPrevM,
            elapsedMs: elapsed,
            movingTimeMs: moving,
            gpsAccepts: m.gpsAccepts + 1,
            lastAccuracyM: gp.accuracy,
            lastPaceSecPerKm: paceHistoryRef.current.length ? paceHistoryRef.current[paceHistoryRef.current.length - 1] : m.lastPaceSecPerKm,
          };
        });
      },
      (err) => {
        setStatus("error");
        setError({ code: String(err.code), message: err.message || "Falha ao obter localização." });
        devLog("watchPosition error", err);
      }, { enableHighAccuracy: true, maximumAge: 0, timeout: 12000 });

    watchIdRef.current = id;
  }, [cfg, reset, status]);

  const beginRecording = useCallback(() => {
    if (status === "ready" || status === "acquiring") {
      setStatus("recording");
      pausedAtRef.current = null;
      devLog("recording started");
    }
  }, [status]);

  const pause = useCallback(() => {
    if (status === "recording") {
      setStatus("paused");
      pausedAtRef.current = Date.now();
      devLog("paused");
    }
  }, [status]);

  const resume = useCallback(() => {
    if (status === "paused") {
      setStatus("recording");
      if (pausedAtRef.current) pauseAccumRef.current += Date.now() - pausedAtRef.current;
      pausedAtRef.current = null;
      devLog("resumed");
    }
  }, [status]);

  const finish = useCallback(() => {
    stopWatch();
    setStatus("finished");
    devLog("finished");
  }, [stopWatch]);

  useEffect(() => () => stopWatch(), [stopWatch]);

  return {
    status,
    error,
    samples,
    metrics,
    config: cfg,
    actions: { start, beginRecording, pause, resume, finish, reset },
  };
}
