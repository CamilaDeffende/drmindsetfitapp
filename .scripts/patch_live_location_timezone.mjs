import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const W = (p, s) => {
  const fp = path.join(ROOT, p);
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  fs.writeFileSync(fp, s);
  console.log("WRITE_OK:", p);
};
const R = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const E = (p) => fs.existsSync(path.join(ROOT, p));
const P = (p, fn) => {
  const fp = path.join(ROOT, p);
  const before = fs.readFileSync(fp, "utf8");
  const after = fn(before);
  if (after !== before) {
    fs.writeFileSync(fp, after);
    console.log("PATCH_OK:", p);
  } else {
    console.log("PATCH_SKIP:", p);
  }
};

// 1) Global store (Zustand)
W("src/stores/globalLocationStore.ts", `import { create } from "zustand";

export type LiveCoords = {
  lat: number;
  lon: number;
  accuracyM?: number;
  headingDeg?: number | null;
  speedMps?: number | null;
  altitudeM?: number | null;
  updatedAt: number; // epoch ms
};

export type LiveLocationStatus =
  | "idle"
  | "starting"
  | "watching"
  | "denied"
  | "unavailable"
  | "error";

type State = {
  status: LiveLocationStatus;
  coords?: LiveCoords;
  tzIana?: string;
  locale?: string;
  error?: string;
  watchId?: number;
  // clock: mantém um "now" ao vivo (para UI/PDF) sem depender do relógio do backend
  nowTick: number; // epoch ms atualizado
};

type Actions = {
  setStatus: (s: LiveLocationStatus) => void;
  setCoords: (c?: LiveCoords) => void;
  setTzIana: (tz?: string) => void;
  setLocale: (loc?: string) => void;
  setError: (e?: string) => void;
  setWatchId: (id?: number) => void;
  tickNow: () => void;
  reset: () => void;
};

export const useGlobalLocationStore = create<State & Actions>((set, get) => ({
  status: "idle",
  coords: undefined,
  tzIana: undefined,
  locale: undefined,
  error: undefined,
  watchId: undefined,
  nowTick: Date.now(),

  setStatus: (status) => set({ status }),
  setCoords: (coords) => set({ coords }),
  setTzIana: (tzIana) => set({ tzIana }),
  setLocale: (locale) => set({ locale }),
  setError: (error) => set({ error }),
  setWatchId: (watchId) => set({ watchId }),
  tickNow: () => set({ nowTick: Date.now() }),

  reset: () => set({
    status: "idle",
    coords: undefined,
    tzIana: undefined,
    locale: undefined,
    error: undefined,
    watchId: undefined,
    nowTick: Date.now(),
  }),
}));
`);

// 2) Hook: live location + live timezone (by coords)
W("src/features/global/useLiveLocation.ts", `import { useEffect, useMemo, useRef } from "react";
import tzLookup from "tz-lookup";
import { useGlobalLocationStore } from "@/stores/globalLocationStore";

/**
 * useLiveLocation()
 * - Localização ao vivo via watchPosition()
 * - Timezone IANA derivado por coordenadas (tz-lookup)
 * - "Clock" ao vivo (tick) para UI/PDF/RunPro
 * - Nunca trava o app: se negar permissão, mantém status e segue.
 */
export function useLiveLocation(options?: {
  enableHighAccuracy?: boolean;
  timeoutMs?: number;
  maximumAgeMs?: number;
  minUpdateMs?: number; // rate-limit interno
}) {
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
    if (clockTimerRef.current) window.clearInterval(clockTimerRef.current);
    clockTimerRef.current = window.setInterval(() => tickNow(), 1000);
    return () => {
      if (clockTimerRef.current) window.clearInterval(clockTimerRef.current);
      clockTimerRef.current = null;
    };
  }, [tickNow]);

  // Auto-start: não atrapalha onboarding/fluxo — se negar, seguimos
  useEffect(() => {
    // inicia uma vez
    if (status === "idle") start();
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
`);

// 3) UI pequeno e discreto: status + botão (não invade a tela)
W("src/components/global/LiveLocationPill.tsx", `import React from "react";
import { useLiveLocation } from "@/features/global/useLiveLocation";

export function LiveLocationPill() {
  const { status, coords, tzIana, nowInTz, start } = useLiveLocation();

  // Minimalista e premium (não polui UI)
  const label =
    status === "watching" ? "Ao vivo" :
    status === "starting" ? "Ativando…" :
    status === "denied" ? "Localização negada" :
    status === "unavailable" ? "Sem GPS" :
    status === "error" ? "Erro no GPS" : "GPS";

  const sub =
    status === "watching" && coords
      ? \`\${coords.lat.toFixed(4)}, \${coords.lon.toFixed(4)} • \${tzIana || "TZ"} • \${nowInTz}\`
      : (tzIana ? \`\${tzIana} • \${nowInTz}\` : nowInTz);

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="rounded-2xl border border-white/10 bg-black/70 backdrop-blur px-4 py-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <div className="min-w-0">
            <div className="text-xs font-semibold text-white/90">{label}</div>
            <div className="text-[11px] text-white/60 truncate max-w-[320px]">{sub}</div>
          </div>
          {(status === "denied" || status === "idle" || status === "error") && (
            <button
              onClick={start}
              className="ml-2 rounded-xl bg-white/10 px-3 py-1 text-[11px] font-semibold text-white hover:bg-white/15"
            >
              Ativar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
`);

// 4) Injetar no app sem quebrar nada: App.tsx (fallback: main layout)
const candidates = ["src/App.tsx", "src/main.tsx", "src/pages/_app.tsx"];
let injected = false;

for (const file of candidates) {
  if (!E(file)) continue;
  P(file, (s) => {
    if (s.includes("LiveLocationPill")) return s;

    // tenta inserir import
    if (!s.includes('from "@/components/global/LiveLocationPill"')) {
      // coloca depois dos imports existentes
      s = s.replace(/(^import[\\s\\S]*?\\n)\\n/m, (m) => m + 'import { LiveLocationPill } from "@/components/global/LiveLocationPill";\\n\\n');
      if (!s.includes("LiveLocationPill")) {
        // se falhar o regex acima, só prepend
        s = 'import { LiveLocationPill } from "@/components/global/LiveLocationPill";\\n' + s;
      }
    }

    // injeta no JSX: antes do fechamento do root mais externo comum
    // heurística: procurar por </BrowserRouter> ou </Router> ou </div> do wrapper final
    const markers = ["</BrowserRouter>", "</Router>", "</div>"];
    for (const mk of markers) {
      const idx = s.lastIndexOf(mk);
      if (idx !== -1) {
        const before = s.slice(0, idx);
        const after = s.slice(idx);
        if (!before.includes("<LiveLocationPill")) {
          s = before + "  <LiveLocationPill />\n" + after;
          injected = true;
        }
        break;
      }
    }

    return s;
  });
  if (injected) break;
}

if (!injected) {
  console.log("WARN: Não consegui auto-injetar LiveLocationPill. Injete manualmente no layout principal.");
} else {
  console.log("INJECT_OK: LiveLocationPill inserido em arquivo raiz.");
}

// 5) Helpers para uso no PDF/RunPro (opcional mas útil)
W("src/utils/timezoneNow.ts", `import { useGlobalLocationStore } from "@/stores/globalLocationStore";

export function getActiveTimezoneIana() {
  const tz = useGlobalLocationStore.getState().tzIana;
  if (tz) return tz;
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

export function formatNowInActiveTz(locale = "pt-BR") {
  const tz = getActiveTimezoneIana();
  const now = new Date();
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone: tz,
      dateStyle: "medium",
      timeStyle: "medium",
    }).format(now);
  } catch {
    return now.toLocaleString(locale);
  }
}
`);
