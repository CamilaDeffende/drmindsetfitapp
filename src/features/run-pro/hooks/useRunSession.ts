import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import type { Session, TrackPoint, RunStatus } from "../types";
import { buildSplits, paceSecPerKm, shouldAcceptPoint, smoothPace } from "../utils";

type Action =
  | { type: "RESET" }
  | { type: "SET_STATUS"; status: RunStatus }
  | { type: "ERROR"; message: string }
  | { type: "START" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "FINISH" }
  | { type: "ADD_POINT"; point: TrackPoint; segmentM: number; deltaTS: number };

function uid(): string {
  return `run_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function initial(): Session {
  return {
    id: uid(),
    status: "ready",
    startedAt: null,
    endedAt: null,
    points: [],
    distanceM: 0,
    elapsedS: 0,
    movingS: 0,
    avgPaceSecPerKm: null,
    currentPaceSecPerKm: null,
    splits: [],
    config: {
      splitEveryM: 1000,
      maxAccuracyM: 25,
      maxSpeedMS: 7,
      minDeltaTMs: 800,
      smoothWindow: 5,
    },
    error: null,
  };
}

function reducer(state: Session, action: Action): Session {
  switch (action.type) {
    case "RESET":
      return initial();
    case "SET_STATUS":
      return { ...state, status: action.status, error: null };
    case "ERROR":
      return { ...state, status: "error", error: action.message };
    case "START": {
      const now = Date.now();
      return {
        ...state,
        status: "recording",
        startedAt: now,
        endedAt: null,
        points: [],
        distanceM: 0,
        elapsedS: 0,
        movingS: 0,
        avgPaceSecPerKm: null,
        currentPaceSecPerKm: null,
        splits: [],
        error: null,
      };
    }
    case "PAUSE":
      return state.status === "recording" ? { ...state, status: "paused" } : state;
    case "RESUME":
      return state.status === "paused" ? { ...state, status: "recording" } : state;
    case "FINISH": {
      const now = Date.now();
      const avg = paceSecPerKm(state.distanceM, state.elapsedS);
      return { ...state, status: "finished", endedAt: now, avgPaceSecPerKm: avg };
    }
    case "ADD_POINT": {
      if (state.status !== "recording") return state;

      const nextPoints = [...state.points, action.point];
      const distanceM = state.distanceM + Math.max(0, action.segmentM);
      const elapsedS = state.elapsedS + Math.max(0, Math.round(action.deltaTS));

      const avgP = paceSecPerKm(distanceM, elapsedS);
      const curP = smoothPace(nextPoints, state.config.smoothWindow, distanceM, elapsedS);
      const splits = buildSplits(nextPoints, state.config.splitEveryM);

      return {
        ...state,
        points: nextPoints,
        distanceM,
        elapsedS,
        movingS: elapsedS,
        avgPaceSecPerKm: avgP,
        currentPaceSecPerKm: curP,
        splits,
      };
    }
    default:
      return state;
  }
}

export function useRunSession() {
  const [session, dispatch] = useReducer(reducer, undefined, initial);
  const watchIdRef = useRef<number | null>(null);
  const lastPointRef = useRef<TrackPoint | null>(null);

  const supportsGeo = typeof navigator !== "undefined" && !!navigator.geolocation;

  const stopWatch = useCallback(() => {
    if (!supportsGeo) return;
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, [supportsGeo]);

  const startWatch = useCallback(() => {
    if (!supportsGeo) {
      dispatch({ type: "ERROR", message: "Geolocalização não suportada neste navegador." });
      return;
    }
    dispatch({ type: "SET_STATUS", status: "acquiring" });

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const p: TrackPoint = {
          t: pos.timestamp || Date.now(),
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? 9999,
          altitude: pos.coords.altitude ?? null,
          speed: typeof pos.coords.speed === "number" ? pos.coords.speed : null,
        };

        const prev = lastPointRef.current;
        const check = shouldAcceptPoint(prev, p, {
          maxAccuracyM: session.config.maxAccuracyM,
          maxSpeedMS: session.config.maxSpeedMS,
          minDeltaTMs: session.config.minDeltaTMs,
        });

        if (session.status === "acquiring") dispatch({ type: "SET_STATUS", status: "ready" });
        if (!check.ok) return;

        lastPointRef.current = p;
        const deltaTS = prev ? Math.max(0, (p.t - prev.t) / 1000) : 0;
        const segmentM = prev ? (check.segmentM ?? 0) : 0;

        if (session.status === "recording") {
          dispatch({ type: "ADD_POINT", point: p, segmentM, deltaTS });
        }
      },
      (err) => {
        const msg =
          err.code === 1 ? "Permissão de GPS negada. Ative nas configurações do navegador." :
          err.code === 2 ? "Sinal de GPS indisponível no momento." :
          err.code === 3 ? "Timeout ao obter GPS. Tente novamente." :
          "Erro ao acessar GPS.";
        dispatch({ type: "ERROR", message: msg });
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
    );

    watchIdRef.current = id;
  }, [supportsGeo, session.config.maxAccuracyM, session.config.maxSpeedMS, session.config.minDeltaTMs, session.status]);

  const reset = useCallback(() => {
    stopWatch();
    lastPointRef.current = null;
    dispatch({ type: "RESET" });
  }, [stopWatch]);

  const start = useCallback(() => {
    lastPointRef.current = null;
    dispatch({ type: "START" });
  }, []);
  const pause = useCallback(() => dispatch({ type: "PAUSE" }), []);
  const resume = useCallback(() => dispatch({ type: "RESUME" }), []);
  const finish = useCallback(() => {
    stopWatch();
    dispatch({ type: "FINISH" });
  }, [stopWatch]);

  useEffect(() => {
    startWatch();
    return () => stopWatch();
  }, [startWatch, stopWatch]);

  const canStart = session.status === "ready" || session.status === "acquiring";
  const canPause = session.status === "recording";
  const canResume = session.status === "paused";
  const canFinish = session.status === "recording" || session.status === "paused";
  const canExport = session.status === "finished" && session.points.length > 1;

  const polyline = useMemo(
    () => session.points.map((p: TrackPoint) => [p.lat, p.lng] as [number, number]),
    [session.points]
  );

  return {
    session,
    supportsGeo,
    polyline,
    actions: { reset, start, pause, resume, finish },
    flags: { canStart, canPause, canResume, canFinish, canExport },
  };
}
