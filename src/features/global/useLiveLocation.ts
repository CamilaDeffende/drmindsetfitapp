import { useEffect, useMemo, useRef } from "react";
import tzLookup from "tz-lookup";
import { useGlobalLocationStore } from "@/stores/globalLocationStore";

// __MF_GEO_ROUTE_GUARD__
// Regra: GEO só em /running e /corrida. Fora disso, NUNCA requisitar geolocation.
const __mfGeoEnabledByRoute = (): boolean => {
  try {
    if (typeof window === "undefined") return false;
    const p = window.location?.pathname || "";
    return /^\/(running|corrida)/.test(p);
  } catch {
    return false;
  }
};

/**
 * useLiveLocation()
 * - Localização ao vivo via watchPosition()
 * - Timezone IANA derivado por coordenadas (tz-lookup)
 * - "Clock" ao vivo (tick) para UI/PDF/RunPro
 * - Nunca trava o app: se negar permissão, mantém status e segue.
 */
export function useLiveLocation(options?: {
  
  enabled?: boolean;
enableHighAccuracy?: boolean;
  timeoutMs?: number;
  maximumAgeMs?: number;
  minUpdateMs?: number; // rate-limit interno
}) {
  const enabled = (options as any)?.enabled !== false;
const enableHighAccuracy = options?.enableHighAccuracy ?? true;
  const timeout = options?.timeoutMs ?? 12_000;
  const maximumAge = options?.maximumAgeMs ?? 5_000;
  const minUpdateMs = options?.minUpdateMs ?? 800;

  const status = useGlobalLocationStore((s) => s.status);
  const coords = useGlobalLocationStore((s) => s.coords);
  const tzIana = useGlobalLocationStore((s) => s.tzIana);
  const locale = useGlobalLocationStore((s) => s.locale);
  const nowTick = useGlobalLocationStore((s) => s.nowTick);

  const setStatus = useGlobalLocationStore((s) => s.setStatus);
  const setCoords = useGlobalLocationStore((s) => s.setCoords);
  const setTzIana = useGlobalLocationStore((s) => s.setTzIana);
  const setLocale = useGlobalLocationStore((s) => s.setLocale);
  const setError = useGlobalLocationStore((s) => s.setError);
  const setWatchId = useGlobalLocationStore((s) => s.setWatchId);
  const tickNow = useGlobalLocationStore((s) => s.tickNow);

  const lastUpdateRef = useRef<number>(0);
  const clockTimerRef = useRef<number | null>(null);

  const isSupported = typeof navigator !== "undefined" && "geolocation" in navigator;

  const start = () => {
    // __MF_GEO_ENABLED_GUARD_START_V7__
    if (!enabled) return;
    if (!__mfGeoEnabledByRoute()) return;

    if (!isSupported) {
      setStatus("unavailable");
      setError("Geolocation API indisponível neste dispositivo/navegador.");
      return;
    }

    setStatus("starting");
    setError(undefined);

    // Locale “ao vivo”: do navegador (pode mudar com idioma do device)
    try {
      const navLoc = navigator.language || "pt-BR";
      setLocale(navLoc);
    } catch {}

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastUpdateRef.current < minUpdateMs) return;
        lastUpdateRef.current = now;

        const c = pos.coords;
        const lat = c.latitude;
        const lon = c.longitude;

        setCoords({
          lat,
          lon,
          accuracyM: c.accuracy,
          headingDeg: Number.isFinite(c.heading) ? c.heading : null,
          speedMps: Number.isFinite(c.speed) ? c.speed : null,
          altitudeM: Number.isFinite(c.altitude) ? c.altitude : null,
          updatedAt: now,
        });

        // Timezone IANA baseado nas coords (não depende do OS)
        try {
          const tz = tzLookup(lat, lon);
          setTzIana(tz);
        } catch (e) {
          // fallback seguro: timezone do sistema
          try {
            const sysTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            setTzIana(sysTz);
          } catch {}
        }

        setStatus("watching");
      },
      (err) => {
        if (err?.code === 1) {
          setStatus("denied");
          setError("Permissão de localização negada pelo usuário.");
          return;
        }
        setStatus("error");
        setError(err?.message || "Falha ao obter localização.");
      },
      { enableHighAccuracy, timeout, maximumAge }
    );

    setWatchId(id);
  };

  const stop = () => {
    const wid = useGlobalLocationStore.getState().watchId;
    if (isSupported && typeof wid === "number") {
      navigator.geolocation.clearWatch(wid);
    }
    setWatchId(undefined);
    setStatus("idle");
  };

  // Clock ao vivo (para qualquer parte do app consumir agoraTick)
  useEffect(() => {
    if (!enabled) return;

    if (!__mfGeoEnabledByRoute()) { return; }

    if (clockTimerRef.current) window.clearInterval(clockTimerRef.current);
    clockTimerRef.current = window.setInterval(() => tickNow(), 1000);
    return () => {
      if (clockTimerRef.current) window.clearInterval(clockTimerRef.current);
      clockTimerRef.current = null;
    };
  }, [tickNow, enabled]);

  // Auto-start: não atrapalha onboarding/fluxo — se negar, seguimos
  useEffect(() => {
    // inicia uma vez
    // __MF_GEO_START_EFFECT_GUARD__
    if (!enabled) return;
    if (!__mfGeoEnabledByRoute()) return;
    if (status !== "idle") return;
    start();
    // não parar automaticamente; parar só se quiser
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nowInTz = useMemo(() => {
    // retorna string formatada no timezone atual
    const tz = tzIana || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const loc = locale || "pt-BR";
    try {
      return new Intl.DateTimeFormat(loc, {
        timeZone: tz,
        dateStyle: "medium",
        timeStyle: "medium",
      }).format(new Date(nowTick));
    } catch {
      return new Date(nowTick).toLocaleString(loc);
    }
  }, [tzIana, locale, nowTick]);

  return {
    isSupported,
    status,
    coords,
    tzIana,
    locale,
    nowInTz,
    start,
    stop,
  };
}
