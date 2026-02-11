import { useEffect, useRef } from "react";
import { useRunProEliteStore } from "@/features/run-pro/store/useRunProEliteStore";
import { applyFix } from "@/features/run-pro/engine/runHardening";
import type { RunFix } from "@/features/run-pro/types/runTypes";
import { useGlobalLocationStore } from "@/stores/globalLocationStore";

export function useRunProEliteSession() {
  const isRunning = useRunProEliteStore((s) => s.isRunning);
  const cfg = useRunProEliteStore((s) => s.config);
  const st = useRunProEliteStore((s) => s.state);
  const start = useRunProEliteStore((s) => s.start);
  const stop = useRunProEliteStore((s) => s.stop);
  const setState = useRunProEliteStore((s) => s.setState);
  const pushFix = useRunProEliteStore((s) => s.pushFix);

  const watchIdRef = useRef<number | null>(null);

  // preferir coords ao vivo do store global (se já estiver em watching)
  const liveCoords = useGlobalLocationStore((s) => s.coords);

  useEffect(() => {
    // quando a sessão roda, se tivermos coords globais atualizando, alimenta o engine também
    if (!isRunning) return;
    if (!liveCoords) return;

    const raw: RunFix = {
      ts: liveCoords.updatedAt,
      lat: liveCoords.lat,
      lon: liveCoords.lon,
      accuracyM: liveCoords.accuracyM ?? 999,
      speedMps: liveCoords.speedMps ?? null,
      headingDeg: liveCoords.headingDeg ?? null,
      altitudeM: liveCoords.altitudeM ?? null,
    };

    const before = st.stats.lastFix;
    const nextState = applyFix({ ...st }, raw, cfg);
    const after = nextState.stats.lastFix;

    // registra raw sempre; smooth apenas se mudou
    pushFix(raw, after && after !== before ? after : undefined);
    setState(nextState);
  }, [liveCoords?.updatedAt]);

  // fallback: se não tiver live store, usa watchPosition direto
  const startDirectWatch = () => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const c = pos.coords;
        const raw: RunFix = {
          ts: Date.now(),
          lat: c.latitude,
          lon: c.longitude,
          accuracyM: c.accuracy,
          speedMps: Number.isFinite(c.speed) ? c.speed : null,
          headingDeg: Number.isFinite(c.heading) ? c.heading : null,
          altitudeM: Number.isFinite(c.altitude) ? c.altitude : null,
        };

        const before = st.stats.lastFix;
        const nextState = applyFix({ ...st }, raw, cfg);
        const after = nextState.stats.lastFix;

        pushFix(raw, after && after !== before ? after : undefined);
        setState(nextState);
      },
      () => {
        // sem travar o app
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 2_000 }
    );
  };

  const startRun = () => {
    start(Date.now());
    // se não existir coords globais, liga watch direto
    if (!useGlobalLocationStore.getState().coords) startDirectWatch();
  };

  const stopRun = () => {
    stop(Date.now());
    const id = watchIdRef.current;
    if (id != null && typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.clearWatch(id);
    }
    watchIdRef.current = null;
  };

  return {
    isRunning,
    cfg,
    st,
    startRun,
    stopRun,
  };
}
