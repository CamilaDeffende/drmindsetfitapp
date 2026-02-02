import { useLocation } from "react-router-dom";
import { useLiveLocation } from "@/features/global/useLiveLocation";

export function LiveLocationPill() {
    // __MF_LIVEPILL_ROUTE_GUARD__ (sem quebrar rules-of-hooks)
    const { pathname } = useLocation();
  const __mfLiveEnabled = /^\/(running|corrida)/.test(pathname);

const { status, coords, tzIana, nowInTz, start } = useLiveLocation({ enabled: __mfLiveEnabled });

  if (!__mfLiveEnabled) return null;

  // Minimalista e premium (não polui UI)
  const label =
    status === "watching" ? "Ao vivo" :
    status === "starting" ? "Ativando…" :
    status === "denied" ? "Localização negada" :
    status === "unavailable" ? "Sem GPS" :
    status === "error" ? "Erro no GPS" : "GPS";

  const sub =
    status === "watching" && coords
      ? `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)} • ${tzIana || "TZ"} • ${nowInTz}`
      : (tzIana ? `${tzIana} • ${nowInTz}` : nowInTz);

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
