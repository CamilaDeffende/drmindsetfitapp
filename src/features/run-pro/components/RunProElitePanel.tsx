import { useRunProEliteSession } from "@/features/run-pro/session/useRunProEliteSession";
import { formatTsInActiveTz } from "@/features/run-pro/utils/timeLabel";

import { RunProEliteCharts } from "@/features/run-pro/components/RunProEliteCharts";
function fmtPace(secPerKm?: number) {
  if (!secPerKm || !Number.isFinite(secPerKm)) return "—";
  const m = Math.floor(secPerKm / 60);
  const s = Math.floor(secPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")} /km`;
}

function fmtDist(m: number) {
  if (!Number.isFinite(m)) return "0.00 km";
  return `${(m / 1000).toFixed(2)} km`;
}

export function RunProElitePanel() {
  const { isRunning, st, startRun, stopRun } = useRunProEliteSession();
  const last = st.stats.lastFix;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-white/90">Corrida PRO Elite</div>
          <div className="mt-1 text-xs text-white/60">
            Status:{" "}
            <span className="text-white/80">
              {isRunning ? "AO VIVO" : "Pausado"}
            </span>
          </div>
        </div>

        <button
          onClick={isRunning ? stopRun : startRun}
          className="rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15"
        >
          {isRunning ? "Finalizar" : "Iniciar"}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
          <div className="text-[11px] text-white/55">Distância</div>
          <div className="mt-1 text-sm font-semibold text-white/90">{fmtDist(st.stats.distanceM)}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
          <div className="text-[11px] text-white/55">Pace médio</div>
          <div className="mt-1 text-sm font-semibold text-white/90">{fmtPace(st.stats.paceSecPerKm)}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
          <div className="text-[11px] text-white/55">Fixes</div>
          <div className="mt-1 text-sm font-semibold text-white/90">
            {st.stats.acceptedFixes} ok • {st.stats.droppedFixes} drop
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
          <div className="text-[11px] text-white/55">Último update</div>
          <div className="mt-1 text-sm font-semibold text-white/90">
            {last ? formatTsInActiveTz(last.ts) : "—"}
          </div>
          <div className="mt-1 text-[11px] text-white/55 truncate">
            {last ? `${last.lat.toFixed(5)}, ${last.lon.toFixed(5)} • acc ${Math.round(last.accuracyM)}m` : ""}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-3">
        <div className="text-[11px] text-white/55">Splits (km)</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {st.stats.splitsSecPerKm.length ? (
            st.stats.splitsSecPerKm.slice(-10).map((sec, i) => (
              <span key={i} className="rounded-xl bg-white/10 px-3 py-1 text-[11px] text-white/80">
                {st.stats.splitsSecPerKm.length - 10 + i + 1}km • {fmtPace(sec)}
              </span>
            ))
          ) : (
            <span className="text-[12px] text-white/45">Ainda não fechou 1km.</span>
          )}
        </div>
      </div>
    
      <div className="mt-4"><RunProEliteCharts /></div>
</div>
  );
}
